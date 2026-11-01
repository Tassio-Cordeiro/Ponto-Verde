import { useState } from 'react';
import { Anchor, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { Produto } from '../../types/index.ts';
import { ImagemProduto } from '../shared/ImagemProduto.tsx';
import { SeletorQuantidade } from './SeletorQuantidade.tsx';
import { moeda, precoFinal } from '../../utils/moeda.ts';
import { useLoja } from '../../hooks/useLoja.ts';
export function CardProduto({ produto }: { produto: Produto }) {
  const [quantidade, setQuantidade] = useState(1);
  const { adicionar, carrinho } = useLoja();
  const naSacola = carrinho.find((item) => item.produtoId === produto.id)?.quantidade ?? 0;
  const disponivel = Math.max(0, produto.estoque - naSacola);
  return (
    <Card
      component="article"
      aria-label={`Produto ${produto.nome}`}
      withBorder
      padding="md"
      radius="lg"
      className="produto-card"
    >
      <Card.Section className="produto-imagem">
        <Anchor
          component={Link}
          to={`/produtos/${produto.id}`}
          aria-label={`Ver detalhes de ${produto.nome}`}
        >
          <ImagemProduto
            key={produto.imagem}
            src={produto.imagem}
            nome={produto.nome}
            altura={170}
          />
        </Anchor>
        {produto.desconto > 0 && (
          <Badge className="desconto-badge" color="verde" variant="light">
            −{produto.desconto.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
          </Badge>
        )}
      </Card.Section>
      <Stack gap={5} mt="md" flex={1}>
        <Text size="xs" c="dimmed">
          {produto.grupo} · unidade
        </Text>
        <Anchor
          component={Link}
          to={`/produtos/${produto.id}`}
          c="dark"
          fw={650}
          size="lg"
          underline="hover"
        >
          {produto.nome}
        </Anchor>
        <Group align="baseline" gap={8} mt={4}>
          <Text fw={800} c="verde.8" size="24px">
            {moeda(precoFinal(produto))}
          </Text>
          {produto.desconto > 0 && (
            <Text size="xs" c="dimmed" td="line-through">
              {moeda(produto.precoCentavos)}
            </Text>
          )}
        </Group>
        <Text size="xs" c={disponivel > 0 ? 'dimmed' : 'red'}>
          {disponivel > 0
            ? `${disponivel} disponíveis${naSacola ? ` · ${naSacola} na sacola` : ''}`
            : 'Estoque indisponível'}
        </Text>
      </Stack>
      <Group justify="space-between" mt="md" gap={8} wrap="nowrap">
        <SeletorQuantidade
          nomeProduto={produto.nome}
          valor={Math.min(quantidade, Math.max(1, disponivel))}
          maximo={disponivel}
          aoAlterar={setQuantidade}
        />
        <Button
          aria-label={`Adicionar ${produto.nome} ao carrinho`}
          px={14}
          size="sm"
          h={44}
          disabled={disponivel === 0}
          onClick={() => adicionar(produto.id, Math.min(quantidade, disponivel))}
        >
          Adicionar
        </Button>
      </Group>
    </Card>
  );
}
