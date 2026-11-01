import { useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Container,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconChartBar,
  IconChefHat,
  IconLogout,
  IconPackage,
  IconUsers,
  IconExternalLink,
} from '@tabler/icons-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Marca } from '../components/shared/Marca.tsx';
import { useAuth } from '../hooks/useAuth.ts';
const links = [
  { to: '/admin', nome: 'Visão geral', Icone: IconChartBar, fim: true },
  { to: '/admin/produtos', nome: 'Produtos', Icone: IconPackage },
  { to: '/admin/clientes', nome: 'Clientes', Icone: IconUsers },
  { to: '/admin/preparacao', nome: 'Preparação', Icone: IconChefHat },
];
export function AdminLayout() {
  const { usuario, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const navegar = useNavigate();
  function sair() {
    logout();
    navegar('/');
  }
  return (
    <Box className="admin-shell">
      <Box component="header" className="admin-header">
        <Group justify="space-between">
          <Group>
            <Burger
              opened={aberto}
              onClick={() => setAberto((valor) => !valor)}
              hiddenFrom="md"
              aria-label="Abrir navegação"
            />
            <Marca />
            <Badge variant="light" visibleFrom="sm">
              Administração
            </Badge>
          </Group>
          <Group gap={9}>
            <Avatar src={usuario?.image} size={36} radius="xl" />
            <Text size="sm" visibleFrom="sm">
              {usuario?.firstName}
            </Text>
            <ActionIcon
              aria-label="Sair da administração"
              size={44}
              variant="subtle"
              onClick={sair}
            >
              <IconLogout size={21} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>
      <Box component="aside" className={`admin-sidebar ${aberto ? 'sidebar-aberta' : ''}`}>
        <Stack h="100%">
          <Text size="xs" c="dimmed" tt="uppercase" lts={1.5} fw={700} px="md" mb="xs">
            Seu mercado
          </Text>
          {links.map(({ to, nome, Icone, fim }) => (
            <NavLink
              key={to}
              to={to}
              end={fim}
              className={({ isActive }) => `admin-link ${isActive ? 'admin-link-ativo' : ''}`}
              onClick={() => setAberto(false)}
            >
              <Icone size={21} />
              <Text size="sm" fw={600}>
                {nome}
              </Text>
            </NavLink>
          ))}
          <Box mt="auto">
            <Box className="admin-dica">
              <Text size="sm" fw={650}>
                Tudo em sintonia.
              </Text>
              <Text size="xs" c="dimmed" mt={6}>
                As vendas e os pedidos são atualizados entre abas deste navegador.
              </Text>
            </Box>
            <Button
              component={Link}
              to="/"
              fullWidth
              mt="md"
              variant="subtle"
              rightSection={<IconExternalLink size={17} />}
            >
              Abrir totem
            </Button>
          </Box>
        </Stack>
      </Box>
      <Box component="main" id="conteudo" className="admin-main">
        <Container size="xl" p={0}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
