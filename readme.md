# @killovsky/4devs

[![npm version](https://img.shields.io/npm/v/@killovsky/4devs.svg)](https://www.npmjs.com/package/@killovsky/4devs)
[![CI](https://github.com/KillovSky/4devs/actions/workflows/ci.yml/badge.svg)](https://github.com/KillovSky/4devs/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@killovsky/4devs.svg)](https://www.npmjs.com/package/@killovsky/4devs)
[![license](https://img.shields.io/npm/l/@killovsky/4devs.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@killovsky/4devs.svg)](./package.json)

Cliente para as ferramentas de geração e validação de dados brasileiros do [4devs.com.br](https://www.4devs.com.br): pessoa, CPF, CNPJ, RG, CNH, PIS/PASEP, RENAVAM, título de eleitor, inscrição estadual, certidões, conta bancária, cartão de crédito, veículo, placa, empresa e cidades por UF.

Não tem dependências: usa o `fetch` do Node 18 ou mais novo e um leitor de HTML próprio para os fragmentos que o site devolve. Se o 4devs cair ou bloquear a requisição, as funções continuam respondendo, gerando e validando os dados localmente (veja [Modo local](#modo-local)).

Os dados são fictícios e servem para testes de software. Este projeto não é afiliado ao 4devs.

## Instalação

```bash
npm i @killovsky/4devs
npm i -g @killovsky/4devs   # para usar a CLI em qualquer pasta
```

## Uso

```ts
import { generators, validators } from '@killovsky/4devs';

const pessoa = await generators.people({ n: 1, uf: 'SP' });
console.log(pessoa.data);
// [{ nome: 'Ana Costa Ribeiro', cpf: '123.456.789-09', rg: '...', ... }]

const check = await validators.cpf('123.456.789-09');
console.log(check.data);
// { isValid: true, raw: 'CPF: 123.456.789-09 - Válido - Verdadeiro' }
```

Toda função devolve o mesmo formato:

```ts
interface FourDevsResult<T> {
  date: string;                            // quando a resposta foi processada (ISO 8601)
  success: boolean;                        // true; só mudaria se a função não conseguisse devolver dado
  status: number;                          // status HTTP do 4devs (0 se a requisição nem foi respondida)
  explain?: { code: string; why: string }; // o que esse status significa
  error: string | null;
  data: T | null;
  source: 'network' | 'local';             // de onde veio `data`
  warning: string | null;                  // o motivo, quando `source` é 'local' por causa de uma falha
}
```

`generators.uf()` e `generators.vehicleBrand()` sorteiam a partir de tabelas do pacote, sem requisição, e por isso são síncronas.

## Geradores

| Função | Devolve |
| --- | --- |
| `generators.people(opts?)` | array de pessoas (`nome`, `cpf`, `rg`, `endereco`, `email`...) |
| `generators.cpf(opts?)` | string, por exemplo `"123.456.789-09"` |
| `generators.cnpj(opts?)` | string, por exemplo `"12.345.678/0001-95"` |
| `generators.rg(opts?)` | string, por exemplo `"32.145.876-4"` |
| `generators.cnh(opts?)` | string com 11 dígitos |
| `generators.pisPasep(opts?)` | string, por exemplo `"123.45678.90-1"` |
| `generators.renavam(opts?)` | string com 11 dígitos |
| `generators.voterTitle(opts)` | string com 12 dígitos (exige `uf`) |
| `generators.stateRegistration(opts?)` | string (o formato varia por UF) |
| `generators.certificate(opts?)` | string com a matrícula da certidão |
| `generators.bankAccount(opts?)` | objeto com banco, agência e conta |
| `generators.creditCard(opts?)` | objeto com número, validade, CVV e bandeira |
| `generators.vehicle(opts?)` | objeto com marca, modelo, placa, renavam e chassi |
| `generators.vehicleBrand(opts?)` | array de nomes de marca (sem rede) |
| `generators.vehiclePlate(opts?)` | string, por exemplo `"ABC1D23"` |
| `generators.company(opts?)` | objeto com razão social, CNPJ, IE e endereço |
| `generators.city(opts?)` | array com as cidades da UF |
| `generators.uf(opts?)` | array de siglas de UF (sem rede) |

Cada função tem a sua interface de opções em `types.ts` (`PeopleOptions`, `VehicleOptions` e assim por diante). A maioria aceita `formatting` (pontuação, padrão `true`) e `timeout` (em ms, padrão `15000`; valor que não seja um número maior que zero usa o padrão).

Entradas inválidas, como uma UF que não existe, lançam `RangeError` antes de qualquer requisição.

### CNPJ alfanumérico

Desde julho de 2026 o CNPJ pode ter letras nas 12 primeiras posições. Os dois dígitos verificadores continuam numéricos, e o cálculo é o mesmo, com cada caractere valendo seu código ASCII menos 48.

```ts
const cnpj = await generators.cnpj({ alphanumeric: true });
// { data: '65.P6S.0N9/0001-94', source: 'local', ... }

local.validators.cnpj('12.ABC.345/01DE-35'); // { isValid: true, ... }
```

Com `alphanumeric: true` a geração é sempre local, sem requisição. A validação local aceita CNPJ numérico e alfanumérico. Quando o 4devs responde, o veredito é o dele, e o site pode ainda não conhecer o formato novo.

## Validadores

```ts
await validators.cpf('123.456.789-09');
await validators.stateRegistration({ uf: 'SP', code: '110042490114' });
await validators.bankAccount({ bank: 'itau', agency: '1234', account: '56789-0' });
await validators.creditCard({ flag: 'visa', code: '4532015112830366' });
```

Cada um devolve `{ isValid: boolean, raw: string }` em `data`. `raw` é o texto que o 4devs devolveu (ou, no modo local, a mensagem do módulo), útil para entender um "inválido" inesperado. Um código que não seja texto, ou esteja vazio, lança `TypeError`.

`validators.voterTitle()` lê o penúltimo segmento da resposta do 4devs, não o último, porque essa ferramenta formata a resposta de outro jeito. Isso já é tratado internamente.

## Modo local

Quando a requisição ao 4devs falha (tempo esgotado, bloqueio, status de erro, HTML em formato diferente), a função não propaga o erro. Ela gera ou valida o dado localmente e devolve `source: 'local'`, com o motivo em `warning`.

```ts
const r = await generators.cpf();
if (r.source === 'local') console.log(r.warning);
```

Onde existe uma regra nacional única, o dígito verificador é calculado e conferido de verdade: CPF, CNPJ, PIS/PASEP, RENAVAM, CNH e Luhn (cartão). O CPF que sai do modo local fecha no mesmo algoritmo usado para validar. Os cartões gerados também têm o prefixo e o tamanho típicos da bandeira.

RG, título de eleitor, inscrição estadual, certidão e conta bancária variam por estado ou banco. Para esses, o modo local só confere o formato, e o `raw` da resposta diz isso. A matrícula de certidão sai com 32 dígitos, o tipo do livro de acordo com o `type` pedido, e os dois dígitos finais sorteados.

Para pular a tentativa de rede de propósito (testes, CI, sem internet), use `local`, que é síncrono:

```ts
import { local } from '@killovsky/4devs';

const cpf = local.generators.cpf();
const check = local.validators.cpf('123.456.789-09');
```

Na CLI, a opção equivalente é `--offline`.

## CLI

```bash
4devs people --n 3 --uf SP
4devs cpf --no-formatting
4devs cnpj --alphanumeric
4devs bank-account --bank itau
4devs credit-card --flag visa16
4devs vehicle --brand Fiat --uf MG
4devs city --uf RJ
4devs cpf --offline

4devs validate cpf 123.456.789-09
4devs validate credit-card 4532015112830366 --flag visa

4devs --help
4devs --version
```

Todo comando aceita `--json` (imprime o `FourDevsResult` completo, não só `data`) e `--timeout <ms>`. As opções também podem ser escritas como `--n=3`.

## Tabelas de referência

```ts
import {
  UF_CODES,                      // as 27 siglas de UF
  VEHICLE_BRANDS,                // as 87 marcas aceitas por generators.vehicle()
  BANK_ACCOUNT_BANKS,            // brasil, bradesco, citibank, itau, santander
  CREDIT_CARD_GENERATOR_FLAGS,   // 10 bandeiras do gerador
  CREDIT_CARD_VALIDATOR_FLAGS,   // 12 bandeiras do validador (os nomes são outros)
  CERTIFICATE_TYPES,             // any, birth, wedding, religiousWedding, death
} from '@killovsky/4devs';
```

Os bancos e as bandeiras seguem os formulários do site, onde a ordem e os códigos internos não são óbvios.

## Como funciona

As ferramentas do 4devs usam o mesmo endpoint (`POST /ferramentas_online.php`). O que muda é o campo `acao` do corpo e o header `Referer`, que aponta para a página da ferramenta. Algumas devolvem texto ou JSON; outras (conta bancária, cartão, veículo, empresa, cidades) devolvem um fragmento de HTML, que `src/parse.ts` interpreta.

Esse HTML vem da rede, então o leitor não usa regex: ele percorre o texto uma vez só, respeita aspas dentro das tags e casa cada tag de fechamento com a sua abertura. É isso que permite ler um `<div class="output-txt">` que está dentro de vários `<div>` de layout. A resposta também é limitada a 200 mil caracteres antes de chegar ao leitor.

### Funções de baixo nível

O leitor de HTML (`extractLabeledPairs`, `extractStrongInputPairs`, `extractOptionTexts`, `parseVerdadeiroFalso`, `decodeHtmlEntities`, `stripTags`) e os algoritmos do modo local (`generateCpfDigits`, `isValidCpf`, `formatCpf` e os equivalentes de CNPJ, PIS, RENAVAM, CNH, Luhn, RG, título, certidão, placa e chassi) também são exportados. Não são necessários no uso comum; ficam disponíveis para quem quiser montar um fallback próprio ou gerar só um dígito verificador.

## Testes

```bash
npm test
```

O `pretest` compila o pacote e os testes rodam com `node --test`, em TypeScript via `tsx`, sem framework externo. Eles importam de `dist/`, e não de `src/`, para testar o que é publicado. Nenhum teste acessa a rede: o `fetch` é substituído por respostas simuladas (site fora do ar, bloqueado ou respondendo em formato inesperado).

## Aviso

O módulo depende de uma ferramenta pública de terceiros, que pode mudar ou bloquear o acesso sem aviso. É por isso que existe o modo local.

## Contribuindo

Veja o [guia de contribuição](./CONTRIBUTING.md) e o [Código de Conduta](./CODE_OF_CONDUCT.md). Vulnerabilidades devem ser reportadas em privado, como descrito em [SECURITY.md](./SECURITY.md). O histórico de versões está em [CHANGELOG.md](./CHANGELOG.md).

## Licença

MIT, veja [LICENSE](./LICENSE).
