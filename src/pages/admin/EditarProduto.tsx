import { Box, Button, Stack, Text, Title } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { ProdutoForm } from '../../components/admin/ProdutoForm.tsx';
import { useLoja } from '../../hooks/useLoja.ts';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
export function EditarProduto({ novo = false }: { novo?: boolean }) {
  const { id } = useParams();
  const { produtos, carregando, erro, recarregar } = useLoja();
  const produto = produtos.find((p) => p.id === id);
  if (!novo && carregando) return <EstadoCarregamento />;
  if (!novo && erro) return <EstadoErro mensagem={erro} tentarNovamente={recarregar} />;
  if (!novo && !produto)
    return (
      <EstadoVazio
        titulo="Produto não encontrado"
        descricao="Confira o identificador ou retorne ao catálogo administrativo."
        acao={
          <Button component={Link} to="/admin/produtos">
            Ver produtos
          </Button>
        }
      />
    );
  return (
    <Stack gap="xl">
      <Box>
        <Text className="sobretitulo">CATÁLOGO DO SEU JEITO</Text>
        <Title className="titulo-admin">{novo ? 'Novo produto' : 'Editar produto'}</Title>
        <Text c="dimmed" size="sm" mt={6}>
          Informações claras para uma boa compra.
        </Text>
      </Box>
      <ProdutoForm key={id ?? 'novo'} produto={novo ? undefined : produto} />
    </Stack>
  );
}
