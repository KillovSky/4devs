# Contribuindo com o 4devs

Obrigado por considerar contribuir! Este documento resume como configurar o ambiente, os padrões do projeto e como enviar mudanças.

## Antes de começar

- Dê uma olhada nas [issues abertas](https://github.com/KillovSky/4devs/issues) para não duplicar trabalho.
- Para mudanças grandes ou que alterem a API pública, abra uma issue de discussão antes de codificar — evita retrabalho.
- Leia o [Código de Conduta](./CODE_OF_CONDUCT.md).

## Requisitos

- Node.js ≥ 18 (o mesmo mínimo declarado em `engines` no `package.json`)
- npm

Nenhuma dependência de execução é usada no pacote publicado (`dist/`); as `devDependencies` servem só para build/testes locais.

## Configurando o ambiente

```bash
git clone https://github.com/KillovSky/4devs.git
cd 4devs
npm install
```

## Fluxo de desenvolvimento

```bash
npm run dev     # tsup em modo watch, recompila a cada mudança em src/
npm run build   # build único (ESM + CJS + .d.ts) em dist/
npm test        # builda o pacote e roda a suíte de testes (node --test via tsx)
npm run test:watch
```

Os testes importam sempre de `dist/index.js` (o pacote já compilado), nunca direto de `src/*.ts` — por isso `npm test` sempre builda antes (`pretest`). Se você mudar algo em `src/` e rodar os testes sem rebuildar, vai estar testando código velho.

## Padrões do projeto

- **TypeScript estrito** — o `tsconfig.json` usa `strict: true`; evite `any` e type assertions desnecessárias.
- **Zero dependências de runtime** — não adicione nenhum pacote em `dependencies` sem discutir antes na issue/PR. O objetivo do projeto é continuar funcionando só com `fetch` nativo.
- **Todo gerador/validador que fala com a rede precisa de fallback local** — se você adicionar uma ferramenta nova que bate no 4devs.com.br, implemente também a versão correspondente em `src/local/` e cubra com testes (veja `tests/fallback.test.ts` como referência de como o `fetch` é mockado).
- **Documentação em português (pt-BR)** — comentários JSDoc, mensagens de erro e o `readme.md` seguem o padrão do projeto; mantenha consistência com o que já existe.
- **Nomes de exports em `consts.ts`/`types.ts`** devem corresponder exatamente aos valores aceitos pelos formulários do 4devs.com.br (não invente rótulos — confira contra o site quando possível).

## Testes

- Cubra qualquer comportamento novo ou alterado com testes em `tests/*.test.ts`.
- Algoritmos de dígito verificador (CPF, CNPJ, PIS/PASEP, RENAVAM, CNH, Luhn) precisam de teste de ida e volta (gera → valida).
- Mudanças no parser de HTML (`src/parse.ts`) precisam de um caso de teste com um fragmento de HTML real (ou o mais próximo disso) em `tests/parse.test.ts`.
- Rode `npm test` localmente antes de abrir o PR — o CI roda a mesma suíte.

## Enviando um Pull Request

1. Faça um fork e crie uma branch a partir de `main`: `git checkout -b minha-mudanca`.
2. Faça commits pequenos e com mensagens claras (não é obrigatório Conventional Commits, mas ajuda).
3. Garanta que `npm test` passa.
4. Abra o PR preenchendo o [template](./.github/PULL_REQUEST_TEMPLATE/pull_request_template.md) — descreva o que mudou, por quê, e como testar.
5. Atualize o `readme.md` se a mudança afetar a API pública, a CLI ou o comportamento documentado.

## Reportando bugs e sugerindo funcionalidades

Use os templates de issue do GitHub (bug ou funcionalidade). Para vulnerabilidades de segurança, **não abra uma issue pública** — siga o processo descrito em [SECURITY.md](./SECURITY.md).

## Dúvidas

Se algo aqui não estiver claro, abra uma issue com a tag `question` ou use um dos canais listados no template de issues.
