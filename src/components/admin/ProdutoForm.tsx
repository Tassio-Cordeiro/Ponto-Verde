import { useEffect } from 'react';
import {
  Alert,
  Button,
  Grid,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { z } from 'zod';
import { useLoja } from '../../hooks/useLoja.ts';
import { useApi } from '../../hooks/useApi.ts';
import { produtoFormSchema } from '../../schemas/formularios.ts';
import { grupoSchema } from '../../schemas/dominio.ts';
import type { Produto } from '../../types/index.ts';
type ValoresProduto = z.infer<typeof produtoFormSchema>;
export function ProdutoForm({ produto }: { produto?: Produto }) {
  const { salvarProduto } = useLoja();
  const navegar = useNavigate();
  const requisicao = useApi<boolean>();
  const form = useForm<ValoresProduto>({
    initialValues: {
      nome: '',
      descricao: '',
      preco: 0,
      desconto: 0,
      estoque: 0,
      imagem: '',
      grupo: 'Mercearia',
      codigoBarras: '',
    },
    validate: zodResolver(produtoFormSchema),
  });
  const { setValues } = form;
  useEffect(() => {
    if (produto)
      setValues({
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.precoCentavos / 100,
        desconto: produto.desconto,
        estoque: produto.estoque,
        imagem: produto.imagem,
        grupo: produto.grupo,
        codigoBarras: produto.codigoBarras ?? '',
      });
  }, [produto, setValues]);
  async function enviar(valores: ValoresProduto) {
    const registro: Produto = {
      id: produto?.id ?? crypto.randomUUID(),
      dummyJsonId: produto?.dummyJsonId,
      origem: produto?.origem ?? 'local',
      nome: valores.nome.trim(),
      descricao: valores.descricao.trim(),
      precoCentavos: Math.round(valores.preco * 100),
      desconto: valores.desconto,
      estoque: valores.estoque,
      imagem: valores.imagem,
      grupo: valores.grupo,
      codigoBarras: valores.codigoBarras || undefined,
    };
    const sucesso = await requisicao.executar(async () => {
      await salvarProduto(registro, !produto);
      return true;
    });
    if (sucesso) {
      notifications.show({
        title: produto ? 'Produto atualizado' : 'Produto cadastrado',
        message: 'As alterações foram salvas neste navegador.',
      });
      navegar('/admin/produtos');
    }
  }
  return (
    <Paper withBorder p="xl">
      <form onSubmit={form.onSubmit(enviar)}>
        <Stack gap="lg">
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                label="Nome do produto"
                placeholder="Ex.: Café torrado"
                {...form.getInputProps('nome')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Agrupamento"
                data={grupoSchema.options}
                allowDeselect={false}
                {...form.getInputProps('grupo')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Descrição" minRows={3} {...form.getInputProps('descricao')} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Preço base (R$)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                decimalSeparator=","
                {...form.getInputProps('preco')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Desconto (%)"
                min={0}
                max={100}
                decimalScale={2}
                {...form.getInputProps('desconto')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Estoque (unidades)"
                min={0}
                allowDecimal={false}
                {...form.getInputProps('estoque')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                label="URL da imagem (opcional)"
                placeholder="https://…"
                {...form.getInputProps('imagem')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label="Código de barras (opcional)"
                {...form.getInputProps('codigoBarras')}
              />
            </Grid.Col>
          </Grid>
          <Text size="xs" c="dimmed">
            O cadastro demonstra a operação REST. Sua versão efetiva fica salva localmente, pois o
            DummyJSON não persiste alterações.
          </Text>
          {requisicao.erro && <Alert color="red">{requisicao.erro}</Alert>}
          <Group justify="end">
            <Button
              component={Link}
              to="/admin/produtos"
              variant="default"
              disabled={requisicao.carregando}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={requisicao.carregando}>
              Salvar produto
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
