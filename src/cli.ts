#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { generators } from './generators.js';
import { validators } from './validators.js';
import { local } from './local/index.js';
import { buildLocalResult } from './result.js';
import type {
  BankAccountBank,
  CertificateType,
  CreditCardGeneratorFlag,
  CreditCardValidatorFlag,
  UFCode,
} from './consts.js';
import type { Sex } from './types.js';

const HELP = `4devs: geradores e validadores de dados brasileiros fictícios, via 4devs.com.br

Uso:
  4devs <comando> [opções]
  4devs validate <comando> <valor> [opções]

Comandos de geração:
  people                Pessoa fictícia
  cpf                   CPF
  cnpj                  CNPJ (--alphanumeric gera o formato novo, com letras)
  rg                    RG
  cnh                   CNH
  pis-pasep             PIS/PASEP
  renavam               RENAVAM
  voter-title           Título de eleitor (exige --uf)
  state-registration    Inscrição estadual
  certificate           Certidão
  bank-account          Conta bancária
  credit-card           Cartão de crédito
  vehicle               Veículo
  vehicle-brand         Sorteia marcas de veículo (local, sem rede)
  vehicle-plate         Placa
  company               Empresa
  city                  Cidades de um estado
  uf                    Sorteia siglas de UF (local, sem rede)

Comandos de validação:
  cpf, cnpj, rg, cnh, pis-pasep, renavam, voter-title, certificate  <código>
  state-registration <código> --uf SP
  bank-account --bank brasil --agency 1234 --account 56789-0
  credit-card <número> --flag visa

Opções gerais:
  --json                Imprime a resposta completa em vez de só o dado
  --timeout <ms>        Tempo limite da requisição (padrão: 15000)
  --offline             Não consulta o 4devs.com.br; usa o modo local
  -v, --version         Mostra a versão
  -h, --help            Mostra esta ajuda

Opções por comando:
  --n <número>          people, vehicle-brand, uf
  --sex M|F|random      people
  --age <número>        people, company
  --uf <UF>             vários comandos
  --no-formatting       sem pontuação (cpf, cnpj, rg, ...)
  --alphanumeric        cnpj
  --type <tipo>         certificate (any, birth, wedding, religiousWedding, death)
  --bank <banco>        bank-account (random, brasil, bradesco, citibank, itau, santander)
  --flag <bandeira>     credit-card
  --brand <marca>       vehicle (por exemplo Fiat, Toyota, Honda)

Exemplos:
  4devs people --n 3 --uf SP
  4devs cpf --no-formatting
  4devs cnpj --alphanumeric
  4devs bank-account --bank itau
  4devs validate cpf 123.456.789-09
  4devs validate credit-card 5555555555554444 --flag mastercard

Se o 4devs.com.br não responder, os comandos usam o modo local sozinhos; o campo
"source" de --json mostra qual foi usado.
`;

type Flags = Record<string, string | boolean>;

interface ParsedArgs {
  command?: string;
  sub?: string;
  positional: string[];
  flags: Flags;
}

// Flags que nunca recebem valor. Sem esta lista, "4devs --offline cpf" leria "cpf"
// como valor de --offline.
const BOOLEAN_FLAGS = new Set(['json', 'offline', 'help', 'version', 'alphanumeric']);

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Flags = {};
  let command: string | undefined;
  let sub: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '-h') {
      flags.help = true;
    } else if (token === '-v') {
      flags.version = true;
    } else if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      const key = eq === -1 ? token.slice(2) : token.slice(2, eq);

      if (eq !== -1) {
        flags[key] = token.slice(eq + 1);
      } else if (key.startsWith('no-')) {
        flags[key.slice(3)] = false;
      } else if (!BOOLEAN_FLAGS.has(key) && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
        flags[key] = argv[i + 1];
        i += 1;
      } else {
        flags[key] = true;
      }
    } else if (!command) {
      command = token;
    } else if (command === 'validate' && !sub) {
      sub = token;
    } else {
      positional.push(token);
    }
  }

  return { command, sub, positional, flags };
}

function toNumber(v: string | boolean | undefined): number | undefined {
  if (v === undefined || typeof v === 'boolean') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v: string | boolean | undefined): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function toBool(v: string | boolean | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return typeof v === 'boolean' ? v : v !== 'false';
}

function requireFlag(flags: Flags, name: string, command: string): string {
  const value = toStr(flags[name]);
  if (!value) throw new Error(`${command} exige --${name}.`);
  return value;
}

type Options = Record<string, unknown>;
type AnyFn = (options: Options) => unknown;

// Cada comando de geração aponta para uma função de `generators` e diz como montar
// as opções a partir das flags.
const GENERATOR_COMMANDS: Record<string, { fn: keyof typeof generators; options: (f: Flags, formatting: boolean) => Options }> = {
  people: {
    fn: 'people',
    options: (f, formatting) => ({
      n: toNumber(f.n),
      sex: (toStr(f.sex) as Sex | undefined) ?? 'random',
      age: toNumber(f.age),
      uf: toStr(f.uf) as UFCode | undefined,
      formatting,
    }),
  },
  cpf: { fn: 'cpf', options: (f, formatting) => ({ uf: toStr(f.uf), formatting }) },
  cnpj: { fn: 'cnpj', options: (f, formatting) => ({ formatting, alphanumeric: Boolean(f.alphanumeric) }) },
  rg: { fn: 'rg', options: (_f, formatting) => ({ formatting }) },
  cnh: { fn: 'cnh', options: () => ({}) },
  'pis-pasep': { fn: 'pisPasep', options: (_f, formatting) => ({ formatting }) },
  renavam: { fn: 'renavam', options: () => ({}) },
  'voter-title': { fn: 'voterTitle', options: (f) => ({ uf: requireFlag(f, 'uf', 'voter-title') }) },
  'state-registration': { fn: 'stateRegistration', options: (f, formatting) => ({ uf: toStr(f.uf), formatting }) },
  certificate: {
    fn: 'certificate',
    options: (f, formatting) => ({ type: (toStr(f.type) as CertificateType | undefined) ?? 'any', formatting }),
  },
  'bank-account': {
    fn: 'bankAccount',
    options: (f) => ({ bank: (toStr(f.bank) as BankAccountBank | 'random' | undefined) ?? 'random', uf: toStr(f.uf) }),
  },
  'credit-card': {
    fn: 'creditCard',
    options: (f, formatting) => ({ flag: toStr(f.flag) as CreditCardGeneratorFlag | undefined, formatting }),
  },
  vehicle: { fn: 'vehicle', options: (f, formatting) => ({ brand: toStr(f.brand), uf: toStr(f.uf), formatting }) },
  'vehicle-brand': { fn: 'vehicleBrand', options: (f) => ({ n: toNumber(f.n) }) },
  'vehicle-plate': { fn: 'vehiclePlate', options: (f, formatting) => ({ uf: toStr(f.uf), formatting }) },
  company: { fn: 'company', options: (f, formatting) => ({ uf: toStr(f.uf), age: toNumber(f.age), formatting }) },
  city: { fn: 'city', options: (f) => ({ uf: toStr(f.uf) }) },
  uf: { fn: 'uf', options: (f) => ({ n: toNumber(f.n) }) },
};

async function runGenerator(command: string, flags: Flags): Promise<unknown> {
  const spec = GENERATOR_COMMANDS[command];
  if (!spec) throw new Error(`Comando de geração desconhecido: "${command}". Use --help para ver a lista.`);

  const options = spec.options(flags, toBool(flags.formatting, true));
  const online = generators[spec.fn] as unknown as AnyFn;
  const offline = (local.generators as Record<string, unknown>)[spec.fn] as AnyFn | undefined;

  // vehicle-brand e uf já são locais e só existem em `generators`.
  if (flags.offline && offline) return buildLocalResult(offline(options));
  return online({ ...options, timeout: toNumber(flags.timeout) });
}

// Validadores que recebem só o código.
const CODE_VALIDATORS: Record<string, keyof typeof validators> = {
  cpf: 'cpf',
  cnpj: 'cnpj',
  rg: 'rg',
  cnh: 'cnh',
  'pis-pasep': 'pisPasep',
  renavam: 'renavam',
  'voter-title': 'voterTitle',
  certificate: 'certificate',
};

// Validadores que recebem um objeto de opções.
const OPTION_VALIDATORS: Record<string, { fn: keyof typeof validators; options: (code: string | undefined, f: Flags) => Options }> = {
  'state-registration': {
    fn: 'stateRegistration',
    options: (code, f) => ({ uf: requireFlag(f, 'uf', 'validate state-registration'), code: requireCode(code, 'state-registration') }),
  },
  'bank-account': {
    fn: 'bankAccount',
    options: (_code, f) => ({
      bank: requireFlag(f, 'bank', 'validate bank-account') as BankAccountBank,
      agency: requireFlag(f, 'agency', 'validate bank-account'),
      account: requireFlag(f, 'account', 'validate bank-account'),
    }),
  },
  'credit-card': {
    fn: 'creditCard',
    options: (code, f) => ({
      flag: requireFlag(f, 'flag', 'validate credit-card') as CreditCardValidatorFlag,
      code: requireCode(code, 'credit-card'),
    }),
  },
};

function requireCode(value: string | undefined, command: string): string {
  if (!value) throw new Error(`"validate ${command}" exige o código a validar como argumento.`);
  return value;
}

async function runValidator(command: string, value: string | undefined, flags: Flags): Promise<unknown> {
  const timeout = toNumber(flags.timeout);
  const codeFn = CODE_VALIDATORS[command];
  const optionSpec = OPTION_VALIDATORS[command];

  if (codeFn) {
    const code = requireCode(value, command);
    if (flags.offline) return buildLocalResult((local.validators[codeFn] as (c: string) => unknown)(code));
    return (validators[codeFn] as (c: string, o: Options) => Promise<unknown>)(code, { timeout });
  }

  if (optionSpec) {
    const options = optionSpec.options(value, flags);
    if (flags.offline) return buildLocalResult((local.validators[optionSpec.fn] as unknown as AnyFn)(options));
    return (validators[optionSpec.fn] as unknown as AnyFn)({ ...options, timeout });
  }

  throw new Error(`Comando de validação desconhecido: "${command}". Use --help para ver a lista.`);
}

function printResult(result: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { success, error, data } = result as { success: boolean; error: string | null; data: unknown };
  if (!success) {
    console.error(`Erro: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    return pkg.version;
  } catch {
    return 'desconhecida';
  }
}

async function main(): Promise<void> {
  const { command, sub, positional, flags } = parseArgs(process.argv.slice(2));

  if (flags.version) {
    console.log(readVersion());
    return;
  }

  if (flags.help || !command || command === 'help') {
    process.stdout.write(HELP);
    return;
  }

  const asJson = Boolean(flags.json);

  if (command === 'validate') {
    if (!sub) {
      process.stdout.write(HELP);
      process.exitCode = 1;
      return;
    }
    printResult(await runValidator(sub, positional[0], flags), asJson);
    return;
  }

  printResult(await runGenerator(command, flags), asJson);
}

main().catch((err) => {
  console.error(`[4devs] erro: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
