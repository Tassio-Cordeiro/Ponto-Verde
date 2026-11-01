import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { ajustesSchema, itemCarrinhoSchema } from '../schemas/dominio.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { useApi } from '../hooks/useApi.ts';
import {
  listarProdutos,
  salvarProdutoRemoto,
  excluirProdutoRemoto,
} from '../services/produtosService.ts';
import { calcularResumo, descontoUnitario } from '../utils/moeda.ts';
import { aplicarAjustes, ajustarCarrinho } from '../utils/catalogo.ts';
import type { Ajustes, ItemCarrinho, Produto, Resumo } from '../types/index.ts';

const carrinhoSchema = z.array(itemCarrinhoSchema);
const carrinhoInicial: ItemCarrinho[] = [];
const ajustesIniciais: Ajustes = { produtos: [], excluidos: [] };
interface LojaContexto {
  produtos: Produto[];
  carrinho: ItemCarrinho[];
  resumo: Resumo;
  quantidade: number;
  carregando: boolean;
  erro: string | null;
  pronto: boolean;
  recarregar: () => void;
  adicionar: (produtoId: string, quantidade: number) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  salvarProduto: (produto: Produto, novo: boolean) => Promise<void>;
  excluirProduto: (produto: Produto) => Promise<void>;
}
export const LojaContext = createContext<LojaContexto | undefined>(undefined);
export function LojaProvider({ children }: { children: ReactNode }) {
  const [originais, setOriginais] = useState<Produto[]>([]);
  const [pronto, setPronto] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [ajustes, setAjustes] = useLocalStorage('catalogo', ajustesSchema, ajustesIniciais);
  const [carrinho, setCarrinho] = useLocalStorage('carrinho', carrinhoSchema, carrinhoInicial);
  const requisicao = useApi<Produto[]>();
  const { executar } = requisicao;
  useEffect(() => {
    const controlador = new AbortController();
    void executar(() => listarProdutos(controlador.signal)).then((dados) => {
      if (dados && !controlador.signal.aborted) {
        setOriginais(dados);
        setPronto(true);
      }
    });
    return () => controlador.abort();
  }, [executar, tentativa]);
  const produtos = useMemo(() => aplicarAjustes(originais, ajustes), [originais, ajustes]);
  useEffect(() => {
    if (!pronto) return;
    const ajustado = ajustarCarrinho(carrinho, produtos);
    if (JSON.stringify(ajustado) !== JSON.stringify(carrinho)) {
      setCarrinho(ajustado);
      notifications.show({
        color: 'orange',
        title: 'Carrinho atualizado',
        message: 'Um produto foi removido ou teve o estoque reduzido. Confira sua compra.',
      });
    }
  }, [produtos, pronto, carrinho, setCarrinho]);
  const resumo = calcularResumo(
    carrinho.flatMap((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      return produto
        ? [
            {
              produtoId: produto.id,
              dummyJsonId: produto.dummyJsonId,
              nome: produto.nome,
              quantidade: item.quantidade,
              precoCentavos: produto.precoCentavos,
              descontoUnitarioCentavos: descontoUnitario(produto),
              imagem: produto.imagem,
            },
          ]
        : [];
    }),
  );
  function alterarQuantidade(produtoId: string, quantidade: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;
    const ajustada = Math.max(0, Math.min(Math.trunc(quantidade), produto.estoque));
    setCarrinho((anterior) =>
      ajustada === 0
        ? anterior.filter((item) => item.produtoId !== produtoId)
        : anterior.some((item) => item.produtoId === produtoId)
          ? anterior.map((item) =>
              item.produtoId === produtoId ? { ...item, quantidade: ajustada } : item,
            )
          : [...anterior, { produtoId, quantidade: ajustada }],
    );
  }
  function adicionar(produtoId: string, quantidade: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto || produto.estoque === 0) return;
    setCarrinho((anterior) => {
      const atual = anterior.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;
      const nova = Math.min(atual + Math.max(1, Math.trunc(quantidade)), produto.estoque);
      return atual
        ? anterior.map((item) =>
            item.produtoId === produtoId ? { ...item, quantidade: nova } : item,
          )
        : [...anterior, { produtoId, quantidade: nova }];
    });
    notifications.show({
      title: 'Na sua sacola!',
      message: `${produto.nome} adicionado à compra.`,
      autoClose: 1800,
    });
  }
  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
  }, [setCarrinho]);
  async function salvarProduto(produto: Produto, novo: boolean) {
    if (novo || produto.dummyJsonId) await salvarProdutoRemoto(produto, novo);
    setAjustes((anterior) => ({
      ...anterior,
      produtos: [...anterior.produtos.filter((p) => p.id !== produto.id), produto],
    }));
  }
  async function excluirProduto(produto: Produto) {
    if (produto.dummyJsonId) await excluirProdutoRemoto(produto.dummyJsonId);
    setAjustes((anterior) => ({
      produtos: anterior.produtos.filter((p) => p.id !== produto.id),
      excluidos: [...new Set([...anterior.excluidos, produto.id])],
    }));
  }
  return (
    <LojaContext.Provider
      value={{
        produtos,
        carrinho,
        resumo,
        quantidade: carrinho.reduce((s, i) => s + i.quantidade, 0),
        carregando: requisicao.carregando,
        erro: requisicao.erro,
        pronto,
        recarregar: () => setTentativa((v) => v + 1),
        adicionar,
        alterarQuantidade,
        limparCarrinho,
        salvarProduto,
        excluirProduto,
      }}
    >
      {children}
    </LojaContext.Provider>
  );
}
