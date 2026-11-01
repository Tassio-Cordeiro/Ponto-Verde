import { useCallback, useEffect, useState } from 'react';
import { Box, Group, Pagination, Paper, Table, Text, TextInput, Title } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { listarClientes } from '../../services/clientesService.ts';
import { useApi } from '../../hooks/useApi.ts';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { clientesSchema } from '../../mocks/seeds.ts';
import { chaveStorage } from '../../utils/armazenamento.ts';
import { formatarCpf } from '../../utils/cpf.ts';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
import type { Cliente } from '../../types/index.ts';
const clientesIniciais: Cliente[] = [];
export function Clientes() {
  const requisicao = useApi<Cliente[]>();
  const { executar } = requisicao;
  const [clientes] = useLocalStorage('clientes', clientesSchema, clientesIniciais);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const carregar = useCallback(() => {
    void executar(() => listarClientes());
  }, [executar]);
  useEffect(() => {
    const controlador = new AbortController();
    void executar(() => listarClientes(undefined, controlador.signal));
    const sincronizar = (evento: StorageEvent) => {
      if (evento.key === chaveStorage('clientes')) carregar();
    };
    window.addEventListener('storage', sincronizar);
    return () => {
      controlador.abort();
      window.removeEventListener('storage', sincronizar);
    };
  }, [executar, carregar]);
  const termo = busca.trim().toLowerCase();
  const filtrados = clientes.filter((cliente) =>
    `${cliente.nome} ${cliente.email} ${cliente.cpf} ${formatarCpf(cliente.cpf)}`
      .toLowerCase()
      .includes(termo),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / 8));
  const atual = Math.min(pagina, paginas);
  return (
    <Box>
      <Text className="sobretitulo">QUEM COMPRA COM A GENTE</Text>
      <Title className="titulo-admin">Clientes</Title>
      <Text c="dimmed" size="sm" mt={6} mb="xl">
        Cadastros fictícios de demonstração e clientes identificados no totem.
      </Text>
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="lg">
          <TextInput
            aria-label="Pesquisar clientes"
            placeholder="Buscar nome, CPF ou e-mail"
            leftSection={<IconSearch size={20} />}
            value={busca}
            onChange={(e) => {
              setBusca(e.currentTarget.value);
              setPagina(1);
            }}
            w={{ base: '100%', sm: 370 }}
          />
          <Text size="sm" c="dimmed">
            {filtrados.length} clientes
          </Text>
        </Group>
        {requisicao.carregando ? (
          <EstadoCarregamento />
        ) : requisicao.erro ? (
          <EstadoErro mensagem={requisicao.erro} tentarNovamente={carregar} />
        ) : !filtrados.length ? (
          <EstadoVazio
            titulo="Nenhum cliente encontrado"
            descricao="Tente outra busca. Visitantes não geram um cadastro automaticamente."
          />
        ) : (
          <>
            <Table.ScrollContainer minWidth={520}>
              <Table verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nome</Table.Th>
                    <Table.Th>CPF fictício</Table.Th>
                    <Table.Th>E-mail</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtrados.slice((atual - 1) * 8, atual * 8).map((cliente) => (
                    <Table.Tr key={cliente.id}>
                      <Table.Td fw={600}>{cliente.nome}</Table.Td>
                      <Table.Td>{formatarCpf(cliente.cpf)}</Table.Td>
                      <Table.Td>{cliente.email || 'Não informado'}</Table.Td>
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
    </Box>
  );
}
