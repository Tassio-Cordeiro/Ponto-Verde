import { ActionIcon, Group, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
export function SeletorQuantidade({
  valor,
  maximo,
  aoAlterar,
  minimo = 1,
}: {
  valor: number;
  maximo: number;
  aoAlterar: (valor: number) => void;
  minimo?: number;
}) {
  return (
    <Group gap={5} wrap="nowrap" className="quantidade">
      <ActionIcon
        size={44}
        variant="subtle"
        aria-label="Diminuir quantidade"
        disabled={valor <= minimo}
        onClick={() => aoAlterar(valor - 1)}
      >
        <IconMinus size={18} />
      </ActionIcon>
      <Text fw={700} w={24} ta="center" aria-live="polite">
        {valor}
      </Text>
      <ActionIcon
        size={44}
        variant="subtle"
        aria-label="Aumentar quantidade"
        disabled={valor >= maximo}
        onClick={() => aoAlterar(valor + 1)}
      >
        <IconPlus size={18} />
      </ActionIcon>
    </Group>
  );
}
