import {
  Alert,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCreditCard, IconLock, IconCheck, IconRefresh } from '@tabler/icons-react';
import { Navigate } from 'react-router-dom';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { useLoja } from '../../hooks/useLoja.ts';
import { usePagamentoSimulado } from '../../hooks/usePagamentoSimulado.ts';
import { ResumoCompra } from '../../components/totem/ResumoCompra.tsx';

export function Pagamento() {
  const { atendimento, vendaAtual } = useAtendimento();
  const { resumo } = useLoja();
  const { pagar, fase, segundos, erro, ocupado } = usePagamentoSimulado();
  if (vendaAtual) return <Navigate to="/comprovante" replace />;
  const interrompido = atendimento?.pagamento === 'processando' && fase === 'ocioso';
  const texto =
    fase === 'integrando'
      ? 'Integrando o carrinho com a API…'
      : fase === 'aprovado'
        ? 'Pagamento aprovado!'
        : segundos < 2
          ? 'Conectando à maquininha…'
          : segundos < 5
            ? 'Processando pagamento…'
            : 'Pagamento aprovado!';
  return (
    <Stack gap="xl">
      <Box>
        <Text className="sobretitulo">FALTA SÓ UM PASSO</Text>
        <Title className="titulo-pagina">Vamos finalizar?</Title>
        <Text c="dimmed" mt={6}>
          Seu pagamento é uma simulação. Nenhum valor será cobrado.
        </Text>
      </Box>
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p={{ base: 'lg', sm: 50 }}>
            <Stack align="center" gap="lg" ta="center">
              <ThemeIcon size={94} radius={30} variant="light">
                <IconCreditCard size={48} stroke={1.4} />
              </ThemeIcon>
              <Title order={2}>{ocupado ? texto : 'Pagamento na maquininha'}</Title>
              <Text c="dimmed" maw={420}>
                Nesta demonstração, basta confirmar para simular um pagamento aprovado em cinco
                segundos.
              </Text>
              {interrompido && (
                <Alert color="orange" icon={<IconRefresh />}>
                  O processamento foi interrompido. Seus itens e valores estão salvos. Retome a
                  simulação para continuar.
                </Alert>
              )}
              {erro && (
                <Alert color="red" w="100%">
                  {erro}
                </Alert>
              )}
              {fase === 'simulando' && (
                <Box w="100%">
                  <Progress value={segundos * 20} size="lg" radius="xl" animated />
                  <Text size="sm" c="dimmed" mt={10}>
                    {segundos} de 5 segundos
                  </Text>
                </Box>
              )}
              <Button
                size="xl"
                fullWidth
                disabled={ocupado}
                loading={fase === 'integrando' || fase === 'simulando'}
                leftSection={fase === 'aprovado' ? <IconCheck /> : <IconCreditCard />}
                onClick={() => void pagar()}
              >
                {ocupado
                  ? texto
                  : interrompido || atendimento?.pagamento === 'falhou'
                    ? 'Retomar pagamento simulado'
                    : 'Confirmar pagamento simulado'}
              </Button>
              <Group gap={6} c="dimmed">
                <IconLock size={15} />
                <Text size="xs">Não informe dados reais de cartão.</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ResumoCompra resumo={atendimento?.confirmado ?? resumo} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
