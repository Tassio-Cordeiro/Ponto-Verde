import { useState } from 'react';
import { Badge, Box, Group, SimpleGrid, Stack, Tabs, Text, Title } from '@mantine/core';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { CardPedido } from '../../components/admin/CardPedido.tsx';
import { EstadoVazio } from '../../components/shared/Estados.tsx';
export function Preparacao() {
  const { vendas } = useAtendimento();
  const [aba, setAba] = useState<string | null>('ativos');
  const concluidos = vendas.filter((venda) => venda.preparacao === 'concluido');
  const ativos = vendas.filter((venda) => venda.preparacao !== 'concluido');
  const pedidos = aba === 'concluidos' ? [...concluidos].reverse() : ativos;
  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Box>
          <Text className="sobretitulo">DA SACOLA PARA AS MÃOS</Text>
          <Title className="titulo-admin">Preparação de pedidos</Title>
          <Text size="sm" c="dimmed" mt={6}>
            Organize, prepare e entregue cada compra com cuidado.
          </Text>
        </Box>
        <Badge variant="light" size="lg">
          {ativos.length} pedidos ativos
        </Badge>
      </Group>
      <Tabs value={aba} onChange={setAba}>
        <Tabs.List>
          <Tabs.Tab value="ativos">Ativos ({ativos.length})</Tabs.Tab>
          <Tabs.Tab value="concluidos">Concluídos ({concluidos.length})</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {!pedidos.length ? (
        <EstadoVazio
          titulo={aba === 'concluidos' ? 'Nenhum pedido concluído' : 'Tudo em dia por aqui'}
          descricao={
            aba === 'concluidos'
              ? 'Os pedidos entregues aparecerão nesta aba.'
              : 'Novas compras aprovadas no totem aparecerão automaticamente.'
          }
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
          {pedidos.map((pedido) => (
            <CardPedido key={pedido.id} pedido={pedido} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
