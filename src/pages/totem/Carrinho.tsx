import { Box, Button, Grid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useLoja } from '../../hooks/useLoja.ts';
import { ItemCarrinho } from '../../components/totem/ItemCarrinho.tsx';
import { ResumoCompra } from '../../components/totem/ResumoCompra.tsx';
import { EstadoCarregamento, EstadoErro, EstadoVazio } from '../../components/shared/Estados.tsx';
export function Carrinho() {
  const { carrinho, produtos, resumo, carregando, erro, recarregar } = useLoja();
  if (carregando) return <EstadoCarregamento />;
  if (erro) return <EstadoErro mensagem={erro} tentarNovamente={recarregar} />;
  return (
    <Stack gap="xl">
      <Box>
        <Text className="sobretitulo">TUDO CERTO POR AQUI?</Text>
        <Title className="titulo-pagina">Sua sacola</Title>
        <Text c="dimmed" mt={6}>
          Confira os itens e siga para o pagamento.
        </Text>
      </Box>
      {!carrinho.length ? (
        <EstadoVazio
          titulo="Sua sacola está esperando por você"
          descricao="Que tal começar pelos seus favoritos?"
          acao={
            <Button component={Link} to="/produtos">
              Escolher produtos
            </Button>
          }
        />
      ) : (
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              {carrinho.map((item) => {
                const produto = produtos.find((p) => p.id === item.produtoId);
                return produto ? (
                  <ItemCarrinho
                    key={item.produtoId}
                    produto={produto}
                    quantidade={item.quantidade}
                  />
                ) : null;
              })}
              <Button component={Link} to="/produtos" variant="subtle" w="fit-content">
                Adicionar mais produtos
              </Button>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <ResumoCompra resumo={resumo}>
              <Button
                component={Link}
                to="/pagamento"
                size="lg"
                fullWidth
                rightSection={<IconArrowRight size={20} />}
              >
                Ir para pagamento
              </Button>
            </ResumoCompra>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
