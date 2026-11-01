import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconClock,
  IconLeaf,
  IconLock,
  IconShoppingBag,
  IconSparkles,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { Marca } from '../../components/shared/Marca.tsx';
import { ModalLogin } from '../../components/admin/ModalLogin.tsx';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { config } from '../../app/config.ts';
import classes from './TelaInicial.module.css';

export function TelaInicial() {
  const [loginAberto, setLoginAberto] = useState(false);
  const { iniciar, atendimento, vendaAtual } = useAtendimento();
  const navegar = useNavigate();
  const destino =
    atendimento?.etapa === 'concluido'
      ? '/conclusao'
      : vendaAtual
        ? '/comprovante'
        : atendimento?.etapa === 'pagando'
          ? '/pagamento'
          : '/produtos';
  function comecar() {
    iniciar();
    navegar('/produtos');
  }
  return (
    <Box className={classes.pagina}>
      <Container size="xl" className={classes.conteudo}>
        <Group component="header" justify="space-between" className={classes.cabecalho}>
          <Marca clara />
          <Badge variant="outline" color="white" size="lg" fw={400}>
            Autoatendimento
          </Badge>
        </Group>
        <Box component="main" className={classes.principal}>
          <Stack gap="xl" maw={640}>
            <Group gap={8}>
              <Box className={classes.ponto} />
              <Text c="white" size="sm" lts={2} tt="uppercase">
                Praticidade que faz bem
              </Text>
            </Group>
            <Title className={classes.titulo}>
              O que você precisa.
              <br />
              <Text component="span" inherit c="#cce5a9">
                Bem aqui.
              </Text>
            </Title>
            <Text className={classes.descricao}>
              Fresquinhos, essenciais e seus favoritos.
              <br />
              Escolha com calma. Compre no seu ritmo.
            </Text>
            <Button
              className={classes.iniciar}
              size="xl"
              radius="xl"
              rightSection={<IconArrowRight size={25} />}
              onClick={comecar}
            >
              INICIAR COMPRA
            </Button>
            {atendimento && (
              <Anchor component={Link} to={destino} c="white" size="sm" underline="always">
                Continuar meu atendimento
              </Anchor>
            )}
            <Group gap="xl" className={classes.beneficios}>
              <Group gap={9}>
                <IconShoppingBag size={19} />
                <Text size="sm">Escolha seus produtos</Text>
              </Group>
              <Group gap={9}>
                <IconClock size={19} />
                <Text size="sm">Simples e sem filas</Text>
              </Group>
            </Group>
          </Stack>
        </Box>
        <Group component="footer" justify="space-between" className={classes.rodape}>
          <Group gap={8}>
            <IconLeaf size={19} />
            <Text size="sm">{config.slogan}</Text>
          </Group>
          <Group gap={12}>
            <Text size="xs" visibleFrom="sm">
              Ambiente de demonstração
            </Text>
            <ActionIcon
              aria-label="Abrir administração"
              size={48}
              variant="outline"
              color="white"
              radius="xl"
              onClick={() => setLoginAberto(true)}
            >
              <IconLock size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>
      <Box className={classes.etiqueta}>
        <ThemeIcon size={42} radius="xl" variant="white" color="verde">
          <IconSparkles size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text fw={700}>Pequenas compras.</Text>
          <Text size="sm">Um dia mais leve.</Text>
        </Stack>
      </Box>
      <ModalLogin aberto={loginAberto} fechar={() => setLoginAberto(false)} />
    </Box>
  );
}
