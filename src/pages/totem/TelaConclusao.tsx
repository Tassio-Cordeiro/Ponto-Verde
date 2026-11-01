import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconShoppingBag } from '@tabler/icons-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Marca } from '../../components/shared/Marca.tsx';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { config } from '../../app/config.ts';
export function TelaConclusao() {
  const { atendimento, vendaAtual, limparAtendimento } = useAtendimento();
  const [restante, setRestante] = useState(config.duracaoConclusaoSegundos);
  const navegar = useNavigate();
  useEffect(() => {
    const inicio = Date.now();
    const timer = window.setInterval(
      () =>
        setRestante(
          Math.max(0, config.duracaoConclusaoSegundos - Math.floor((Date.now() - inicio) / 1000)),
        ),
      200,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (restante !== 0) return;
    limparAtendimento();
    navegar('/', { replace: true });
  }, [restante, limparAtendimento, navegar]);
  if (atendimento?.etapa !== 'concluido' || !vendaAtual) return <Navigate to="/" replace />;
  function finalizar() {
    limparAtendimento();
    navegar('/', { replace: true });
  }
  return (
    <Box className="tela-conclusao">
      <Container size="sm">
        <Stack align="center" gap="xl" ta="center">
          <Marca clara />
          <ThemeIcon size={100} radius="xl" color="white" variant="white" c="verde.8">
            <IconCheck size={55} stroke={1.5} />
          </ThemeIcon>
          <Title className="titulo-obrigado">
            Muito obrigado por escolher comprar com a gente!
          </Title>
          <Text size="xl" c="#dcebc9">
            Aguarde suas compras ao lado.
          </Text>
          <Badge
            size="xl"
            color="white"
            variant="outline"
            leftSection={<IconShoppingBag size={18} />}
          >
            Pedido {vendaAtual.numero}
          </Badge>
          <Text size="sm" c="#dcebc9">
            {atendimento.comprovante === 'email'
              ? 'Nota fiscal enviada por e-mail · simulação'
              : 'Comprovante impresso · simulação'}
          </Text>
          <Stack gap={10} w="100%" maw={300}>
            <Progress
              value={(restante / config.duracaoConclusaoSegundos) * 100}
              color="lime.3"
              bg="#ffffff33"
              size={4}
            />
            <Text size="sm" c="#dcebc9">
              Voltando ao início em {restante} segundos
            </Text>
            <Button variant="subtle" color="white" onClick={finalizar}>
              Voltar ao início agora
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
