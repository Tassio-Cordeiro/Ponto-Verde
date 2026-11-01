import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconMail, IconPrinter } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { emailFormSchema } from '../../schemas/formularios.ts';
import { moeda } from '../../utils/moeda.ts';

export function EscolhaComprovante() {
  const { vendaAtual, concluir } = useAtendimento();
  const navegar = useNavigate();
  const [imprimindo, setImprimindo] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  function imprimir() {
    if (imprimindo) return;
    setImprimindo(true);
    timer.current = window.setTimeout(() => {
      concluir('impresso');
      notifications.show({
        title: 'Comprovante impresso',
        message: 'Impressão simulada concluída. Nenhuma impressora foi acionada.',
      });
      navegar('/conclusao', { replace: true });
    }, 1200);
  }
  return (
    <Stack align="center" gap="lg" maw={760} mx="auto" py="xl">
      <ThemeIcon size={72} radius="xl" variant="light">
        <IconCheck size={38} />
      </ThemeIcon>
      <Text className="sobretitulo">TUDO CERTO COM A SUA COMPRA</Text>
      <Title ta="center" className="titulo-pagina">
        Pagamento aprovado!
      </Title>
      <Text c="dimmed" ta="center">
        Pedido {vendaAtual?.numero} · {moeda(vendaAtual?.total ?? 0)}
        <br />
        Como você prefere receber seu comprovante?
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%" mt="lg">
        <Paper withBorder p="xl">
          <Stack align="center">
            <ThemeIcon size={60} radius="xl" variant="light">
              <IconPrinter size={30} />
            </ThemeIcon>
            <Title order={3}>Na hora, em papel</Title>
            <Text size="sm" c="dimmed" ta="center">
              Uma impressão simulada do seu comprovante.
            </Text>
            <Button fullWidth size="lg" onClick={imprimir} loading={imprimindo}>
              Imprimir nota
            </Button>
          </Stack>
        </Paper>
        <Paper withBorder p="xl">
          <Stack align="center">
            <ThemeIcon size={60} radius="xl" variant="light">
              <IconMail size={30} />
            </ThemeIcon>
            <Title order={3}>Direto no seu e-mail</Title>
            <Text size="sm" c="dimmed" ta="center">
              Prático e sem papel. Envio simulado.
            </Text>
            <Button
              fullWidth
              component={Link}
              to="/comprovante/email"
              variant="light"
              size="lg"
              disabled={imprimindo}
            >
              Receber por e-mail
            </Button>
          </Stack>
        </Paper>
      </SimpleGrid>
      <Text size="xs" c="dimmed" ta="center">
        Comprovante demonstrativo, sem validade fiscal. Sua venda já está registrada.
      </Text>
    </Stack>
  );
}
export function EmailComprovanteForm() {
  const { atendimento, concluir } = useAtendimento();
  const navegar = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  const form = useForm({
    initialValues: { email: atendimento?.cliente?.email ?? '' },
    validate: zodResolver(emailFormSchema),
  });
  function enviar(valores: typeof form.values) {
    if (enviando) return;
    setEnviando(true);
    timer.current = window.setTimeout(() => {
      concluir('email', valores.email.trim());
      notifications.show({
        title: 'Nota fiscal enviada por e-mail',
        message: 'Envio simulado concluído. Nenhuma mensagem real foi enviada.',
      });
      navegar('/conclusao', { replace: true });
    }, 1200);
  }
  return (
    <Paper withBorder maw={520} mx="auto" my="xl" p="xl">
      <form onSubmit={form.onSubmit(enviar)}>
        <Stack gap="lg">
          <ThemeIcon size={60} radius="xl" variant="light">
            <IconMail size={30} />
          </ThemeIcon>
          <Title order={2}>Seu comprovante por e-mail</Title>
          <Text c="dimmed">
            Informe o endereço que deseja usar. Você pode alterar o e-mail do cadastro.
          </Text>
          <TextInput
            label="E-mail"
            placeholder="voce@exemplo.com"
            type="email"
            {...form.getInputProps('email')}
          />
          <Alert color="verde">
            Este envio faz parte da demonstração e não envia mensagens reais.
          </Alert>
          <Button type="submit" size="lg" loading={enviando}>
            Enviar comprovante
          </Button>
          <Group justify="center">
            <Button component={Link} to="/comprovante" variant="subtle" disabled={enviando}>
              Voltar
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
