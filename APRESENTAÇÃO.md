# Ponto Verde — Mini Mercado

O projeto é um software de autoatendimento de mercado, onde o cliente escolhe produtos no totem, revisa a sacola, simula o pagamento e recebe um comprovante demonstrativo (simulado, não é gerado). A administração, com acesso remoto, acompanha clientes, catálogo, vendas e preparação dos pedidos.

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

## USO DA IA

O sistema foi desenvolvido com auxilio da ferramenta codex da openIA com o modelo GPT 6.1 SOL nivel alto.

## Entrega dos requisitos

### 1. Estrutura de componentes e tipagem com TypeScript

`CardProduto` exibe cada produto e `SeletorQuantidade` cuida dos botões de quantidade, com props tipadas em TypeScript.
`ResumoCompra` é reutilizado na sacola e no pagamento: recebe os totais pelo tipo `Resumo` e o botão de avançar por `children`.
A estrutura usa Vite; o visual combina Mantine e o CSS Module exclusivo da tela inicial.

### 2. Estado reativo, imutabilidade e ciclo de vida

Na sacola, `LojaContext` aumenta quantidades criando novos itens com spread e `map`; para remover, gera outra lista com `filter`.
No pagamento, `useState` guarda a fase e os segundos; o efeito conta cinco segundos durante a simulação e limpa o timer ao sair da tela.

### 3. Estado global com Context API e Custom Hooks

`useLoja` entrega o mesmo carrinho ao catálogo, à sacola e ao pagamento; `useAtendimento` compartilha cliente, venda e situação do pedido.
Os Providers ficam em `AppProviders`, e `useAuth` fornece a sessão administrativa; chamar `useLoja` fora de `LojaProvider`, por exemplo, gera um erro explicativo.

### 4. Roteamento e layouts com React Router

Em `/admin`, cabeçalho e menu permanecem visíveis enquanto o `<Outlet />` troca entre dashboard, clientes, produtos e preparação.
`NavLink` destaca a opção aberta, o login usa `useNavigate` para ir ao painel e `/produtos/:id` usa `useParams` para mostrar o produto escolhido.

### 5. Interface gráfica e formulários com Mantine UI

`ProdutoForm` usa `useForm` para cadastrar e editar nome, preço e estoque, com campos Mantine em colunas que se ajustam à tela.
As listas administrativas têm busca e paginação; “Salvar produto” mostra carregamento durante o envio, e o tema verde vem de `app/theme.ts`.

### 6. Fluxo de autenticação JWT e rotas protegidas

O login do cadeado chama `authService`, que envia as credenciais para `/auth/login`, salva os tokens no `sessionStorage` e consulta `/auth/me`.
`AuthContext` recupera a sessão ao recarregar a página, e `ProtectedRoute` redireciona quem não tem perfil `admin` para `/admin/login`.

### 7. Consumo de API REST, interceptors e validação com Zod

`produtosService` busca os alimentos na DummyJSON, valida a resposta com `safeParse` e converte os preços para centavos antes de montar o catálogo.
Em `api.ts`, os interceptors enviam o JWT nas alterações remotas de produtos e geram mensagens de erro; `useApi` controla o carregamento e o resultado na tela.
`produtoFormSchema` bloqueia preço inválido e estoque negativo via `zodResolver`; o tipo `Produto` é derivado do schema com `z.infer`.

### 8. Testes automatizados com Vitest e RTL

`catalogoCarrinho.test.tsx` usa RTL e `user-event` para adicionar arroz e leite e conferir R$ 15,00; aumentar o arroz muda o total para R$ 25,00.
O Vitest executa os cenários com contextos reais, rotas em memória e API simulada; os testes de pagamento também conferem o registro de uma única venda.

### 9. Testes ponta a ponta com Playwright

Os testes de `e2e/` percorrem a compra no Chromium headless: escolher produtos, revisar a sacola, pagar e simular o comprovante.
Há cenários com CPF e e-mail, visitante com impressão e recarga da sacola para confirmar que itens, quantidades e total continuam salvos.

### 10. Pipeline de CI/CD e deploy em produção

Após instalar com lockfile congelado, `ci-cd.yml` roda Vitest em `qualidade` e Playwright em `e2e`; `publicacao` depende dos dois para publicar a `main`.
`prepare-pages.mjs` gera `404.html`; com a base `/Ponto-Verde/`, links diretos como `/Ponto-Verde/admin/login` carregam a aplicação.
A proteção da `main` com PR e CI obrigatórios depende das regras configuradas no GitHub, ainda sem confirmação nesta revisão.
