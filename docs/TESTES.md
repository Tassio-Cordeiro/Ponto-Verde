# Como estudar e executar os testes

A prioridade é o caminho que o cliente usa: encontrar produtos, escolher quantidades, adicionar à sacola e conferir os valores. Esses comportamentos atravessam componentes, Context, serviços e armazenamento. A administração permanece fora do foco dos novos cenários de interface; seus testes de serviços preexistentes foram preservados.

## Quatro camadas

| Camada     | O que demonstra                                                                    | Arquivos                                                                              |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Unitária   | Uma regra pura, sem montar React: centavos, desconto, estoque, ajustes e unicidade | `tests/calculos.test.ts`, `tests/regras.test.ts`                                      |
| Componente | O que um componente apresenta e permite fazer                                      | `tests/componentes/catalogo.test.tsx`, `tests/componentes/carrinho.test.tsx`          |
| Integração | Catálogo, provider real, navegação, carrinho e persistência funcionando juntos     | `tests/integration/catalogoCarrinho.test.tsx`, `tests/integration/pagamento.test.tsx` |
| E2E        | A jornada completa em um navegador Chromium                                        | `e2e/*.spec.ts`                                                                       |

**Vitest** executa as três primeiras camadas, gerencia as expectativas e o relógio simulado e gera cobertura V8. **React Testing Library (RTL)** monta os componentes e oferece consultas semânticas, como `getByRole` e `findByRole`. **user-event** simula as interações do usuário; os cliques e a digitação são aguardados com `await`.

**Playwright** abre um Chromium isolado para cada teste e interage com a interface real. Ele usa os mesmos nomes acessíveis encontrados pela RTL, mas também verifica funcionamento do Vite, rotas, layout, armazenamento do navegador e temporizadores reais.

## Instalação e comandos

Use Node.js 24 ou superior e as versões fixadas no lockfile:

```bash
npm ci
npx playwright install chromium
```

A instalação do Chromium é necessária na primeira execução ou quando a versão do Playwright mudar. O comando é compatível com Windows. A suíte E2E não usa nem altera sua sessão pessoal do Chrome.

```bash
npm test
npm run test:run
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```

`npm test` fica observando alterações. `test:run` executa uma vez e termina. Para executar um arquivo específico:

```bash
npm run test:run -- tests/integration/catalogoCarrinho.test.tsx
npm run test:e2e -- e2e/compraVisitante.spec.ts
```

`npm run typecheck` também verifica os testes e as configurações por meio de `tsconfig.tests.json`. O Vitest encontra somente `tests/**/*.test.ts(x)`; o Playwright encontra somente `e2e/**/*.spec.ts`. Um executor não tenta interpretar os arquivos do outro.

## Fixtures previsíveis

`tests/fixtures/produtos.ts` separa a resposta externa do modelo interno:

- Arroz: R$ 10,00; estoque 3.
- Leite: R$ 5,00; estoque 4.
- Café solúvel: R$ 8,00, com 10% de desconto; preço final R$ 7,20; estoque 2.
- Pão exclusivamente local: R$ 3,50; estoque 2, usado em regras e carrinho.

Os produtos HTTP usam IDs e títulos compreendidos pelo adaptador real (`Rice`, `Milk`, `Nescafe Coffee`). A resposta tem `products`, `total`, `skip` e `limit`. Os dados internos possuem `precoCentavos`, ID interno e ID externo quando aplicável. As imagens usam `/favicon.svg`, um arquivo local.

`tests/fixtures/clientes.ts` contém somente dados sintéticos: Ana de Teste, CPF fictício `52998224725` e e-mail `ana@example.com`. O atendimento visitante de teste tem uma identificação explícita, sem simular um cliente real.

Os resultados esperados são valores conhecidos, como R$ 25,00 para dois arrozes e um leite. O teste não recalcula a fórmula de produção para descobrir o resultado que espera.

## Providers e Context reais

`renderComProviders` usa StrictMode, o tema Mantine e MemoryRouter. A opção `contextos` permite selecionar:

- `visuais`: somente Mantine e Router.
- `loja`: acrescenta o LojaProvider real.
- `compra`: LojaProvider e AtendimentoProvider reais; é o padrão.
- `aplicacao`: acrescenta AuthProvider quando necessário.

Exemplo de estado inicial controlado:

```tsx
renderComProviders(<Carrinho />, {
  contextos: 'loja',
  estadoInicial: {
    carrinho: [{ produtoId: 'api-38', quantidade: 2 }],
  },
});
```

O helper grava apenas os registros fornecidos explicitamente antes de montar os providers. Ele não implementa regras de negócio nem substitui hooks. A leitura continua passando pelos schemas Zod da aplicação.

Cada teste limpa o DOM, storage, notificações, handlers e mocks. O cenário de persistência desmonta e remonta dentro do **mesmo teste**, sem limpar o localStorage entre essas duas operações. O teste seguinte começa limpo.

## HTTP com MSW no Vitest

`tests/mocks/server.ts` usa `setupServer` de `msw/node`. `tests/setup.ts` inicia o servidor antes da suíte, restaura handlers depois de cada teste e encerra ao final. Nenhum Service Worker de navegador é iniciado no jsdom.

As requisições passam pelos **serviços Axios, interceptores e schemas Zod reais**. A simulação fica na fronteira HTTP. Os handlers fornecem catálogo, carrinho e perfis; os handlers reais de clientes da aplicação também são reaproveitados. Uma chamada sem handler é registrada e faz o teste falhar.

Para mudar uma resposta em um teste, use `servidor.use(...)`. A restauração automática evita contaminar os testes seguintes. As verificações incluem resposta válida, lista vazia, erro HTTP, erro de rede, resposta inválida e recuperação após uma nova tentativa.

O loading é observado com uma promessa que o próprio teste libera, sem atraso aleatório. O teste de timeout de serviço usa o adaptador HTTP do Axios: o XHR simulado por jsdom/MSW não reproduz esse timeout. A mudança fica no teste; o serviço da aplicação permanece igual.

## Mantine e acessibilidade

O setup fornece `matchMedia`, `ResizeObserver` e `scrollIntoView`, ausentes ou incompletos no jsdom. Os componentes Mantine, modais e providers não são substituídos por elementos fictícios.

Os cartões e itens têm papel de artigo com nome do produto. Botões indicam, por exemplo, “Adicionar Arroz ao carrinho” e “Remover Leite do carrinho”. O seletor expõe “Quantidade selecionada de Arroz”, e os valores usam elementos `output` com nomes acessíveis.

Esses ajustes também ajudam leitores de tela e evitam seletores por classe, índice de elemento ou estrutura privada do Mantine. No Playwright, `getByLabel('Total da compra', { exact: true })` distingue o total do subtotal.

## Exemplo comentado de integração

O cenário completo está em `tests/integration/catalogoCarrinho.test.tsx`. Sua estrutura é:

```tsx
// Preparar: usar os providers reais e a API HTTP simulada pelo setup.
const user = userEvent.setup();
renderComProviders(<AppRoutes />, {
  estadoInicial: { atendimento: atendimentoVisitante },
});
await screen.findByRole('article', { name: 'Produto Arroz' });

// Agir: adicionar produtos e navegar pela interface.
await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
await user.click(screen.getByRole('button', { name: 'Adicionar Leite ao carrinho' }));
await user.click(screen.getByRole('link', { name: 'Revisar minha sacola (2)' }));

// Verificar: outra página recebeu os dados pelo Context real.
expect(screen.getByRole('article', { name: 'Item Arroz no carrinho' })).toBeVisible();
expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*15,00/);
```

Não há chamada a `setState`, contador de renders ou teste de classes CSS. Se o botão deixar de atualizar o Context, o teste não conseguirá mostrar o carrinho correto.

## Relógio do pagamento

Somente os testes que precisam medir o pagamento ativam fake timers. Eles configuram `advanceTimers` no user-event e avançam o relógio dentro de `act`:

- Antes de cinco segundos: nenhuma venda, confirmação bloqueada e processamento visível.
- Depois de cinco segundos: tela estável de aprovação, uma venda e total local preservado.
- Depois de desmontar: temporizadores removidos e nenhuma aprovação futura.

A RTL usa um wrapper assíncrono que drena microtarefas com um timer de zero milissegundos reconhecido pelo relógio do Jest. Para evitar bloqueio com Vitest, **apenas nesses testes** o wrapper usa `act`; a configuração original é restaurada no `afterEach`. O restante da suíte usa timers reais.

Como jsdom não implementa Web Locks, o setup executa a tarefa sequencialmente nos testes de React. Os E2E usam o Web Locks real do Chromium. Isso não constitui uma prova de concorrência entre duas abas.

## Rede e servidor nos E2E

A estratégia escolhida é a **opção B**:

1. O Playwright executa `npm run dev:e2e`, em `127.0.0.1:4175`.
2. Vite usa `--mode e2e`; somente nesse modo `main.tsx` deixa de iniciar o MSW.
3. O contexto bloqueia Service Workers.
4. `e2e/fixtures/loja.ts` registra as respostas antes de `page.goto`.
5. Produtos, carrinhos, consulta de CPF e perfis usam fixtures; chamadas inesperadas são bloqueadas e fazem o teste falhar.

Não existe `route.fetch`, encaminhamento para o DummyJSON, resposta montada com dados reais ou interceptação concorrente com MSW. Arquivos locais seguem para o Vite. Cada teste recebe um contexto de navegador novo, sem login ou dados de outro cenário. O Playwright administra a abertura e o encerramento do servidor; não é necessário iniciar o Vite manualmente.

As simulações mantêm os tempos reais: cinco segundos de pagamento, impressão/e-mail simulados e dez segundos de retorno na conclusão. As assertions aguardam estados observáveis, sem `page.waitForTimeout`.

## Relatórios e cobertura

Depois de `npm run test:coverage`:

- `coverage/index.html`: relatório navegável por arquivo e linha.
- `coverage/lcov.info`: formato consumido por editores e ferramentas de análise.
- Terminal: resumo de instruções, branches, funções e linhas.

A configuração inclui regras, serviços, schemas, contextos, hooks, componentes e páginas públicas e rotas. A porcentagem descreve **esse escopo**, não toda a aplicação. Não existe meta global de 100%. Use as linhas sem cobertura para localizar comportamentos relevantes ainda não exercitados; porcentagem alta, isoladamente, não prova que os resultados esperados são corretos.

Depois de `npm run test:e2e`, execute `npm run test:e2e:report`. Em caso de falha, o Playwright mantém screenshot e trace em `test-results/`. O trace permite acompanhar ações e requisições; o relatório fornece o caminho para abri-lo. Esses relatórios e `coverage/` estão no `.gitignore`.

## Acrescentar um teste semelhante

1. Escolha um comportamento observável e um resultado conhecido.
2. Reaproveite uma fixture tipada ou acrescente um produto pequeno e previsível.
3. Para componentes, monte pelo helper; para integração, mantenha os providers reais.
4. Se o cenário precisar de outra resposta HTTP, adicione um handler somente naquele teste.
5. Interaja com `user-event` ou locators do Playwright e aguarde todas as ações.
6. Verifique o resultado pela interface. Inspecione o armazenamento quando persistência ou registro da venda forem o objeto do teste.
7. Execute o arquivo, a suíte correspondente e a verificação de tipos.

Os cenários e resultados efetivamente executados estão em [VERIFICACAO.md](VERIFICACAO.md). A área administrativa completa, sincronização concorrente entre abas, todos os tamanhos de tela e o worker de navegador no preview não são comprovados por estes três E2E.
