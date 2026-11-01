import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconLeaf } from '@tabler/icons-react';
import { config } from '../../app/config.ts';
export function Marca({ clara = false }: { clara?: boolean }) {
  return (
    <Group gap={10} wrap="nowrap" className="marca" c={clara ? 'white' : 'verde.9'}>
      <ThemeIcon
        size={46}
        radius="xl"
        color={clara ? 'white' : 'verde'}
        variant={clara ? 'transparent' : 'light'}
      >
        <IconLeaf size={29} stroke={1.6} color={clara ? 'white' : undefined} />
      </ThemeIcon>
      <Stack gap={0}>
        <Text fw={800} size="xl" lh={1.1}>
          {config.marca}
        </Text>
        <Text size="xs" tt="uppercase" lts={2.2} opacity={0.7}>
          {config.descricao}
        </Text>
      </Stack>
    </Group>
  );
}
