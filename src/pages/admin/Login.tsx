import { Anchor, Box, Center, Paper, Stack, Title } from '@mantine/core';
import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '../../components/admin/LoginForm.tsx';
import { Marca } from '../../components/shared/Marca.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { EstadoCarregamento } from '../../components/shared/Estados.tsx';
export function Login() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <EstadoCarregamento texto="Verificando sessão…" />;
  if (usuario) return <Navigate to="/admin" replace />;
  return (
    <Center mih="100svh" p="lg" bg="#edf2e9">
      <Box w="100%" maw={450}>
        <Stack gap="xl">
          <Marca />
          <Paper withBorder p="xl">
            <Title order={2} mb="lg">
              Bem-vindo de volta
            </Title>
            <LoginForm />
          </Paper>
          <Anchor component={Link} to="/" c="verde.8">
            ← Voltar ao autoatendimento
          </Anchor>
        </Stack>
      </Box>
    </Center>
  );
}
