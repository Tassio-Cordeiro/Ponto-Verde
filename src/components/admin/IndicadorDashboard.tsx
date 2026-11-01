import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
export function IndicadorDashboard({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: ReactNode;
}) {
  return (
    <Paper withBorder p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {titulo}
          </Text>
          <ThemeIcon variant="light" size={38} radius="md">
            {icone}
          </ThemeIcon>
        </Group>
        <Stack gap={2}>
          <Text size="30px" fw={750} lts={-1}>
            {valor}
          </Text>
          <Text c="dimmed" size="xs">
            {detalhe}
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
}
