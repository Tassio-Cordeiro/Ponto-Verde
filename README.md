# Ponto Verde — Mini Mercado

O projeto é um software de autoatendimento de mercado, onde o cliente escolhe produtos no totem, revisa a sacola, simula o pagamento e recebe um comprovante demonstrativo (simulado, não é gerado). A administração, com acesso remoto, acompanha clientes, catálogo, vendas e preparação dos pedidos.

## Executar

Requisitos: **Node.js 24.x**, **Yarn Classic 1.22.22**, internet para o DummyJSON e um navegador atualizado com Service Workers e Web Locks. A versão do Node está em `.nvmrc`. Fora de localhost ou 127.0.0.1, Service Workers exigem HTTPS.

Instale explicitamente a versão do gerenciador (npm é usado somente nesta instalação):

```bash
npm install --global yarn@1.22.22
yarn --version
```

Na pasta do projeto:

```bash
yarn install --frozen-lockfile
yarn dev
```

Abra `http://localhost:5173/Ponto-Verde/`, ou o endereço informado pelo Vite. Para testar a versão compilada:

```bash
yarn typecheck
yarn test:run
yarn build
yarn preview
```

O preview usa normalmente `http://localhost:4173/Ponto-Verde/`. Use **a mesma origem exata em todas as abas**. `localhost:5173` e `localhost:4173`, por exemplo, possuem dados diferentes.

| Comando                | Finalidade                                          |
| ---------------------- | --------------------------------------------------- |
| `yarn dev`             | Servidor de desenvolvimento                         |
| `yarn typecheck`       | Verificação TypeScript com `strict`                 |
| `yarn test`            | Vitest em modo de desenvolvimento (watch)           |
| `yarn test:run`        | Testes unitários, componentes e integração, uma vez |
| `yarn test:coverage`   | Execução com relatório de cobertura V8              |
| `yarn test:e2e`        | Jornada pública no Chromium com Playwright          |
| `yarn test:e2e:ui`     | Interface interativa do Playwright                  |
| `yarn test:e2e:report` | Abrir o relatório HTML do Playwright                |
| `yarn build`           | Verificação de tipos e geração de `dist/`           |
| `yarn preview`         | Servir o build localmente, incluindo o MSW          |
| `yarn format`          | Formatar o código para estudo                       |
| `yarn format:check`    | Verificar a formatação                              |
| `yarn lint`            | Executar o Oxlint da base do projeto                |

O arquivo `public/mockServiceWorker.js` está versionado. Se a versão do MSW for alterada, atualize-o com `yarn msw init public --save` e revise o lockfile. A inicialização aguarda o worker **em desenvolvimento, preview e produção**, antes de renderizar o React.

## CI/CD e GitHub Pages

Destino da publicação: [Ponto Verde no GitHub Pages](https://tassio-cordeiro.github.io/Ponto-Verde/).

O workflow [CI e CD](https://github.com/Tassio-Cordeiro/Ponto-Verde/actions/workflows/ci-cd.yml) executa `qualidade` e `e2e` nos pushes das branches e nos Pull Requests para a `main`. O job `publicacao` depende dos dois e só publica um push na `main`, usando o mesmo commit validado e um build normal, com MSW ativo.

```bash
yarn install --frozen-lockfile
yarn typecheck
yarn test:coverage
yarn playwright install chromium
yarn test:e2e
yarn test:pages
yarn build:pages
```

`yarn build:pages` gera o build e copia `index.html` para `404.html`. `yarn test:pages` verifica o build normal em um servidor que reproduz o status 404 do Pages nas rotas profundas, com o Service Worker ativo. Esses testes complementam os E2E determinísticos em modo `e2e`.

Veja [docs/DEPLOY.md](docs/DEPLOY.md) para entender Node/Yarn, lockfile congelado, jobs, base/basename, fallback 404, MSW, proteção da main e o fluxo branch → PR → checks → merge → deploy.

## Acesso de demonstração

Administração: clique no cadeado da tela inicial ou abra `/admin/login`.

- Usuário: **`emilys`**
- Senha: **`emilyspass`**
- A conta pública do DummyJSON foi consultada durante a implementação e retornou `role: admin`.

CPFs **fictícios**, usados somente na simulação local:

| CPF de demonstração | Vínculo externo        |
| ------------------- | ---------------------- |
| `529.982.247-25`    | Usuário 1 do DummyJSON |
| `111.444.777-35`    | Usuário 2 do DummyJSON |

O nome e o e-mail desses clientes são carregados de `/users/:id`. Não consultamos pessoas reais, não usamos `ssn` como CPF e não listamos todos os usuários do DummyJSON como clientes. Para demonstrar um cadastro novo, pode-se usar o CPF fictício `123.456.789-09`, com nome fictício e e-mail vazio ou de exemplo.

## Tecnologias e versões

Todas as dependências diretas estão fixadas em `package.json`; o `yarn.lock` deve ser mantido. O gerenciador adotado é Yarn Classic 1.22.22, indicado em `packageManager`.

| Tecnologia                                  | Versão          |
| ------------------------------------------- | --------------- |
| React / React DOM                           | 19.3.1          |
| Vite / plugin React                         | 8.3.5 / 6.1.2   |
| TypeScript                                  | 7.0.2           |
| React Router DOM                            | 7.18.5          |
| Mantine core, hooks, form e notifications   | 8.3.18          |
| Axios                                       | 1.21.0          |
| Zod                                         | 3.25.76         |
| mantine-form-zod-resolver                   | 1.3.0           |
| MSW                                         | 2.12.2          |
| Tabler Icons React                          | 3.35.0          |
| Prettier                                    | 3.6.2           |
| Vitest / coverage-v8                        | 5.0.5           |
| React Testing Library / DOM Testing Library | 16.3.3 / 10.4.2 |
| jest-dom / user-event                       | 7.0.1 / 14.6.8  |
| jsdom                                       | 27.0.1          |
| Playwright Test                             | 1.64.1          |

Foi preservada a combinação de Mantine e Zod solicitada para usar literalmente `import { z } from 'zod'`, `import { zodResolver } from 'mantine-form-zod-resolver'` e `validate: zodResolver(schema)`.

## Fluxo público

1. **Início:** cria um atendimento com UUID, limpa a sacola e abre o catálogo. Uma compra em andamento pode ser retomada pela tela inicial.
2. **Identificação:** o modal de CPF aparece somente enquanto a identificação está `pendente`. É possível identificar um cliente existente, criar um cliente fictício ou continuar como `visitante`.
3. **Catálogo:** carrega `/products/category/groceries?limit=0`. Os nomes conhecidos são traduzidos por metadados locais; os produtos e os preços vêm da API. Busca por nome ou código de barras, filtros por grupo, detalhes e controles de quantidade respeitam o estoque.
4. **Sacola:** permite alterar e remover itens. Subtotal, descontos e total são derivados do catálogo efetivo. Uma recarga conserva a compra em andamento.
5. **Pagamento:** congela itens e valores, integra a parcela compatível com `/carts/add` e, depois, executa cinco segundos de simulação visual. O carregamento HTTP aparece separadamente.
6. **Comprovante:** a venda já está salva. O cliente escolhe impressão simulada ou preenche um e-mail; visitantes também podem usar e-mail.
7. **Conclusão:** mostra o pedido e agradece. Após dez segundos, ou pelo botão, limpa somente atendimento e sacola.

Se houver recarga durante o pagamento, a tela informa a interrupção e exige clicar em **Retomar pagamento simulado**. Ela não aprova sozinha. Uma aprovação já registrada leva ao comprovante e não cria outra venda.

O checkout guarda um retrato dos valores confirmados. Depois de iniciada uma tentativa de pagamento, a seleção fica bloqueada para não alterar silenciosamente o que foi confirmado. Para abandonar essa tentativa e escolher outros itens, volte ao início e inicie uma nova compra.

## Rotas

| Rota pública         | Tela                                |
| -------------------- | ----------------------------------- |
| `/`                  | Início e modal de login             |
| `/produtos`          | Catálogo e identificação            |
| `/produtos/:id`      | Detalhes via `useParams`            |
| `/carrinho`          | Revisão da compra                   |
| `/pagamento`         | Integração e pagamento simulado     |
| `/comprovante`       | Escolha do comprovante              |
| `/comprovante/email` | E-mail validado                     |
| `/conclusao`         | Agradecimento e retorno temporizado |
| `/admin/login`       | Login administrativo público        |

As rotas de compra exigem um atendimento iniciado. Pagamento exige itens ou uma confirmação em retomada; comprovante exige venda aprovada; conclusão exige atendimento concluído. Uma URL inválida mostra a página 404. Produtos inexistentes recebem um estado vazio com retorno ao catálogo.

| Rota protegida               | Função                                            |
| ---------------------------- | ------------------------------------------------- |
| `/admin`                     | Indicadores, período, ranking e vendas recentes   |
| `/admin/clientes`            | Clientes fictícios, pesquisa e paginação          |
| `/admin/produtos`            | Tabela, pesquisa, paginação e exclusão confirmada |
| `/admin/produtos/novo`       | Cadastro                                          |
| `/admin/produtos/:id/editar` | Edição via `useParams`                            |
| `/admin/preparacao`          | Pedidos ativos e concluídos                       |

## Fluxo administrativo

O login faz `POST /auth/login`, valida os tokens e consulta `GET /auth/me`. Somente `role === 'admin'` libera as rotas. Na recarga, a aplicação aguarda a verificação da sessão antes de decidir entre mostrar a administração ou redirecionar.

Produtos originais usam `PATCH /auth/products/:id` e `DELETE /auth/products/:id`. O cadastro demonstra `POST /auth/products/add`. Após uma resposta válida de sucesso, a aplicação mantém a alteração localmente. Produtos criados têm UUID próprio e permanecem editáveis e removíveis localmente. O ID retornado pelo POST remoto não é reaproveitado como se fosse um recurso persistido.

O dashboard e a preparação leem **a mesma coleção de vendas**, sem dados financeiros de exemplo. O período filtra os indicadores; somente vendas aprovadas entram no total e no ticket médio. A preparação avança de `aguardando` para `em_preparacao` e, depois, `concluido`, registrando horários. Essa mudança não altera o pagamento nem cria uma venda.

## Organização do código

```text
src/
  main.tsx                  # Aguarda o MSW e inicializa o React em StrictMode
  App.tsx                   # Renderiza somente Main
  app/
    Main.tsx                # Composição principal
    AppProviders.tsx        # Mantine, Router e providers de negócio
    config.ts               # Marca, textos e durações
    theme.ts                # Tema Mantine centralizado
  components/
    shared/                 # Marca, imagem com fallback, loading, erro e vazio
    totem/                  # CPF, cadastro, produto, quantidade, item e resumo
    admin/                  # Login, formulário, indicadores e pedido
  contexts/                 # LojaContext, AtendimentoContext e AuthContext
  hooks/                    # Consumo dos contextos, requisições e persistência
  layouts/                  # TotemLayout e AdminLayout com Outlet
  pages/
    totem/                  # Telas do fluxo público
    admin/                  # Telas administrativas
  routes/                   # Routes, Route, proteção e condições do checkout
  services/                 # Axios e funções por recurso
  schemas/                  # Contratos externos, armazenamento e formulários
  types/                    # Tipos derivados com z.infer
  mocks/                    # Worker, handlers e associações de CPF
  utils/                    # Centavos, CPF, catálogo, vendas e armazenamento
tests/
  regras.test.ts            # Regras puras de negócio
  servicos.test.ts          # Serviços Axios, interceptores e handlers MSW
docs/
  VERIFICACAO.md            # Evidências e roteiro manual dos critérios de aceite
```

`main.tsx` e `app/Main.tsx` estão em diretórios diferentes para evitar conflito de nomes no Windows.

## Os três contextos

**LojaContext** mantém o catálogo recebido, aplica ajustes e exclusões locais e compartilha o carrinho. O resumo é calculado a partir dos itens e dos preços efetivos, sem cópias independentes de totais em estado. Se uma exclusão ou redução de estoque afetar a sacola, ela é ajustada com aviso. O estoque é um limite por compra; este protótipo não implementa reserva nem baixa permanente de estoque após a venda.

**AtendimentoContext** mantém identificação, etapa, pagamento, confirmação e comprovante, além da coleção de vendas/pedidos. O atendimento pode ser `pendente`, `identificado` ou `visitante` quanto à identificação. Pagamento e preparação têm estados independentes. A venda contém cliente opcional, itens com preços registrados, total e horários.

**AuthContext** mantém perfil, tokens e verificação inicial. Expõe login, renovação e logout. Os tokens ficam apenas em `sessionStorage`; fechar a sessão do navegador encerra essa persistência.

Todos os providers recebem `children: ReactNode`. Contextos compartilham negócio; props tipadas configuram componentes visuais. Busca, página da tabela e abertura de modal são estados locais com `useState`.

## Custom hooks

- `useLoja`, `useAtendimento` e `useAuth` conferem o provider e lançam erro descritivo quando usados fora dele.
- `useLocalStorage` lê dados com Zod, escreve na ação do usuário e sincroniza eventos externos. Atualizadores funcionais leem a versão persistida mais recente. Não colocamos a gravação dentro do updater de `useState`, pois o StrictMode pode executá-lo mais de uma vez.
- `useApi` organiza dados, carregamento, sucesso, erro e execução. Cada chamada do hook tem seu próprio estado. O componente oferece uma nova tentativa chamando a mesma operação; a tentativa mais recente controla o resultado exibido.
- `usePagamentoSimulado` integra o carrinho, controla a sequência visual e aprova a venda. Usa `useRef` para bloquear cliques repetidos, `AbortController` e cleanup dos temporizadores.
- `useVendas` calcula indicadores e ranking a partir das vendas do contexto. Não introduz outro contexto nem persiste valores derivados.

## Como os dados percorrem a aplicação

```text
Componente → hook/contexto → serviço Axios → resposta unknown
           → Zod.safeParse → result.data → atualização imutável do estado
           → nova renderização dos componentes consumidores
```

Exemplo: `LoginForm` valida os campos com Mantine Form e `zodResolver`, chama `useAuth().login`, que usa `authService`. O serviço valida tokens e perfil. O contexto atualiza o usuário, e o Router libera o layout administrativo.

Outro exemplo: `CardProduto` chama `useLoja().adicionar`. O contexto atualiza a sacola usando uma nova lista, persiste o resultado e recalcula o resumo. `ResumoCompra` recebe esse resumo por props e renderiza também os botões fornecidos por `children`.

## Axios, JWT e erros

`services/api.ts` concentra `baseURL: https://dummyjson.com`, timeout e interceptores instalados uma vez, fora do ciclo de renderização.

O interceptor de requisição envia Bearer somente aos caminhos protegidos `/auth/*`, excluindo login e refresh. O token não é enviado para o catálogo público, carrinhos públicos ou `mockApi`. Credenciais incorretas permanecem um erro do formulário e não iniciam refresh.

Ao receber 401 numa chamada protegida, o interceptor tenta `/auth/refresh` uma única vez, atualiza a sessão e repete a chamada original. Uma promessa compartilhada evita renovações paralelas desnecessárias. Se a renovação falhar ou a chamada repetida continuar inválida, a sessão termina. Rede, timeout, falta de permissão e recurso inexistente recebem mensagens específicas.

`mockApi` é uma instância separada, com `/api` como base. Os serviços não usam `fetch`; todas as requisições HTTP da aplicação passam por Axios. O MSW e o navegador administram internamente a infraestrutura do Service Worker.

O controle de perfil é **demonstrativo e realizado no frontend**. O DummyJSON não fornece um backend administrativo com autorização de produção para todas essas operações. Não coloque credenciais reais nessa demonstração.

## Zod

`schemas/dominio.ts` usa `z.object` para produtos da API, produtos adaptados, clientes, tokens, perfil, carrinho remoto, atendimento, vendas e dados persistidos. `types/index.ts` deriva os tipos com `z.infer`.

Os serviços recebem `unknown`. `validar` executa `safeParse`, devolve `result.data` em caso de sucesso e lança erro de contrato se os dados forem inválidos. Nenhuma resposta inválida é tratada como sucesso. As respostas de operações REST de produto são validadas nos campos de confirmação utilizados.

`schemas/formularios.ts` contém CPF, cadastro, login, e-mail e produto. Os formulários usam `@mantine/form` com `validate: zodResolver(schema)`. A máscara de CPF é só apresentação; consulta e persistência usam dígitos e a mesma regra de validação dos verificadores.

## Persistência e duas abas

Todas as chaves começam com `ponto-verde:v1:`.

| Armazenamento    | Dados                                                        |
| ---------------- | ------------------------------------------------------------ |
| `sessionStorage` | `sessao`: access token e refresh token                       |
| `localStorage`   | `clientes`, `catalogo`, `carrinho`, `atendimento` e `vendas` |

Leituras passam por Zod. Quando uma chave está inválida, somente essa chave é recuperada e um aviso é mostrado; os outros registros são preservados. Falha ao gravar não é apresentada como sucesso.

O evento `storage` atualiza as outras abas. Como a aba que grava não recebe seu próprio evento, a aplicação atualiza o estado diretamente e emite um evento local para os demais consumidores. Todos os listeners têm cleanup.

Para a apresentação, mantenha uma aba no totem e outra em `/admin/preparacao`. Ambas precisam usar o **mesmo protocolo, host e porta, no mesmo perfil do navegador**. A sessão JWT é própria de cada aba; faça login na aba administrativa. O localStorage não sincroniza computadores, perfis distintos ou portas diferentes. Existe um único atendimento público em andamento por origem; duas abas de totem compartilham essa compra.

Uma venda é única por `atendimentoId`. A aprovação usa **Web Locks** para serializar a gravação entre abas, relê o histórico e reutiliza uma venda existente. Impressão, e-mail, recarga e preparação não chamam o registro de venda. Navegadores sem Web Locks recebem uma mensagem e não concluem a aprovação.

## Identificadores e convenção monetária

- Produto original: ID interno como `api-16` e `dummyJsonId: 16`.
- Produto criado: UUID interno, `origem: local` e nenhum ID externo reaproveitado do POST fictício.
- Cliente inicial: vínculo estável com um perfil do DummyJSON; cliente novo: UUID sem vínculo obrigatório.
- Atendimento e venda: UUIDs próprios; pedido: número legível `PV-0001`, `PV-0002` etc.

Os valores numéricos do DummyJSON são considerados **reais brasileiros, sem câmbio**, apenas para a demonstração. Todo cálculo usa inteiros em centavos. O desconto unitário é `Math.round(precoCentavos * percentual / 100)`; depois ele é multiplicado pela quantidade. A mesma regra serve ao catálogo, à sacola e à venda. A exibição usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

O mínimo é uma unidade. `weight` não é interpretado como peso real de embalagem, e `minimumOrderQuantity` não é aplicado como regra de varejo.

## Integração com o DummyJSON e limitações

O DummyJSON simula alterações, mas não as persiste. Por isso o catálogo efetivo combina a API com produtos/ajustes e exclusões locais. Se a API falhar, a tela oferece erro e nova tentativa; não substituímos o catálogo remoto por uma lista fixa.

Em `/carts/add`, enviamos somente itens que possuem `dummyJsonId`, com quantidades e um usuário existente. Usamos o vínculo do cliente quando disponível; para visitante ou cliente local usamos `config.usuarioTecnicoId = 1`. **Esse usuário técnico não representa a identidade do comprador.**

Carrinhos mistos conservam todos os itens na venda local e enviam somente a parcela compatível. Carrinhos inteiramente locais não chamam o endpoint remoto. Os preços e totais retornados pelo DummyJSON nunca substituem o resumo confirmado da aplicação, pois a API usa seus próprios preços.

O catálogo e o primeiro carregamento dos clientes de demonstração exigem internet. Não existe servidor próprio, integração fiscal, pagamento, impressora física ou entrega real de mensagens. Os dados do navegador podem ser alterados por quem usa o computador; esta aplicação não deve ser usada como um sistema comercial de produção.

**Dependência exigida:** `npm audit` reportou um aviso de severidade alta em Zod 3.25.76 ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), esgotamento de memória ao validar coleções muito grandes). A versão foi mantida para atender à combinação acadêmica solicitada. Uma evolução para produção exige revisar essa restrição e atualizar a cadeia de validação.

## Identidade visual e imagem

`app/config.ts` centraliza marca, descrição, slogan, usuário técnico e tempos. `app/theme.ts` define o verde e os padrões Mantine. CSS complementa o tema, com um módulo específico para a capa. A imagem da tela inicial está em `public/mercado.jpg`, com fundo verde de fallback e sobreposição escura para leitura.

Origem da fotografia: [imagem de mercado no Unsplash](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=85). Os thumbnails dos produtos vêm do DummyJSON. Imagens de produto com erro têm fallback visual e texto em português.

## Mapeamento dos sete requisitos acadêmicos

| Requisito                                                      | Onde estudar                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1. Vite, React, TS, componentes, props e children              | `main.tsx`, `App.tsx`, `app/Main.tsx`, `types/index.ts`, `CardProduto.tsx`, `ResumoCompra.tsx`, providers |
| 2. Estado, imutabilidade e efeitos com cleanup                 | Contextos, `useLocalStorage.ts`, `usePagamentoSimulado.ts`, `TelaConclusao.tsx`, `Clientes.tsx`           |
| 3. Context API e hooks com validação                           | `contexts/` e `useLoja.ts`, `useAtendimento.ts`, `useAuth.ts`                                             |
| 4. Rotas declarativas, Outlet, NavLink, navegação e parâmetros | `routes/AppRoutes.tsx`, `ProtectedRoute.tsx`, layouts, `DetalhesProduto.tsx`, `EditarProduto.tsx`         |
| 5. Mantine, responsividade, formulário, paginação e loading    | `app/theme.ts`, `AppProviders.tsx`, `ProdutoForm.tsx`, `LoginForm.tsx`, tabelas, `Estados.tsx`            |
| 6. Login HTTP, JWT e área protegida                            | `services/authService.ts`, `services/api.ts`, `AuthContext.tsx`, `ProtectedRoute.tsx`                     |
| 7. Axios, interceptores, Zod e resolver                        | `services/`, `schemas/`, `types/`, formulários com `zodResolver`                                          |

## Roteiro de apresentação ao professor

1. Mostre a composição `main.tsx → App.tsx → app/Main.tsx` e a ordem dos providers.
2. Inicie uma compra sem CPF, filtre produtos, abra detalhes e adicione duas unidades. Mostre a alteração do resumo.
3. Recarregue a sacola para demonstrar persistência; remova um item e confirme o pagamento. Explique a separação entre requisição e os cinco segundos.
4. Escolha e-mail como visitante. Mostre a conclusão, o número do pedido e o retorno sem dados do comprador anterior.
5. Faça uma compra com `529.982.247-25`; depois demonstre um cadastro fictício novo.
6. Abra outra aba, faça login e acompanhe o pedido na preparação. Passe por ambos os status e mostre que o dashboard não ganhou outra venda.
7. Edite o preço de um produto e mostre a mudança no catálogo/sacola e a preservação dos preços de vendas antigas.
8. Cadastre um produto local e explique por que ele tem UUID, enquanto a parcela enviada a `/carts/add` usa IDs externos.
9. Abra um serviço, seu schema e o componente consumidor para explicar o caminho dos dados.
10. Execute `yarn test:run`, `yarn test:e2e`, `yarn typecheck` e `yarn build`. Mostre um teste de integração e uma jornada no navegador.

## Testes automatizados

A suíte prioriza catálogo, pesquisa, quantidade, Context, carrinho e persistência. Os testes existentes foram migrados para Vitest, preservando a cobertura de serviços e regras. Mantine e Zod mantêm suas versões originais.

```bash
yarn install --frozen-lockfile
yarn playwright install chromium
yarn typecheck
yarn test:run
yarn test:coverage
yarn test:e2e
```

`yarn test` acompanha alterações em modo watch. A cobertura HTML está em `coverage/index.html`; `yarn test:e2e:report` abre o relatório do navegador. Nenhuma suíte depende da disponibilidade do DummyJSON real.

- **Unitários:** regras puras de centavos, descontos, catálogo efetivo e unicidade de vendas.
- **Componentes:** RTL verifica o que aparece e o resultado de cliques e digitação com `user-event`.
- **Integração:** providers reais conectam catálogo e carrinho; MSW em Node controla somente o HTTP, mantendo Axios e Zod reais.
- **E2E:** Playwright conduz as jornadas públicas no Chromium, incluindo os cinco segundos de pagamento e o retorno automático ao início.

O helper `tests/renderComProviders.tsx` reúne Mantine, MemoryRouter e os providers reais necessários, sem substituir `useLoja`. Cada teste começa com armazenamento isolado; somente o cenário de persistência conserva os dados entre desmontagem e remontagem.

No modo **`e2e`**, o `main.tsx` não inicia o worker. O Playwright bloqueia Service Workers e instala as respostas HTTP antes da navegação. Nos modos normais, o MSW continua funcionando em desenvolvimento e build/preview. O servidor E2E é iniciado e encerrado pelo próprio Playwright.

Veja [docs/TESTES.md](docs/TESTES.md) para a explicação educacional, um exemplo comentado, isolamento, temporizadores, fixtures, relatórios e como acrescentar cenários. Os resultados executados e os limites de cobertura estão em [docs/VERIFICACAO.md](docs/VERIFICACAO.md).
