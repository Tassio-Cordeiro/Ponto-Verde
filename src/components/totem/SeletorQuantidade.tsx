import { ActionIcon, Group, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
export function SeletorQuantidade({
  valor,
  maximo,
  aoAlterar,
  minimo = 1,
  nomeProduto,
}: {
  valor: number;
  maximo: number;
  aoAlterar: (valor: number) => void;
  minimo?: number;
  nomeProduto: string;
}) {
  return (
    <Group
      role="group"
      aria-label={`Quantidade de ${nomeProduto}`}
      gap={5}
      wrap="nowrap"
      className="quantidade"
    >
      <ActionIcon
        size={44}
        variant="subtle"
        aria-label={`Diminuir quantidade de ${nomeProduto}`}
        disabled={valor <= minimo}
        onClick={() => aoAlterar(valor - 1)}
      >
        <IconMinus size={18} />
      </ActionIcon>
      <Text
        component="output"
        aria-label={`Quantidade selecionada de ${nomeProduto}`}
        fw={700}
        w={24}
        ta="center"
        aria-live="polite"
      >
        {valor}
      </Text>
      <ActionIcon
        size={44}
        variant="subtle"
        aria-label={`Aumentar quantidade de ${nomeProduto}`}
        disabled={valor >= maximo}
        onClick={() => aoAlterar(valor + 1)}
      >
        <IconPlus size={18} />
      </ActionIcon>
    </Group>
  );
}
