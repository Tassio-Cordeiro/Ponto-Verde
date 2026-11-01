import { useState } from 'react';
import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconShoppingBag } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { useLoja } from '../../hooks/useLoja.ts';
import { ImagemProduto } from '../../components/shared/ImagemProduto.tsx';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
import { SeletorQuantidade } from '../../components/totem/SeletorQuantidade.tsx';
import { moeda, precoFinal } from '../../utils/moeda.ts';
export function DetalhesProduto() {
  const { id } = useParams();
  const { produtos, carregando, erro, recarregar, adicionar, carrinho } = useLoja();
  const [quantidade, setQuantidade] = useState(1);
  const produto = produtos.find((p) => p.id === id);
  if (carregando) return <EstadoCarregamento />;
  if (erro) return <EstadoErro mensagem={erro} tentarNovamente={recarregar} />;
  if (!produto)
    return (
      <EstadoVazio
        titulo="Produto não encontrado"
        descricao="Este identificador é inválido ou o produto foi removido."
        acao={
          <Button component={Link} to="/produtos">
            Ver produtos
          </Button>
        }
      />
    );
  const disponivel = Math.max(
    0,
    produto.estoque - (carrinho.find((i) => i.produtoId === id)?.quantidade ?? 0),
  );
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={50} mt="xl">
      <Paper withBorder p="xl">
        <ImagemProduto key={produto.imagem} src={produto.imagem} nome={produto.nome} altura={380} />
      </Paper>
      <Stack justify="center" gap="lg">
        <Badge variant="light">{produto.grupo}</Badge>
        <Title order={1}>{produto.nome}</Title>
        <Text c="dimmed">{produto.descricao}</Text>
        {produto.desconto > 0 && (
          <Text td="line-through" c="dimmed">
            {moeda(produto.precoCentavos)}
          </Text>
        )}
        <Text c="verde.8" fw={800} size="40px">
          {moeda(precoFinal(produto))}
        </Text>
        <Text size="sm">Venda por unidade · {disponivel} disponíveis</Text>
        <Group>
          <SeletorQuantidade
            valor={Math.min(quantidade, Math.max(1, disponivel))}
            maximo={disponivel}
            aoAlterar={setQuantidade}
          />
          <Button
            size="lg"
            leftSection={<IconShoppingBag />}
            disabled={!disponivel}
            onClick={() => adicionar(produto.id, Math.min(quantidade, disponivel))}
          >
            Adicionar à sacola
          </Button>
        </Group>
        {produto.codigoBarras && (
          <Text size="xs" c="dimmed">
            Código de barras: {produto.codigoBarras}
          </Text>
        )}
        <Button component={Link} to="/produtos" variant="subtle" w="fit-content">
          Voltar aos produtos
        </Button>
      </Stack>
    </SimpleGrid>
  );
}
