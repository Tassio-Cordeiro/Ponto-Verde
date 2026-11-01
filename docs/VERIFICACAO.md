# Verificação da implementação

Este relatório diferencia verificações executadas de cenários que ainda precisam de validação pela interface.

## Executado

- `npm run typecheck`: aprovado com `strict: true`.
- `npm run format:check`: aprovado.
- `npm test`: 21 testes aprovados usando o executor nativo do Node, sem instalar outro framework de testes.
- `npm run build`: aprovado. O MSW do navegador é carregado por importação dinâmica e permanece habilitado no build.
- Servidor `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: iniciado com sucesso.
- HTTP 200 para `/`, `/produtos/api-16`, `/admin/login`, `/mercado.jpg` e `/mockServiceWorker.js` no preview, com tipos de conteúdo adequados.
- Inspeção do asset local da capa: fotografia de hortifruti adequada à tela inicial.

As verificações HTTP confirmam a entrega dos arquivos e o fallback das rotas da SPA; **não comprovam a execução do worker no navegador**. O worker gerado está presente em `dist/`.

### Integração real com o DummyJSON

Sem registrar tokens nos logs, foram executadas:

| Chamada                                                    | Resultado observado                        |
| ---------------------------------------------------------- | ------------------------------------------ |
| `POST /auth/login` com emilys                              | Tokens recebidos                           |
| `GET /auth/me`                                             | Usuário 1, username emilys, `role: admin`  |
| `GET /products/category/groceries?limit=0`                 | 27 produtos                                |
| `POST /auth/products/add`                                  | Produto fictício retornado com ID 195      |
| `PATCH /auth/products/16`                                  | Preço temporário retornado como 2,50       |
| `DELETE /auth/products/16`                                 | `isDeleted: true`                          |
| `POST /carts/add` com usuário 1, produto 16 e quantidade 2 | Carrinho 209, 1 produto, total remoto 3,98 |

Essas escritas são simulações do próprio DummyJSON e não persistem no servidor. O total remoto não é usado como total da venda local.

### Cobertura automatizada

`tests/regras.test.ts` verifica:

1. Centavos e arredondamento unitário de desconto.
2. Soma sem erro de ponto flutuante.
3. Recusa de uma segunda venda do mesmo atendimento.
4. Inclusão de vendas de atendimentos diferentes sem mutação.
5. Preservação dos preços do snapshot.
6. Normalização, verificadores de CPF e rejeição de sequências repetidas.
7. Contratos inválidos de produto, token e venda.
8. Reaplicação de ajustes locais e exclusões no catálogo.
9. Ajuste da sacola ao estoque e à remoção de produtos.

`tests/servicos.test.ts` verifica chamadas Axios e interceptores com MSW no Node:

10. Login, consulta do perfil e tokens somente no sessionStorage.
11. Login incorreto HTTP 400 sem refresh.
12. Recusa de perfil não administrativo.
13. Refresh único e repetição da chamada protegida.
14. Falha de refresh sem loop, com remoção dos tokens.
15. Catálogo vazio válido e rejeição de resposta inválida.
16. Mensagens distintas para rede e timeout.
17. Carrinho misto, seleção de IDs externos e conservação do total local.
18. POST, PATCH e DELETE protegidos de produtos.
19. Associações de CPF, cadastro local persistido, reencontro por CPF e rejeição de duplicidade.
20. Formulário inválido de cliente e ausência de Bearer na mockApi.
21. Recuperação isolada de uma chave inválida, preservando as demais.

## Limite da verificação visual

A automação de interface não chegou a iniciar o fluxo do aplicativo: o mecanismo de controle retornou interrupção por Escape ao tentar ativar uma janela minimizada. Uma nova tentativa após autorização também foi recusada pelo mesmo mecanismo. Não foram executados cliques de compra ou login no navegador. Não há evidência de teste visual, de responsividade ou de sincronização real entre duas abas nesta execução.

Portanto, os itens abaixo são **roteiro manual**, com cobertura parcial pelas regras e serviços automatizados quando indicada. Eles não devem ser apresentados como 23 cenários end-to-end já aprovados.

## Roteiro dos critérios de aceite

Use `npm run build` e `npm run preview`. Abra duas abas com exatamente a mesma origem. Para uma demonstração limpa, utilize um perfil separado do navegador; não é necessário apagar os dados de outro perfil.

| #   | Cenário e resultado esperado                                                       | Cobertura executada                                                         |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Iniciar, escolher Seguir sem CPF e comprar normalmente                             | Serviços de carrinho com visitante; UI pendente                             |
| 2   | Informar 529.982.247-25 e ver o nome do usuário 1                                  | Associação CPF/perfil testada; UI pendente                                  |
| 3   | Cadastrar 123.456.789-09, recarregar e reencontrá-lo                               | Handler, persistência e consulta testados; recarga UI pendente              |
| 4   | Adicionar, alterar quantidade e remover itens                                      | Regras de estoque testadas; controles UI pendentes                          |
| 5   | Recarregar a compra e conservar cliente e itens                                    | Armazenamento validado em teste; ciclo React pendente                       |
| 6   | Abrir /produtos/api-16 e um ID inexistente                                         | Rotas implementadas; UI pendente                                            |
| 7   | Confirmar, separar integração HTTP e aguardar cinco segundos                       | Serviço de integração testado; temporização UI pendente                     |
| 8   | Clicar duas vezes, recarregar durante a simulação e retomar; obter uma única venda | Unicidade e snapshot testados; Web Locks/recarga UI pendentes               |
| 9   | Imprimir nota, ver confirmação simulada e concluir                                 | Implementado; UI pendente                                                   |
| 10  | Enviar para e-mail válido com cliente e visitante; rejeitar inválido               | Schema implementado; fluxo UI pendente                                      |
| 11  | Aguardar dez segundos e iniciar nova compra sem dados anteriores                   | Cleanup implementado; UI pendente                                           |
| 12  | Tentar senha errada e ver mensagem sem refresh                                     | Automatizado no serviço                                                     |
| 13  | Abrir /admin/produtos sem token e receber login                                    | Proteção implementada; navegação UI pendente                                |
| 14  | Fazer login, recarregar /admin e aguardar verificação da sessão                    | Perfil/tokens testados; montagem inicial UI pendente                        |
| 15  | Expirar access token; renovar, ou encerrar caso refresh inválido                   | Automatizado nos interceptores                                              |
| 16  | Cadastrar, editar, excluir e recarregar produtos                                   | REST real, serviços e aplicação de ajustes testados; formulário UI pendente |
| 17  | Alterar preço e verificar catálogo e sacola                                        | Catálogo efetivo testado; reação visual pendente                            |
| 18  | Comparar venda antiga com produto recém-editado                                    | Automatizado no snapshot                                                    |
| 19  | Aprovar compra e vê-la no dashboard e na preparação                                | Mesma coleção implementada; fluxo UI pendente                               |
| 20  | Preparar/concluir e manter valores e quantidade de vendas                          | Transições implementadas; UI pendente                                       |
| 21  | Totem e preparação em abas diferentes da mesma origem                              | Listeners e Web Locks implementados; teste em duas abas pendente            |
| 22  | Simular falha, resposta inválida, vazio e URL de imagem inexistente                | Rede/timeout/contrato/vazio testados; fallback visual pendente              |
| 23  | Trocar páginas nas tabelas, navegar e usar tela estreita                           | Componentes implementados; UI responsiva pendente                           |

Para forçar erros no navegador durante uma avaliação, use as ferramentas de desenvolvimento para bloquear temporariamente uma chamada ou testar uma imagem inexistente em um produto local. As falhas não devem ser apresentadas como sucesso nem substituir o catálogo por uma lista fixa.

## Limitações conhecidas

- As funcionalidades de interface precisam da rodada manual descrita acima.
- O build emite aviso de chunk JavaScript acima de 500 kB. Isso não impede build/preview; uma evolução pode dividir as telas sob demanda.
- A versão obrigatória de Zod possui o aviso de auditoria documentado no README. Ela não foi substituída por uma versão incompatível com a exigência acadêmica.
- Dados, cadastro de clientes, pagamento e estoque pertencem a uma demonstração local; não há garantias de um backend comercial, nem sincronização entre computadores.
