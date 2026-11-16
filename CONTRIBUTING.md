# Contribuindo

Obrigado pelo interesse! Aqui está o que você precisa para rodar o projeto e enviar mudanças.

Antes de começar, dê uma olhada nas [issues abertas](https://github.com/KillovSky/4devs/issues). Se a mudança for grande ou alterar a API pública, abra uma issue antes para conversarmos. E leia o [Código de Conduta](./CODE_OF_CONDUCT.md).

## Ambiente

Você precisa do Node.js 18 ou mais novo (o mesmo mínimo de `engines`) e do npm.

```bash
git clone https://github.com/KillovSky/4devs.git
cd 4devs
npm install
```

## Comandos

```bash
npm run dev          # recompila a cada mudança em src/
npm run build        # gera dist/ (ESM, CJS e .d.ts)
npm test             # compila e roda os testes
npm run test:watch
```

Os testes importam de `dist/`, não de `src/`. Por isso `npm test` compila antes. Se rodar os testes sem compilar, você testa o código antigo.

## Padrões

- TypeScript com `strict`. Evite `any` e conversões de tipo desnecessárias.
- O pacote não tem dependências de execução. Não adicione nenhuma sem combinar antes.
- Mensagens de erro, comentários e documentação em português do Brasil.
- O que vem do 4devs é dado externo. Não use regex em HTML que veio da rede; use as funções de `src/parse.ts`, que percorrem o texto uma vez só.
- Toda função que fala com a rede precisa de um equivalente em `src/local/`, usado como fallback. `tests/fallback.test.ts` mostra como o `fetch` é simulado.
- Os nomes e valores de `consts.ts` e `types.ts` devem bater com o que os formulários do 4devs aceitam. Confira no site antes de acrescentar algo.

## Testes

- Cubra o comportamento novo ou alterado em `tests/*.test.ts`. Os testes não acessam a rede.
- Algoritmos de dígito verificador precisam de teste de ida e volta (gera e depois valida).
- Mudanças em `src/parse.ts` precisam de um caso com um fragmento de HTML real, ou o mais próximo disso, em `tests/parse.test.ts`.
- Rode `npm test` e `npx tsc --noEmit` antes de abrir o PR. O CI roda os dois.

## Pull Request

1. Faça um fork e crie uma branch a partir da `main`.
2. Faça commits pequenos, com mensagens claras.
3. Abra o PR seguindo o [template](./.github/PULL_REQUEST_TEMPLATE/pull_request_template.md).
4. Atualize o `readme.md` e o `CHANGELOG.md` se a mudança afetar a API, a CLI ou o comportamento documentado.

Bugs e sugestões vão pelos templates de issue. Vulnerabilidades não devem virar issue pública, veja o [SECURITY.md](./SECURITY.md).
