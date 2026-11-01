import { Modal } from '@mantine/core';
import { LoginForm } from './LoginForm.tsx';
export function ModalLogin({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  return (
    <Modal opened={aberto} onClose={fechar} title="Acesso administrativo" centered size="md">
      <LoginForm aoEntrar={fechar} />
    </Modal>
  );
}
