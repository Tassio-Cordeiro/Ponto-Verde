import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useLoja } from '../../hooks/useLoja.ts';
import { useApi } from '../../hooks/useApi.ts';
import { ImagemProduto } from '../../components/shared/ImagemProduto.tsx';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
import type { Produto } from '../../types/index.ts';
import { moeda } from '../../utils/moeda.ts';
export function Produtos() {
  const { produtos, carregando, erro, recarregar, excluirProduto } = useLoja();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<Produto | null>(null);
  const operacao = useApi<boolean>();
  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / 8));
  const atual = Math.min(pagina, paginas);
  async function confirmarExclusao() {
    if (!excluindo) return;
    const sucesso = await operacao.executar(async () => {
      await excluirProduto(excluindo);
      return true;
    });
    if (sucesso) {
      notifications.show({
        title: 'Produto excluído',
        message: 'O catálogo e a sacola foram atualizados.',
      });
      setExcluindo(null);
    }
  }
  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Box>
          <Text className="sobretitulo">AS ESCOLHAS DO SEU MERCADO</Text>
          <Title className="titulo-admin">Produtos</Title>
          <Text c="dimmed" size="sm" mt={6}>
            Gerencie seu catálogo, preços e disponibilidade.
          </Text>
        </Box>
        <Button component={Link} to="/admin/produtos/novo" leftSection={<IconPlus size={19} />}>
          Novo produto
        </Button>
      </Group>
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="lg">
          <TextInput
            aria-label="Pesquisar produtos administrativos"
            placeholder="Buscar por nome"
            leftSection={<IconSearch size={20} />}
            value={busca}
            onChange={(e) => {
              setBusca(e.currentTarget.value);
              setPagina(1);
            }}
          />
          <Text size="sm" c="dimmed">
            {filtrados.length} produtos
          </Text>
        </Group>
        {carregando ? (
          <EstadoCarregamento />
        ) : erro ? (
          <EstadoErro mensagem={erro} tentarNovamente={recarregar} />
        ) : !filtrados.length ? (
          <EstadoVazio
            titulo="Nenhum produto encontrado"
            descricao="Cadastre um produto ou tente outra busca."
          />
        ) : (
          <>
            <Table.ScrollContainer minWidth={770}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Produto</Table.Th>
                    <Table.Th>Preço base</Table.Th>
                    <Table.Th>Desconto</Table.Th>
                    <Table.Th>Estoque</Table.Th>
                    <Table.Th>Origem</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtrados.slice((atual - 1) * 8, atual * 8).map((produto) => (
                    <Table.Tr key={produto.id}>
                      <Table.Td>
                        <Group wrap="nowrap">
                          <Box w={48}>
                            <ImagemProduto
                              key={produto.imagem}
                              src={produto.imagem}
                              nome={produto.nome}
                              altura={48}
                            />
                          </Box>
                          <Stack gap={0}>
                            <Text fw={600} size="sm">
                              {produto.nome}
                            </Text>
                            <Text c="dimmed" size="xs">
                              {produto.grupo}
                            </Text>
                          </Stack>
                        </Group>
                      </Table.Td>
                      <Table.Td>{moeda(produto.precoCentavos)}</Table.Td>
                      <Table.Td>
                        {produto.desconto.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={produto.estoque > 0 ? 'verde' : 'red'}>
                          {produto.estoque} un.
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray">
                          {produto.origem === 'local' ? 'Local' : 'DummyJSON'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <ActionIcon
                            size={44}
                            component={Link}
                            to={`/admin/produtos/${produto.id}/editar`}
                            variant="subtle"
                            aria-label={`Editar ${produto.nome}`}
                          >
                            <IconEdit size={19} />
                          </ActionIcon>
                          <ActionIcon
                            size={44}
                            color="red"
                            variant="subtle"
                            aria-label={`Excluir ${produto.nome}`}
                            onClick={() => setExcluindo(produto)}
                          >
                            <IconTrash size={19} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <Group justify="space-between" mt="lg">
              <Text size="xs" c="dimmed">
                Página {atual} de {paginas}
              </Text>
              <Pagination total={paginas} value={atual} onChange={setPagina} />
            </Group>
          </>
        )}
      </Paper>
      <Modal
        opened={excluindo !== null}
        onClose={() => {
          if (!operacao.carregando) setExcluindo(null);
        }}
        title="Excluir produto?"
        centered
      >
        <Stack>
          <Text>
            Deseja excluir {excluindo?.nome}? O produto deixará de aparecer no catálogo e será
            removido da sacola atual.
          </Text>
          {operacao.erro && <EstadoErro mensagem={operacao.erro} />}
          <Group justify="end">
            <Button
              variant="default"
              onClick={() => setExcluindo(null)}
              disabled={operacao.carregando}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              loading={operacao.carregando}
              onClick={() => void confirmarExclusao()}
            >
              Confirmar exclusão
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
