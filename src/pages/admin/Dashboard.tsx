import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconCash,
  IconReceipt,
  IconShoppingBag,
  IconClock,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useVendas } from '../../hooks/useVendas.ts';
import type { Periodo } from '../../hooks/useVendas.ts';
import { IndicadorDashboard } from '../../components/admin/IndicadorDashboard.tsx';
import { EstadoVazio } from '../../components/shared/Estados.tsx';
import { moeda } from '../../utils/moeda.ts';
import { statusPedido } from '../../utils/pedidos.ts';

export function Dashboard() {
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const indicadores = useVendas(periodo);
  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Box>
          <Text className="sobretitulo">DE OLHO NO SEU MERCADO</Text>
          <Title className="titulo-admin">Visão geral</Title>
          <Text c="dimmed" size="sm" mt={6}>
            Cada compra, uma nova história por aqui.
          </Text>
        </Box>
        <Select
          aria-label="Filtrar período"
          w={185}
          value={periodo}
          allowDeselect={false}
          onChange={(valor) => {
            if (valor === 'hoje' || valor === '7dias' || valor === '30dias' || valor === 'todos')
              setPeriodo(valor);
          }}
          data={[
            { value: 'hoje', label: 'Hoje' },
            { value: '7dias', label: 'Últimos 7 dias' },
            { value: '30dias', label: 'Últimos 30 dias' },
            { value: 'todos', label: 'Todo o período' },
          ]}
        />
      </Group>
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <IndicadorDashboard
          titulo="Total vendido"
          valor={moeda(indicadores.total)}
          detalhe="Somente pagamentos aprovados"
          icone={<IconCash size={21} />}
        />
        <IndicadorDashboard
          titulo="Vendas realizadas"
          valor={String(indicadores.quantidade)}
          detalhe="Uma venda por atendimento"
          icone={<IconReceipt size={21} />}
        />
        <IndicadorDashboard
          titulo="Ticket médio"
          valor={moeda(indicadores.ticketMedio)}
          detalhe="Valor médio por compra"
          icone={<IconShoppingBag size={21} />}
        />
        <IndicadorDashboard
          titulo="Pedidos na fila"
          valor={String(indicadores.aguardando)}
          detalhe={`${indicadores.emPreparacao} em preparação`}
          icone={<IconClock size={21} />}
        />
      </SimpleGrid>
      {!indicadores.quantidade ? (
        <EstadoVazio
          titulo="Seu próximo resultado começa com uma compra"
          descricao="As vendas aprovadas no totem aparecerão aqui. Não há vendas no período selecionado."
          acao={
            <Button component={Link} to="/">
              Ir para o totem
            </Button>
          }
        />
      ) : (
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder p="lg">
              <Group justify="space-between" mb="lg">
                <Title order={3}>Vendas recentes</Title>
                <Badge variant="light">{indicadores.quantidade} vendas</Badge>
              </Group>
              <Table.ScrollContainer minWidth={540}>
                <Table verticalSpacing="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Pedido</Table.Th>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th>Total</Table.Th>
                      <Table.Th>Preparação</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[...indicadores.vendas]
                      .reverse()
                      .slice(0, 8)
                      .map((venda) => (
                        <Table.Tr key={venda.id}>
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {venda.numero}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(venda.data).toLocaleString('pt-BR')}
                            </Text>
                          </Table.Td>
                          <Table.Td>{venda.cliente?.nome ?? 'Visitante'}</Table.Td>
                          <Table.Td fw={650}>{moeda(venda.total)}</Table.Td>
                          <Table.Td>
                            <Badge color={statusPedido[venda.preparacao].cor} variant="light">
                              {statusPedido[venda.preparacao].texto}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder p="lg">
              <Title order={3} mb="xl">
                Mais vendidos
              </Title>
              <Stack gap="lg">
                {indicadores.maisVendidos.map((item, indice) => (
                  <Box key={item.nome}>
                    <Group justify="space-between" mb={7}>
                      <Text size="sm" fw={600}>
                        {indice + 1}. {item.nome}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.quantidade} un.
                      </Text>
                    </Group>
                    <Progress
                      value={
                        (item.quantidade / (indicadores.maisVendidos[0]?.quantidade ?? 1)) * 100
                      }
                      size={5}
                    />
                    <Text size="xs" c="dimmed" mt={5}>
                      {moeda(item.total)}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      )}
      <Paper className="banner-admin" p="xl">
        <Group justify="space-between">
          <Box>
            <Title order={3}>Tem compra boa saindo por aí.</Title>
            <Text size="sm" c="dimmed" mt={5}>
              Acompanhe os pedidos da chegada até a entrega.
            </Text>
          </Box>
          <Button
            component={Link}
            to="/admin/preparacao"
            rightSection={<IconArrowRight size={18} />}
          >
            Ver preparação
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
