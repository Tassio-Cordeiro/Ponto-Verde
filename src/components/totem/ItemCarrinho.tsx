import { ActionIcon, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { ImagemProduto } from '../shared/ImagemProduto.tsx';
import { SeletorQuantidade } from './SeletorQuantidade.tsx';
import type { Produto } from '../../types/index.ts';
import { moeda, precoFinal } from '../../utils/moeda.ts';
import { useLoja } from '../../hooks/useLoja.ts';
export function ItemCarrinho({ produto, quantidade }: { produto: Produto; quantidade: number }) {
  const { alterarQuantidade } = useLoja();
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" gap="md">
        <Group wrap="nowrap">
          <Box w={75} miw={75}>
            <ImagemProduto
              key={produto.imagem}
              src={produto.imagem}
              nome={produto.nome}
              altura={75}
            />
          </Box>
          <Stack gap={3}>
            <Text fw={650}>{produto.nome}</Text>
            <Text size="sm" c="dimmed">
              {moeda(precoFinal(produto))} / unidade
            </Text>
          </Stack>
        </Group>
        <Group>
          <SeletorQuantidade
            valor={quantidade}
            maximo={produto.estoque}
            aoAlterar={(q) => alterarQuantidade(produto.id, q)}
          />
          <Text fw={750} miw={90}>
            {moeda(precoFinal(produto) * quantidade)}
          </Text>
          <ActionIcon
            color="red"
            variant="subtle"
            size={44}
            aria-label={`Remover ${produto.nome}`}
            onClick={() => alterarQuantidade(produto.id, 0)}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
