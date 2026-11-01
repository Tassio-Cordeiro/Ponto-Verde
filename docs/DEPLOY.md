# CI/CD e publicação no GitHub Pages

Repositório público: [Tassio-Cordeiro/Ponto-Verde](https://github.com/Tassio-Cordeiro/Ponto-Verde).

Endereço de publicação: [https://tassio-cordeiro.github.io/Ponto-Verde/](https://tassio-cordeiro.github.io/Ponto-Verde/).

## Node e Yarn

O projeto usa **Node 24.x**, uma versão LTS compatível com Vite, Vitest e Playwright. `.nvmrc` contém `24`, `package.json` declara `engines.node: 24.x` e os runners leem esse arquivo.

O gerenciador é **Yarn Classic 1.22.22**, fixado em `packageManager`. Como Node 24 não exige a presença de Corepack, o pipeline instala explicitamente o Yarn pelo npm:

```bash
npm install --global yarn@1.22.22
yarn --version
yarn install --frozen-lockfile
```

O npm é utilizado apenas para disponibilizar essa versão do Yarn. As dependências da aplicação são instaladas pelo Yarn.

`yarn.lock` registra versões e integridades das dependências transitivas. `--frozen-lockfile` exige um lockfile suficiente para o manifesto e não permite atualizá-lo silenciosamente no CI. Não utilize `--ignore-engines`, `--no-lockfile` nem atualizações gerais de bibliotecas para resolver uma inconsistência de instalação.

### Migração validada

A migração preservou as dependências diretas e suas versões:

1. O lockfile npm v3 foi copiado para uma pasta temporária, sem alterar o original.
2. Nessa cópia, npm converteu o formato para v1, aceito pelo importador do Yarn Classic.
3. `yarn import` gerou o lockfile a partir da árvore existente.
4. Outra pasta temporária, inicialmente sem `node_modules`, recebeu apenas `package.json` e `yarn.lock` e executou a instalação congelada.
5. O hash do lockfile não mudou. As 240 identidades de pacote/versão instaladas nessa árvore estavam presentes no lockfile npm original; nenhuma versão nova foi introduzida.
6. A instalação congelada também foi executada na pasta principal. Uma instância local do Vite precisou ser reiniciada por manter um binário nativo bloqueado no Windows.
7. Somente depois da validação o `package-lock.json` foi removido. O único lockfile adotado é `yarn.lock`.

Para alterar uma dependência no futuro, use `yarn add` ou `yarn add --dev`, revise o diff e versione manifesto e lockfile no mesmo PR.

## CI: validar o código

Arquivo: `.github/workflows/ci-cd.yml`.

O workflow roda em push de branches e em Pull Request com destino à `main`. Os nomes dos checks são estáveis e únicos:

| Job/check    | Responsabilidade                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `qualidade`  | Checkout, Node 24, Yarn 1.22.22, instalação congelada, TypeScript e Vitest com cobertura                           |
| `e2e`        | Mesmo preparo, instalação do Chromium com dependências de sistema, jornada pública e verificação do build de Pages |
| `publicacao` | Executado somente em push na main, depois dos dois checks aprovados                                                |

`yarn test:coverage` executa `vitest run --coverage`: uma execução única, sem watch. Não há testes vazios, `passWithNoTests`, `continue-on-error` ou comandos para esconder uma falha.

O Chromium do runner é instalado com:

```bash
yarn playwright install --with-deps chromium
```

As configurações Playwright iniciam seus servidores automaticamente. Os testes usam dados determinísticos e não precisam da disponibilidade do DummyJSON real.

Os relatórios de cobertura e de navegador são enviados como artefatos mesmo se um teste falhar, com retenção de 14 dias. O `if: always()` existe apenas no upload dos relatórios e não transforma uma falha de teste em sucesso.

## CD: publicar o commit aprovado

O job `publicacao` possui:

```yaml
needs: [qualidade, e2e]
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Um PR não publica. Depois do merge, o push resultante na main executa novamente o CI sobre o commit integrado; somente então o CD pode publicar esse mesmo `github.sha`.

O job faz uma nova instalação congelada e `yarn build:pages`. O artefato não é reaproveitado do modo de teste. As actions oficiais configuram Pages, enviam somente `dist/` e realizam o deploy usando `GITHUB_TOKEN` e OIDC, sem PAT.

As permissões globais são `contents: read`. Somente o job de publicação recebe também `pages: write` e `id-token: write`. O ambiente é `github-pages`, com URL obtida de `steps.deploy.outputs.page_url`.

A concorrência agrupa execuções por branch/PR. Atualizações de uma branch cancelam sua execução antiga; a main não tem uma publicação em andamento cancelada por um novo push. O grupo `github-pages` também serializa os jobs de publicação.

As actions estão fixadas por SHA, com a versão correspondente no comentário:

| Action                        | Versão selecionada |
| ----------------------------- | ------------------ |
| actions/checkout              | v7.0.1             |
| actions/setup-node            | v7.1.0             |
| actions/upload-artifact       | v7.0.2             |
| actions/configure-pages       | v6.0.0             |
| actions/upload-pages-artifact | v5.0.0             |
| actions/deploy-pages          | v5.0.1             |

Os SHAs foram resolvidos das releases oficiais. Ao atualizar uma action, confira sua release e altere SHA e comentário juntos.

## Base do Vite e BrowserRouter

O site ocupa um subdiretório, por isso `vite.config.ts` define:

```ts
base: '/Ponto-Verde/';
```

O `BrowserRouter` utiliza `basename={import.meta.env.BASE_URL}`. As rotas continuam `/produtos`, `/carrinho`, `/admin/login` etc.; não repetimos o prefixo em cada Link, NavLink ou navigate.

O favicon usa `%BASE_URL%favicon.svg`. O Vite adapta os assets do build, incluindo a referência da capa no CSS, para `/Ponto-Verde/`. A URL do worker já utiliza `BASE_URL` e continua assim.

Nos E2E, o `baseURL` termina em `/Ponto-Verde/`, e a navegação inicial usa `page.goto('./')`. Um `page.goto('/')` abandonaria o subdiretório. Os testes com MemoryRouter continuam usando rotas internas isoladas, sem prefixo de hospedagem.

## Fallback 404 real

`scripts/prepare-pages.mjs` confirma a existência do worker e do base correto e copia `dist/index.html` para `dist/404.html`, além de criar `.nojekyll`.

No Pages, abrir diretamente uma rota como `/Ponto-Verde/admin/login` pode responder **HTTP 404** com o HTML personalizado. Esse HTML carrega os assets corretos, e o BrowserRouter interpreta a URL original, incluindo query string e fragmento.

Isso **não é um rewrite de servidor com status 200**. O 404 do documento de uma rota profunda é esperado; um 404 no JavaScript, CSS, favicon, imagem de capa ou Service Worker é um erro e deve ser investigado. A própria página 404 da aplicação permanece para rotas internas desconhecidas.

O preview do Vite pode esconder esse comportamento ao fazer seu próprio fallback. Por isso existe `scripts/serve-pages.mjs`, que serve arquivos reais sob o prefixo e usa `404.html` com status 404 quando o caminho não existe.

```bash
yarn build:pages
yarn serve:pages
```

Endereço local: `http://127.0.0.1:4176/Ponto-Verde/`.

`yarn test:pages` administra esse build e servidor automaticamente. Os testes verificam capa, favicon, worker, login profundo, query/hash, CPF, carrinho, rota dinâmica, guards e retomada da compra.

## MSW na versão publicada

O build normal inicia o worker e aguarda sua ativação antes de renderizar os componentes. O arquivo deve ser servido como JavaScript em:

`https://tassio-cordeiro.github.io/Ponto-Verde/mockServiceWorker.js`

Somente o modo `e2e` desativa o MSW; `yarn build:pages` usa o build de produção normal.

`mockApi` e os handlers continuam usando **`/api/clientes` na raiz da origem**. O escopo do worker determina quais páginas ele controla, não restringe os destinos das requisições dessas páginas ao mesmo subdiretório. Assim, uma página controlada sob `/Ponto-Verde/` pode ter sua consulta `/api/clientes` interceptada. Não há um backend de clientes no Pages.

Na suíte `test:pages`, o MSW real trata os clientes e somente as chamadas externas que ele deixa passar recebem fixtures pelo BrowserContext do Playwright. A resposta de CPF é confirmada como proveniente do Service Worker. Não há interceptação concorrente dos mesmos endpoints de clientes.

## Configurações do repositório

O YAML não substitui estas configurações reais:

- O repositório deve permanecer público.
- **Settings → Pages → Build and deployment → Source: GitHub Actions** (`build_type: workflow`).
- O ambiente `github-pages` permite deploy somente a partir da branch `main`, sem aprovação humana adicional.
- A main exige Pull Request, checks `qualidade` e `e2e`, branch atualizada, bloqueio de force push e exclusão, e aplicação das regras ao administrador.

Os checks obrigatórios são cadastrados depois de o GitHub gerar execuções identificáveis do workflow, vinculando seus nomes e o aplicativo GitHub Actions. A regra exige aprovação automática dos testes, sem tornar obrigatória uma revisão humana num projeto individual.

Não se deve usar push direto na main, `--force`, bypass de proteção ou desativação temporária dos checks para integrar uma alteração.

## Fluxo de trabalho

```text
branch de trabalho
  → push
  → Pull Request para main
  → qualidade + e2e aprovados
  → merge conforme a proteção
  → novo CI no commit da main
  → publicacao
  → ambiente github-pages e URL publicada
```

Equivalentes locais:

```bash
yarn install --frozen-lockfile
yarn typecheck
yarn test:coverage
yarn playwright install chromium
yarn test:e2e
yarn test:pages
yarn build:pages
```

## Consultar evidências e diagnosticar

- [Execuções e logs do workflow](https://github.com/Tassio-Cordeiro/Ponto-Verde/actions/workflows/ci-cd.yml).
- [Pull Requests](https://github.com/Tassio-Cordeiro/Ponto-Verde/pulls).
- [Atividade do ambiente github-pages](https://github.com/Tassio-Cordeiro/Ponto-Verde/deployments/activity_log?environments_filter=github-pages).
- [Aplicação no endereço publicado](https://tassio-cordeiro.github.io/Ponto-Verde/).

Uma publicação só está confirmada quando o job de deploy termina com sucesso e a URL entrega os arquivos e fluxos esperados. Os links da execução e do PR permitem conferir o commit integrado e os checks. O relatório [VERIFICACAO.md](VERIFICACAO.md) registra as verificações locais; os artefatos do Actions guardam os resultados do runner Linux.

Se qualidade ou E2E falhar, abra o job e seus artefatos, corrija na branch e envie outro commit. Se o deploy falhar, confira Pages como GitHub Actions, ambiente e permissões; não contorne o CI. Para rotas profundas, diferencie o 404 esperado do documento de um asset ou worker ausente.

## Referências oficiais

- [Workflows personalizados do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- [Yarn Classic: importação](https://classic.yarnpkg.com/en/docs/cli/import/) e [instalação congelada](https://classic.yarnpkg.com/en/docs/cli/install/).
- [Playwright: rede e Service Workers](https://playwright.dev/docs/service-workers).
