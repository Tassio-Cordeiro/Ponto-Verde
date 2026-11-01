import { Alert, Button, Center, Loader, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertCircle, IconBasket } from '@tabler/icons-react';
import type { ReactNode } from 'react';
export function EstadoCarregamento({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <Center py={70}>
      <Stack align="center">
        <Loader color="verde" />
        <Text c="dimmed">{texto}</Text>
      </Stack>
    </Center>
  );
}
export function EstadoErro({
  mensagem,
  tentarNovamente,
}: {
  mensagem: string;
  tentarNovamente?: () => void;
}) {
  return (
    <Alert color="red" title="Não foi possível continuar" icon={<IconAlertCircle />} my="lg">
      {mensagem}
      {tentarNovamente && (
        <Button mt="md" color="red" variant="light" onClick={tentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </Alert>
  );
}
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <Paper withBorder p="xl" className="estado-vazio">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" variant="light">
          <IconBasket size={30} />
        </ThemeIcon>
        <Title order={3} ta="center">
          {titulo}
        </Title>
        <Text c="dimmed" ta="center" maw={460}>
          {descricao}
        </Text>
        {acao}
      </Stack>
    </Paper>
  );
}
