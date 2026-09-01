# @killovsky/4devs

[![npm version](https://img.shields.io/npm/v/@killovsky/4devs.svg)](https://www.npmjs.com/package/@killovsky/4devs)
[![CI](https://github.com/KillovSky/4devs/actions/workflows/ci.yml/badge.svg)](https://github.com/KillovSky/4devs/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@killovsky/4devs.svg)](https://www.npmjs.com/package/@killovsky/4devs)
[![license](https://img.shields.io/npm/l/@killovsky/4devs.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@killovsky/4devs.svg)](./package.json)

Cliente para as ferramentas de geração e validação de dados brasileiros do [4devs.com.br](https://www.4devs.com.br) — pessoa, CPF, CNPJ, RG, CNH, PIS/PASEP, RENAVAM, título de eleitor, inscrição estadual, certidões, conta bancária, cartão de crédito, veículo, placa, empresa e cidades por UF.

Sem dependências em tempo de execução: usa só `fetch` nativo (Node ≥18) e um parser de HTML próprio para os fragmentos que o site devolve. Se o 4devs cair ou bloquear a requisição, o módulo continua funcionando sozinho — os geradores e validadores caem para um modo local (veja [Modo local / fallback](#modo-local--fallback) abaixo).

## Instalação

```bash
npm i @killovsky/4devs
npm i -g @killovsky/4devs   # se quiser a CLI disponível global
```

## Uso básico

```ts
import { generators, validators } from '@killovsky/4devs';

const pessoa = await generators.people({ n: 1, uf: 'SP' });
console.log(pessoa.data);
// [{ nome: 'Ana Costa Ribeiro', cpf: '123.456.789-09', rg: '...', ... }]

const check = await validators.cpf('123.456.789-09');
console.log(check.data);
// { isValid: true, raw: 'CPF: 123.456.789-09 - Válido - Verdadeiro' }
```

Toda função devolve o mesmo formato de resposta:

```ts
interface FourDevsResult<T> {
  date: string;                            // quando a resposta foi processada (ISO 8601)
  success: boolean;                        // sempre true, a não ser que os parâmetros de entrada sejam inválidos
  status: number;                          // status HTTP devolvido pelo 4devs (0 se não deu nem pra tentar)
  explain?: { code: string; why: string }; // o que aquele status HTTP significa
  error: string | null;
  data: T | null;
  source: 'network' | 'local';             // de onde `data` veio
  warning: string | null;                  // preenchido quando source é 'local'
}
```

`generators.uf()` e `generators.vehicleBrand()` não fazem requisição nenhuma (são só sorteios locais a partir de tabelas embutidas) e por isso são síncronas — não retornam `Promise`.

## O que cada função gera

| Função                          | O que devolve                                                   |
| ---------------------------------- | ------------------------------------------------------------------ |
| `generators.people(opts?)`         | array de pessoas (`nome`, `cpf`, `rg`, `endereço`, `email`...)         |
| `generators.cpf(opts?)`            | string, ex. `"123.456.789-09"`                                        |
| `generators.cnpj(opts?)`           | string, ex. `"12.345.678/0001-95"`                                    |
| `generators.rg(opts?)`             | string, ex. `"32.145.876-4"`                                          |
| `generators.cnh(opts?)`            | string com 11 dígitos                                                 |
| `generators.pisPasep(opts?)`       | string, ex. `"123.45678.90-1"`                                        |
| `generators.renavam(opts?)`        | string com 11 dígitos                                                 |
| `generators.voterTitle(opts)`      | string com 12 dígitos (exige `uf`)                                    |
| `generators.stateRegistration(opts?)` | string (formato varia por UF)                                      |
| `generators.certificate(opts?)`    | string (matrícula de certidão)                                        |
| `generators.bankAccount(opts?)`    | objeto com banco/agência/conta                                        |
| `generators.creditCard(opts?)`     | objeto com número/validade/CVV/bandeira                               |
| `generators.vehicle(opts?)`        | objeto com marca/modelo/placa/renavam/chassi                          |
| `generators.vehicleBrand(opts?)`   | array de nomes de marca (local, sem rede)                             |
| `generators.vehiclePlate(opts?)`   | string, ex. `"ABC1D23"`                                               |
| `generators.company(opts?)`        | objeto com razão social/CNPJ/IE/endereço                              |
| `generators.city(opts?)`           | array com os nomes das cidades da UF                                  |
| `generators.uf(opts?)`             | array de siglas de UF (local, sem rede)                               |

Cada função tem sua própria interface de opções em `types.ts` — a maioria aceita `formatting?: boolean` (pontuação, padrão `true`) e `timeout?: number` (ms, padrão `15000`). Consulte os tipos exportados (`PeopleOptions`, `VehicleOptions` etc.) para a lista completa por comando.

## Validadores

```ts
await validators.cpf('123.456.789-09');
await validators.stateRegistration({ uf: 'SP', code: '110042490114' });
await validators.bankAccount({ bank: 'itau', agency: '1234', account: '56789-0' });
await validators.creditCard({ flag: 'visa', code: '4532015112830366' });
```

Cada um devolve `{ isValid: boolean, raw: string }` em `data`. `raw` é o texto que o 4devs (ou, no modo local, o próprio módulo) devolveu — útil pra depurar um "inválido" inesperado.

O único caso não óbvio: `validators.voterTitle()` lê o penúltimo (não o último) segmento da resposta do 4devs, porque essa ferramenta específica do site formata a resposta de um jeito diferente das outras. Isso já está tratado internamente — só documentando pra quem for ler o código.

## Modo local / fallback

Quando a requisição ao 4devs falha — timeout, bloqueio, HTML mudou de formato, o que for — a função não propaga o erro: ela gera ou valida o dado localmente e devolve normalmente, com `source: 'local'` e uma explicação em `warning`.

```ts
const r = await generators.cpf();
if (r.source === 'local') {
  console.log(r.warning); // "Não foi possível falar com o 4devs.com.br (...); gerado localmente..."
}
```

Isso é feito com algoritmos de verdade onde existe uma regra nacional única: **CPF, CNPJ, PIS/PASEP, RENAVAM, CNH e o algoritmo de Luhn (cartão de crédito)** têm dígito verificador calculado e conferido de verdade — o CPF que sai do fallback fecha no mesmo algoritmo usado pra validar. Para RG, título de eleitor, inscrição estadual, certidão e conta bancária não existe uma regra única nacional (cada estado/banco tem a sua), então o fallback confere só o formato — e isso fica dito explicitamente no `raw` da resposta, pra não passar confiança que não existe.

Se quiser pular a tentativa de rede de propósito (testes, CI, ambiente sem internet), use o módulo `local` diretamente — é síncrono, sem `Promise`:

```ts
import { local } from '@killovsky/4devs';

const cpf = local.generators.cpf();               // sem rede
const check = local.validators.cpf('123.456.789-09');
```

Na CLI, a flag equivalente é `--offline`.

## CLI

```bash
4devs people --n 3 --uf SP
4devs cpf --no-formatting
4devs bank-account --bank itau
4devs credit-card --flag visa16
4devs vehicle --brand Fiat --uf MG
4devs city --uf RJ
4devs cpf --offline              # não tenta o 4devs, gera local direto

4devs validate cpf 123.456.789-09
4devs validate credit-card 4532015112830366 --flag visa

4devs --help
```

Todo comando aceita `--json` (imprime o `FourDevsResult` completo, não só `data`) e `--timeout <ms>`.

## Tabelas de referência

```ts
import {
  UF_CODES,                      // as 27 siglas de UF
  VEHICLE_BRANDS,                // as 87 marcas aceitas por generators.vehicle()
  BANK_ACCOUNT_BANKS,            // brasil, bradesco, citibank, itau, santander
  CREDIT_CARD_GENERATOR_FLAGS,   // bandeiras aceitas pelo gerador (10)
  CREDIT_CARD_VALIDATOR_FLAGS,   // bandeiras aceitas pelo validador (12, nomes diferentes)
  CERTIFICATE_TYPES,             // any, birth, wedding, religiousWedding, death
} from '@killovsky/4devs';
```

Os bancos e bandeiras foram conferidos direto contra os formulários do site (a ordem e os códigos internos que o 4devs espera não são óbvios de fora).

## Como funciona por baixo

Todas as ferramentas do 4devs passam pelo mesmo endpoint (`POST /ferramentas_online.php`), diferenciando pelo campo `acao` do corpo da requisição e pelo header `Referer` apontando pra página da ferramenta. Algumas (pessoa, CPF, CNPJ...) devolvem texto puro ou JSON; outras (conta bancária, cartão, veículo, empresa, cidades) devolvem um fragmento de HTML que precisa ser interpretado — é o que `src/parse.ts` faz, sem nenhuma dependência de parsing de HTML.

Vale registrar uma armadilha que apareceu durante os testes: os fragmentos de conta bancária/cartão às vezes têm as `<div>` de valor aninhadas dentro de outras `<div>` de layout (grid/coluna). Uma regex simples do tipo `<div>...</div>` para na primeira tag de fechamento que encontra, que nem sempre é a correta. `extractLabeledPairs`/`extractElementTextsByClass` rastreiam o nível de aninhamento pra achar a tag de fechamento certa — há um teste de regressão especificamente pra esse caso em `tests/parse.test.ts`.

## Utilitários de baixo nível

O parser de HTML (`extractLabeledPairs`, `extractStrongInputPairs`, `extractOptionTexts`, `parseVerdadeiroFalso`, `decodeHtmlEntities`, `stripTags`) e os algoritmos usados no modo local (`generateCpfDigits`, `isValidCpf`, `formatCpf`, e equivalentes para CNPJ/PIS/RENAVAM/CNH/Luhn/RG/título de eleitor/certidão/placa/chassi) também são exportados diretamente do pacote. Não são necessários pro uso comum — `generators`/`validators`/`local` já cobrem isso — mas ficam disponíveis pra quem quiser montar um fallback próprio, depurar uma resposta inesperada do 4devs, ou gerar só o dígito verificador de algo sem passar pela composição completa (nome, endereço etc.) do gerador local.

## Testes

```bash
npm test
```

Compila o pacote (`pretest` chama `npm run build`) e roda com `node --test` sobre os testes escritos em TypeScript, via `tsx` — sem framework de testes externo. Os testes importam só de `dist/index.js` (o pacote já compilado), nunca direto de `src/*.ts` — isso evita depender de resolução de `.js`→`.ts` entre arquivos-fonte, que varia entre versões/loaders do Node e pode quebrar dependendo de como `node --test` é invocado. Cobre os algoritmos de dígito verificador (round-trip gera→valida, milhares de casos), o parser de HTML (incluindo o caso de `<div>` aninhada acima), as regras de validação de entrada, e o modo de fallback (com `fetch` mockado para simular o 4devs fora do ar, bloqueado, ou respondendo em formato inesperado).

## Aviso

Este módulo depende de uma ferramenta pública de terceiros (4devs.com.br), que pode mudar ou bloquear o acesso sem aviso — é justamente por isso que existe o modo local. Todos os dados gerados são fictícios, para uso em testes de software.

## Contribuindo

Contribuições são bem-vindas! Veja o [guia de contribuição](./CONTRIBUTING.md) para configurar o ambiente, rodar os testes e o fluxo de Pull Request. Ao participar, siga o [Código de Conduta](./CODE_OF_CONDUCT.md).

Para reportar vulnerabilidades de segurança, siga o processo em [SECURITY.md](./SECURITY.md) — não abra uma issue pública.

## Changelog

Veja [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões.

## Licença

MIT — veja [LICENSE](./LICENSE).
