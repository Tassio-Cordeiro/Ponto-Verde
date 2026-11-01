import { Center, Image, Stack, Text } from '@mantine/core';
import { IconPhotoOff } from '@tabler/icons-react';
import { useState } from 'react';
export function ImagemProduto({
  src,
  nome,
  altura = 170,
}: {
  src: string;
  nome: string;
  altura?: number;
}) {
  const [falhou, setFalhou] = useState(false);
  if (!src || falhou)
    return (
      <Center h={altura} bg="gray.0">
        <Stack align="center" gap={4} c="dimmed">
          <IconPhotoOff size={30} />
          <Text size="xs">Imagem indisponível</Text>
        </Stack>
      </Center>
    );
  return (
    <Image
      src={src}
      alt={nome}
      h={altura}
      fit="contain"
      loading="lazy"
      onError={() => setFalhou(true)}
    />
  );
}
