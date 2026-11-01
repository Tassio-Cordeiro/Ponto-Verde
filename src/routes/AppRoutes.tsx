import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { TelaInicial } from '../pages/totem/TelaInicial.tsx';
import { ListaProdutos } from '../pages/totem/ListaProdutos.tsx';
import { DetalhesProduto } from '../pages/totem/DetalhesProduto.tsx';
import { Carrinho } from '../pages/totem/Carrinho.tsx';
import { Pagamento } from '../pages/totem/Pagamento.tsx';
import { EscolhaComprovante, EmailComprovanteForm } from '../pages/totem/Comprovante.tsx';
import { TelaConclusao } from '../pages/totem/TelaConclusao.tsx';
import { Login } from '../pages/admin/Login.tsx';
import { Dashboard } from '../pages/admin/Dashboard.tsx';
import { Clientes } from '../pages/admin/Clientes.tsx';
import { Produtos } from '../pages/admin/Produtos.tsx';
import { EditarProduto } from '../pages/admin/EditarProduto.tsx';
import { Preparacao } from '../pages/admin/Preparacao.tsx';
import { TotemLayout } from '../layouts/TotemLayout.tsx';
import { AdminLayout } from '../layouts/AdminLayout.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { useAtendimento } from '../hooks/useAtendimento.ts';
import { useLoja } from '../hooks/useLoja.ts';
import { EstadoCarregamento, EstadoErro } from '../components/shared/Estados.tsx';

function FluxoCompra({ etapa }: { etapa: 'selecao' | 'pagamento' | 'comprovante' }) {
  const { atendimento, vendaAtual } = useAtendimento();
  const { carrinho, carregando, pronto, erro, recarregar } = useLoja();
  if (!atendimento) return <Navigate to="/" replace />;
  if (atendimento.etapa === 'concluido') return <Navigate to="/conclusao" replace />;
  if (etapa === 'comprovante')
    return vendaAtual ? <Outlet /> : <Navigate to="/pagamento" replace />;
  if (vendaAtual) return <Navigate to="/comprovante" replace />;
  if (etapa === 'pagamento') {
    if (carregando || (!pronto && !erro)) return <EstadoCarregamento />;
    if (erro && !atendimento.confirmado)
      return <EstadoErro mensagem={erro} tentarNovamente={recarregar} />;
    if (!carrinho.length && !atendimento.confirmado) return <Navigate to="/carrinho" replace />;
    if (atendimento.identificacao === 'pendente') return <Navigate to="/produtos" replace />;
  }
  if (etapa === 'selecao' && atendimento.confirmado) return <Navigate to="/pagamento" replace />;
  return <Outlet />;
}
function NaoEncontrada() {
  return (
    <Center mih="100svh" p="xl">
      <Stack align="center">
        <Text c="verde.7" fw={800} size="70px">
          404
        </Text>
        <Title order={2}>Essa página não está por aqui</Title>
        <Text c="dimmed">Confira o endereço ou volte ao início.</Text>
        <Button component={Link} to="/">
          Voltar ao início
        </Button>
      </Stack>
    </Center>
  );
}
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TelaInicial />} />
      <Route element={<TotemLayout />}>
        <Route element={<FluxoCompra etapa="selecao" />}>
          <Route path="/produtos" element={<ListaProdutos />} />
          <Route path="/produtos/:id" element={<DetalhesProduto />} />
          <Route path="/carrinho" element={<Carrinho />} />
        </Route>
        <Route element={<FluxoCompra etapa="pagamento" />}>
          <Route path="/pagamento" element={<Pagamento />} />
        </Route>
        <Route element={<FluxoCompra etapa="comprovante" />}>
          <Route path="/comprovante" element={<EscolhaComprovante />} />
          <Route path="/comprovante/email" element={<EmailComprovanteForm />} />
        </Route>
      </Route>
      <Route path="/conclusao" element={<TelaConclusao />} />
      <Route path="/admin/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="produtos/novo" element={<EditarProduto novo />} />
          <Route path="produtos/:id/editar" element={<EditarProduto />} />
          <Route path="preparacao" element={<Preparacao />} />
        </Route>
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
