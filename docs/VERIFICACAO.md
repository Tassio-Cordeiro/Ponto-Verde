# Resultados da suíte automatizada

Este relatório descreve as verificações executadas sobre a aplicação e distingue a cobertura automatizada dos cenários que continuam manuais. As APIs das suítes são controladas; nenhuma depende do DummyJSON real.

## Comandos e resultados

| Comando              | Resultado                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `yarn typecheck`     | Aprovado, incluindo aplicação, testes e configurações, com TypeScript strict nos testes |
| `yarn test:run`      | 48 testes Vitest em 7 arquivos                                                          |
| `yarn test:coverage` | 48 testes aprovados; relatórios HTML, LCOV e terminal gerados                           |
| `yarn test:e2e`      | 3 jornadas aprovadas no Chromium, 2 workers, sem retries                                |
| `yarn build`         | Aprovado; build normal mantém a inicialização do MSW                                    |
| `yarn format:check`  | Verificação de estilo do código e documentação                                          |

O Chromium necessário foi verificado por `yarn playwright install chromium`. O servidor dos E2E foi iniciado e encerrado automaticamente pelo Playwright em `127.0.0.1:4175/Ponto-Verde/`, sem usar uma sessão pessoal de navegador.

Na preparação do deploy, `yarn install --frozen-lockfile` também passou em uma pasta limpa, com o hash do lockfile preservado. As versões instaladas foram comparadas ao lockfile npm anterior antes de removê-lo.

`yarn test:pages` aprovou mais **2 testes** sobre o build normal em `127.0.0.1:4176/Ponto-Verde/`. Foram verificados capa, favicon e worker com HTTP 200 e tipos corretos; login profundo com query/hash e HTTP 404; CPF respondido pelo MSW real; recarga de carrinho e de rota dinâmica; guards e continuação da compra. `yarn build:pages` gerou `404.html` e `.nojekyll`.

## Cobertura V8

Resultado de `yarn test:coverage`, no escopo declarado em `vitest.config.ts`:

| Métrica    | Cobertura        |
| ---------- | ---------------- |
| Instruções | 63,33% (425/671) |
| Branches   | 55,95% (216/386) |
| Funções    | 61,45% (118/192) |
| Linhas     | 66,26% (381/575) |

Entre os módulos centrais, `ListaProdutos.tsx` tem 92,30% de linhas cobertas, `Carrinho.tsx` 100%, `LojaContext.tsx` 83,63% e `useLocalStorage.ts` 94,73%. Esses números não representam uma meta nem substituem a avaliação dos comportamentos.

O relatório V8 mede **somente a execução no Vitest**. A tela inicial e a conclusão, por exemplo, são exercitadas no Chromium pelos E2E, mas essa execução não entra nessa porcentagem. Não há exigência de cobertura global de 100%.

Relatórios locais, gerados e ignorados pelo Git:

- `coverage/index.html` e `coverage/lcov.info`.
- `playwright-report/index.html`, aberto por `yarn test:e2e:report`.
- Em falhas, screenshot e trace em `test-results/`.

## Cenários por camada

### Unitários e contratos

`tests/calculos.test.ts` e `tests/regras.test.ts` cobrem:

- Carrinho vazio, quantidades e soma de produtos diferentes.
- Desconto, arredondamento unitário em centavos e ausência de erro de ponto flutuante.
- Participação de produtos locais e prevalência de ajustes administrativos.
- Preservação do preço registrado no snapshot de uma venda.
- Uma única venda por atendimento e ausência de mutação do histórico.
- Estoque, exclusões locais, CPF e rejeição de contratos inválidos.

### Componentes

`tests/componentes/catalogo.test.tsx` verifica loading controlado, nomes e preços, busca por nome e código de barras, busca sem resultados, lista vazia, erro HTTP com recuperação, contrato inválido e seleção limitada ao estoque.

`tests/componentes/carrinho.test.tsx` verifica estado vazio sem avanço, itens e quantidades, total conhecido, mudança entre mínimo e estoque, remoção parcial e total e aplicação do catálogo efetivo com produto local.

### Integração pública

`tests/integration/catalogoCarrinho.test.tsx` usa Context, serviços, validação e rotas reais para verificar:

1. Adição de produtos diferentes e resumo na página do carrinho.
2. Adição repetida sem duplicar linhas indevidamente.
3. Alteração de quantidade e remoção com total atualizado.
4. Recuperação de itens, quantidades e identificação após desmontagem e remontagem.

`tests/integration/pagamento.test.tsx` verifica carregamento HTTP separado da simulação, botão bloqueado, ausência de venda até 4.999 ms, aprovação após 5.000 ms, total local e registro único. Também verifica que desmontar remove os timers e impede aprovação futura.

### Serviços preservados

`tests/servicos.test.ts` mantém os testes anteriores de Axios, JWT, refresh, perfil, timeout/rede, carrinho misto, operações REST, cadastro fictício e recuperação de armazenamento inválido. As simulações usam MSW no Node. Os testes foram adaptados ao executor Vitest e ao armazenamento do jsdom, sem descartar cenários relevantes.

### E2E executados no Chromium

| Arquivo                            | Jornada aprovada                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/compraVisitante.spec.ts`      | Início → visitante → dois arrozes e um leite → R$ 25,00 → pagamento real de cinco segundos → impressão simulada → agradecimento → retorno automático → nova compra sem CPF/itens anteriores |
| `e2e/compraIdentificada.spec.ts`   | CPF conhecido → boas-vindas → café com desconto a R$ 7,20 → pagamento simulado → alteração do e-mail → envio simulado → conclusão                                                           |
| `e2e/persistenciaCarrinho.spec.ts` | Visitante → itens e quantidades → carrinho → recarga da página → mesmos itens/total → retorno ao catálogo sem repetir o modal                                                               |

Os testes conduzem a interface; não criam vendas diretamente no storage e não reduzem o tempo do pagamento. A rede é registrada antes da navegação e chamadas não previstas fazem o cenário falhar.

## Pequenas alterações no código da aplicação

- `CardProduto` e `ItemCarrinho`: artigos com nomes acessíveis para localizar cada produto semanticamente.
- Botões de adição e remoção: nomes que incluem o produto e a ação.
- `SeletorQuantidade`: nome do produto nos controles e `output` para a quantidade selecionada; os três consumidores foram atualizados.
- `ResumoCompra`: seção nomeada e saídas acessíveis para subtotal, descontos e total.
- `main.tsx`: somente `--mode e2e` dispensa o MSW, pois o Playwright controla todas as APIs e bloqueia Service Workers nesse ambiente.

Nenhuma regra de preço, desconto, estoque, quantidade ou duração de pagamento foi alterada. Não foi necessário substituir contextos, introduzir um provider de negócio fictício ou reescrever a arquitetura.

## Limites e cenários ainda manuais

- A suíte usa somente Chromium desktop; Firefox, WebKit e uma matriz de tamanhos de tela não foram executados.
- Os novos testes não percorrem a interface administrativa completa.
- Concorrência e sincronização entre duas abas não são comprovadas pelos cenários atuais. O jsdom executa uma implementação sequencial mínima de Web Locks; os E2E usam o recurso real do Chromium em uma aba por teste.
- A retomada de um pagamento interrompido por recarga não possui um E2E próprio. O teste de desmontagem comprova ausência de aprovação futura, sem afirmar que cobre toda a retomada.
- O cadastro de cliente novo é verificado nos handlers/serviços; não há E2E específico desse formulário.
- Os 3 E2E de jornada usam a estratégia B. Os 2 testes adicionais de Pages verificam o build normal com o MSW real e o fallback 404, em uma suíte separada. As chamadas externas continuam determinísticas nessa verificação.
- O aviso de chunk acima de 500 kB no build e o aviso de auditoria da versão obrigatória de Zod continuam documentados no README. As dependências funcionais da aplicação não foram atualizadas para adicionar os testes.

O guia [TESTES.md](TESTES.md) explica a organização, o isolamento, o tratamento dos temporizadores e como acrescentar um cenário semelhante.
