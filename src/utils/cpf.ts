export const normalizarCpf = (valor: string) => valor.replace(/\D/g, '').slice(0, 11);
export const formatarCpf = (valor: string) =>
  normalizarCpf(valor)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export function validarCpf(valor: string): boolean {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let indice = 0; indice < tamanho; indice++)
      soma += Number(cpf[indice]) * (tamanho + 1 - indice);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}
