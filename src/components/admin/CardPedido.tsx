import { Badge, Button, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCheck, IconChefHat } from '@tabler/icons-react';
import type { Venda } from '../../types/index.ts';
import { statusPedido } from '../../utils/pedidos.ts';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { moeda } from '../../utils/moeda.ts';
import { notifications } from '@mantine/notifications';
import { mensagemErro } from '../../hooks/useApi.ts';
export function CardPedido({ pedido }: { pedido: Venda }) {
  const { atualizarPreparacao } = useAtendimento();
  function avancar() {
    try {
      atualizarPreparacao(
        pedido.id,
        pedido.preparacao === 'aguardando' ? 'em_preparacao' : 'concluido',
      );
    } catch (erro: unknown) {
      notifications.show({
        color: 'red',
        title: 'Não foi possível atualizar',
        message: mensagemErro(erro),
      });
    }
  }
  return (
    <Paper withBorder p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>{pedido.numero}</Title>
          <Badge color={statusPedido[pedido.preparacao].cor} variant="light">
            {statusPedido[pedido.preparacao].texto}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {new Date(pedido.data).toLocaleString('pt-BR')}
        </Text>
        <Text fw={650}>{pedido.cliente?.nome ?? 'Visitante'}</Text>
        <Divider />
        {pedido.itens.map((item) => (
          <Group key={item.produtoId} justify="space-between" wrap="nowrap">
            <Text size="sm">{item.nome}</Text>
            <Badge color="gray" variant="light" miw={45}>
              {item.quantidade} un.
            </Badge>
          </Group>
        ))}
        <Divider />
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Pagamento aprovado
          </Text>
          <Text fw={700}>{moeda(pedido.total)}</Text>
        </Group>
        {pedido.inicioPreparacao && (
          <Text size="xs" c="dimmed">
            Iniciado às {new Date(pedido.inicioPreparacao).toLocaleTimeString('pt-BR')}
          </Text>
        )}
        {pedido.fimPreparacao && (
          <Text size="xs" c="dimmed">
            Concluído às {new Date(pedido.fimPreparacao).toLocaleTimeString('pt-BR')}
          </Text>
        )}
        {pedido.preparacao !== 'concluido' && (
          <Button
            fullWidth
            color={pedido.preparacao === 'aguardando' ? 'blue' : 'verde'}
            leftSection={
              pedido.preparacao === 'aguardando' ? (
                <IconChefHat size={19} />
              ) : (
                <IconCheck size={19} />
              )
            }
            onClick={avancar}
          >
            {pedido.preparacao === 'aguardando' ? 'Em preparação' : 'Concluir pedido'}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
