import { Alert, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { IconArrowRight, IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { loginFormSchema } from '../../schemas/formularios.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { useApi } from '../../hooks/useApi.ts';
import type { Perfil } from '../../types/index.ts';
export function LoginForm({ aoEntrar }: { aoEntrar?: () => void }) {
  const { login, erroSessao } = useAuth();
  const navegar = useNavigate();
  const requisicao = useApi<Perfil>();
  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: zodResolver(loginFormSchema),
  });
  async function enviar(valores: typeof form.values) {
    const perfil = await requisicao.executar(() =>
      login(valores.username.trim(), valores.password),
    );
    if (perfil) {
      aoEntrar?.();
      navegar('/admin');
    }
  }
  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Text c="dimmed">Entre para acompanhar as vendas e cuidar do seu mercado.</Text>
        {(requisicao.erro || erroSessao) && (
          <Alert color="red">{requisicao.erro ?? erroSessao}</Alert>
        )}
        <TextInput
          label="Usuário"
          placeholder="Seu usuário"
          autoComplete="username"
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label="Senha"
          placeholder="Sua senha"
          autoComplete="current-password"
          {...form.getInputProps('password')}
        />
        <Button
          type="submit"
          size="lg"
          leftSection={<IconLock size={20} />}
          rightSection={<IconArrowRight size={20} />}
          loading={requisicao.carregando}
        >
          Entrar na administração
        </Button>
        <Text size="xs" c="dimmed">
          Demonstração: emilys / emilyspass
        </Text>
      </Stack>
    </form>
  );
}
