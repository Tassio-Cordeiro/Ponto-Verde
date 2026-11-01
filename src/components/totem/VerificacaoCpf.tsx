import { useState } from 'react';
import { Alert, Button, Modal, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { IconUserHeart } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { notifications } from '@mantine/notifications';
import { useAtendimento } from '../../hooks/useAtendimento.ts';
import { useApi } from '../../hooks/useApi.ts';
import { cpfFormSchema, clienteFormSchema } from '../../schemas/formularios.ts';
import { cadastrarCliente, listarClientes } from '../../services/clientesService.ts';
import { formatarCpf, normalizarCpf } from '../../utils/cpf.ts';
import type { Cliente } from '../../types/index.ts';

export function CadastroClienteForm({ cpf, aoVoltar }: { cpf: string; aoVoltar: () => void }) {
  const { identificar } = useAtendimento();
  const requisicao = useApi<Cliente>();
  const form = useForm({
    initialValues: { cpf, nome: '', email: '' },
    validate: zodResolver(clienteFormSchema),
  });
  async function enviar(valores: typeof form.values) {
    const cliente = await requisicao.executar(() =>
      cadastrarCliente({ ...valores, cpf: normalizarCpf(valores.cpf) }),
    );
    if (cliente && identificar(cliente)) {
      notifications.show({
        title: `Bem-vindo, ${cliente.nome}!`,
        message: 'Cadastro fictício salvo. Boas compras!',
      });
    }
  }
  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Alert color="verde">
          CPF ainda não cadastrado. Crie seu cadastro fictício para continuar.
        </Alert>
        <TextInput label="CPF" readOnly value={formatarCpf(cpf)} />
        <TextInput
          label="Nome"
          placeholder="Como podemos chamar você?"
          {...form.getInputProps('nome')}
        />
        <TextInput
          label="E-mail (opcional)"
          placeholder="voce@exemplo.com"
          {...form.getInputProps('email')}
        />
        {requisicao.erro && <Alert color="red">{requisicao.erro}</Alert>}
        <Button type="submit" size="lg" loading={requisicao.carregando}>
          Cadastrar e continuar
        </Button>
        <Button variant="subtle" onClick={aoVoltar}>
          Voltar à identificação
        </Button>
      </Stack>
    </form>
  );
}
export function VerificacaoCpf() {
  const { atendimento, identificar } = useAtendimento();
  const [cadastrar, setCadastrar] = useState(false);
  const requisicao = useApi<Cliente[]>();
  const form = useForm({ initialValues: { cpf: '' }, validate: zodResolver(cpfFormSchema) });
  async function consultar(valores: typeof form.values) {
    const clientes = await requisicao.executar(() => listarClientes(normalizarCpf(valores.cpf)));
    if (!clientes) return;
    if (!clientes.length) {
      setCadastrar(true);
      return;
    }
    if (identificar(clientes[0])) {
      notifications.show({
        title: `Bem-vindo, ${clientes[0].nome}!`,
        message: 'Que bom ter você por aqui.',
      });
    }
  }
  return (
    <Modal
      opened={atendimento?.identificacao === 'pendente'}
      onClose={() => identificar(null)}
      title="Vamos nos conhecer?"
      centered
      size="md"
      closeOnClickOutside={false}
    >
      <Stack>
        <ThemeIcon size={58} radius="xl" variant="light">
          <IconUserHeart size={30} />
        </ThemeIcon>
        <Text fw={600} size="lg">
          Deseja se identificar? Digite seu CPF.
        </Text>
        <Text size="sm" c="dimmed">
          É opcional. Use somente dados fictícios nesta demonstração.
        </Text>
        {cadastrar ? (
          <CadastroClienteForm
            cpf={normalizarCpf(form.values.cpf)}
            aoVoltar={() => setCadastrar(false)}
          />
        ) : (
          <form onSubmit={form.onSubmit(consultar)}>
            <Stack>
              <TextInput
                label="CPF"
                placeholder="000.000.000-00"
                inputMode="numeric"
                {...form.getInputProps('cpf')}
                value={formatarCpf(form.values.cpf)}
                onChange={(evento) =>
                  form.setFieldValue('cpf', normalizarCpf(evento.currentTarget.value))
                }
              />
              {requisicao.erro && <Alert color="red">{requisicao.erro}</Alert>}
              <Button type="submit" size="lg" loading={requisicao.carregando}>
                Continuar com CPF
              </Button>
            </Stack>
          </form>
        )}
        <Button size="lg" variant="light" onClick={() => identificar(null)}>
          Seguir sem CPF
        </Button>
        <Text size="xs" c="dimmed">
          CPF de demonstração: 529.982.247-25
        </Text>
      </Stack>
    </Modal>
  );
}
