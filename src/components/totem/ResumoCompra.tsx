import { Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import type { Resumo } from '../../types/index.ts';
import { moeda } from '../../utils/moeda.ts';
export function ResumoCompra({ resumo, children }: { resumo: Resumo; children?: ReactNode }) {
  return (
    <Paper
      component="section"
      aria-label="Resumo da compra"
      withBorder
      p="xl"
      className="resumo-compra"
    >
      <Stack gap="md">
        <Title order={3}>Resumo da compra</Title>
        <Group justify="space-between">
          <Text c="dimmed">Subtotal</Text>
          <Text component="output" aria-label="Subtotal da compra">
            {moeda(resumo.subtotal)}
          </Text>
        </Group>
        <Group justify="space-between" c="verde.7">
          <Text>Descontos</Text>
          <Text component="output" aria-label="Descontos da compra">
            − {moeda(resumo.descontos)}
          </Text>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text fw={700}>Total</Text>
          <Text component="output" aria-label="Total da compra" size="27px" fw={800} c="verde.8">
            {moeda(resumo.total)}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          Pagamento, impressão e envio de comprovante são simulados.
        </Text>
        {children}
      </Stack>
    </Paper>
  );
}
