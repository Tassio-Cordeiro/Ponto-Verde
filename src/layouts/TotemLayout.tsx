import { Anchor, Badge, Box, Button, Container, Group, Text } from '@mantine/core';
import { IconArrowLeft, IconShoppingBag } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Marca } from '../components/shared/Marca.tsx';
import { useLoja } from '../hooks/useLoja.ts';
import { useAtendimento } from '../hooks/useAtendimento.ts';
import { moeda } from '../utils/moeda.ts';

export function TotemLayout() {
  const { quantidade, resumo } = useLoja();
  const { atendimento, vendaAtual } = useAtendimento();
  const local = useLocation();
  const passo = local.pathname.startsWith('/produtos')
    ? 0
    : local.pathname === '/carrinho'
      ? 1
      : local.pathname === '/pagamento'
        ? 2
        : 3;
  return (
    <Box className="totem-shell">
      <Box component="header" className="cabecalho">
        <Container size="xl">
          <Group justify="space-between" py="md">
            <Anchor component={Link} to="/" underline="never">
              <Marca />
            </Anchor>
            <Group gap="sm">
              <Text visibleFrom="sm" size="sm" c="dimmed">
                {atendimento?.cliente
                  ? `Olá, ${atendimento.cliente.nome.split(' ')[0]}!`
                  : 'Boas compras :)'}
              </Text>
              {!vendaAtual && (
                <Button
                  component={Link}
                  to="/carrinho"
                  variant="light"
                  leftSection={<IconShoppingBag size={20} />}
                >
                  {quantidade}{' '}
                  <Text component="span" visibleFrom="xs" ml={5}>
                    itens · {moeda(resumo.total)}
                  </Text>
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </Box>
      <Container size="xl" py="lg">
        <Group justify="space-between" className="trilha-compra">
          <Anchor component={Link} to={passo === 0 ? '/' : '/produtos'} c="dimmed" size="sm">
            <Group gap={6}>
              <IconArrowLeft size={16} />
              {passo === 0 ? 'Início' : 'Continuar comprando'}
            </Group>
          </Anchor>
          <Group gap={14} visibleFrom="sm">
            {['Escolher', 'Revisar', 'Pagar', 'Comprovante'].map((nome, indice) => (
              <Group gap={6} key={nome}>
                <Badge
                  circle
                  color={indice <= passo ? 'verde' : 'gray'}
                  variant={indice === passo ? 'filled' : 'light'}
                >
                  {indice + 1}
                </Badge>
                <Text
                  size="xs"
                  fw={indice === passo ? 700 : 400}
                  c={indice === passo ? 'verde.8' : 'dimmed'}
                >
                  {nome}
                </Text>
              </Group>
            ))}
          </Group>
        </Group>
      </Container>
      <Container component="main" id="conteudo" size="xl" pb={70}>
        <Outlet />
      </Container>
      <Box component="footer" className="rodape">
        <Container size="xl">
          <Group justify="space-between">
            <Text size="xs">Feito para facilitar o seu dia.</Text>
            <Text size="xs">Projeto educacional · Operações simuladas</Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
