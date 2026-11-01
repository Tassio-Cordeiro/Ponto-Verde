import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { autenticar, buscarPerfil } from '../services/authService.ts';
import { encerrarSessao, lerTokens, renovarTokens } from '../services/api.ts';
import type { Perfil, Tokens } from '../types/index.ts';
import { mensagemErro } from '../hooks/useApi.ts';

interface AuthContexto {
  usuario: Perfil | null;
  tokens: Tokens | null;
  verificando: boolean;
  erroSessao: string | null;
  login: (username: string, password: string) => Promise<Perfil>;
  renovar: () => Promise<void>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContexto | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Perfil | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(lerTokens);
  const [verificando, setVerificando] = useState(true);
  const [erroSessao, setErroSessao] = useState<string | null>(null);
  useEffect(() => {
    const controlador = new AbortController();
    if (!lerTokens()) {
      setVerificando(false);
      return;
    }
    void buscarPerfil(controlador.signal)
      .then((perfil) => {
        if (!controlador.signal.aborted) setUsuario(perfil);
      })
      .catch((erro: unknown) => {
        if (!controlador.signal.aborted && !axios.isCancel(erro)) {
          setErroSessao(mensagemErro(erro));
          encerrarSessao();
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) setVerificando(false);
      });
    return () => controlador.abort();
  }, []);
  useEffect(() => {
    const sincronizar = () => {
      const atuais = lerTokens();
      setTokens(atuais);
      if (!atuais) {
        setUsuario(null);
        setErroSessao('Sessão encerrada. Entre novamente para continuar.');
      }
    };
    window.addEventListener('ponto-verde:sessao', sincronizar);
    return () => window.removeEventListener('ponto-verde:sessao', sincronizar);
  }, []);
  async function login(username: string, password: string) {
    const perfil = await autenticar(username, password);
    setUsuario(perfil);
    setTokens(lerTokens());
    setErroSessao(null);
    return perfil;
  }
  async function renovar() {
    await renovarTokens();
    setUsuario(await buscarPerfil());
  }
  function logout() {
    encerrarSessao();
    setUsuario(null);
    setTokens(null);
    setErroSessao(null);
  }
  return (
    <AuthContext.Provider
      value={{ usuario, tokens, verificando, erroSessao, login, renovar, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
