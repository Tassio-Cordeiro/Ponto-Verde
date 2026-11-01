import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch, IconShoppingBag, IconLeaf } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useLoja } from '../../hooks/useLoja.ts';
import { CardProduto } from '../../components/totem/CardProduto.tsx';
import { VerificacaoCpf } from '../../components/totem/VerificacaoCpf.tsx';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
import { grupoSchema } from '../../schemas/dominio.ts';

export function ListaProdutos() {
  const { produtos, carregando, erro, recarregar, quantidade } = useLoja();
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState('Todos');
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const filtrados = produtos.filter(
    (p) =>
      (grupo === 'Todos' || p.grupo === grupo) &&
      (p.nome.toLocaleLowerCase('pt-BR').includes(termo) || p.codigoBarras?.includes(termo)),
  );
  return (
    <Stack gap="xl">
      <VerificacaoCpf />
      <Group justify="space-between" align="end">
        <Box>
          <Text className="sobretitulo">SEU MERCADO, DO SEU JEITO</Text>
          <Title order={1} className="titulo-pagina">
            Vamos encher a sacola?
          </Title>
          <Text c="dimmed" mt={7}>
            Escolha seus favoritos. A gente cuida do resto.
          </Text>
        </Box>
        <Badge size="lg" variant="light" leftSection={<IconLeaf size={14} />}>
          Fresquinho todo dia
        </Badge>
      </Group>
      <Box className="banner-catalogo">
        <Box>
          <Text size="xs" tt="uppercase" lts={2} c="verde.7" fw={700}>
            Pequenas escolhas, bons momentos
          </Text>
          <Title order={2} mt={6}>
            O essencial para o seu dia.
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            Da fruta do lanche ao café de amanhã.
          </Text>
        </Box>
        <IconShoppingBag size={76} stroke={1} color="#719276" />
      </Box>
      <TextInput
        aria-label="Pesquisar produtos"
        placeholder="Busque um produto ou digite o código de barras"
        size="lg"
        leftSection={<IconSearch size={22} />}
        value={busca}
        onChange={(e) => setBusca(e.currentTarget.value)}
      />
      <ScrollArea type="never">
        <Group wrap="nowrap" gap={8} pb={3}>
          {['Todos', ...grupoSchema.options].map((nome) => (
            <Button
              key={nome}
              radius="xl"
              variant={nome === grupo ? 'filled' : 'default'}
              onClick={() => setGrupo(nome)}
            >
              {nome}
            </Button>
          ))}
        </Group>
      </ScrollArea>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {filtrados.length} produtos para você
        </Text>
        {quantidade > 0 && (
          <Button
            component={Link}
            to="/carrinho"
            variant="subtle"
            rightSection={<IconShoppingBag size={18} />}
          >
            Revisar minha sacola ({quantidade})
          </Button>
        )}
      </Group>
      {carregando ? (
        <EstadoCarregamento texto="Buscando produtos fresquinhos…" />
      ) : erro ? (
        <EstadoErro mensagem={erro} tentarNovamente={recarregar} />
      ) : !filtrados.length ? (
        <EstadoVazio
          titulo="Nenhum produto por aqui"
          descricao="Tente outro nome, código de barras ou categoria."
          acao={
            <Button
              variant="light"
              onClick={() => {
                setBusca('');
                setGrupo('Todos');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="lg">
          {filtrados.map((produto) => (
            <CardProduto key={produto.id} produto={produto} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
