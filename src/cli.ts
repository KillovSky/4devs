#!/usr/bin/env node
import { generators } from './generators.js';
import { validators } from './validators.js';
import { local } from './local/index.js';
import { buildLocalResult } from './result.js';
import type { CertificateType, CreditCardGeneratorFlag, CreditCardValidatorFlag, BankAccountBank } from './consts.js';

const HELP = `4devs — geradores e validadores de dados brasileiros fictícios, via 4devs.com.br

Uso:
  4devs <comando> [argumentos] [opções]
  4devs validate <comando> [argumentos] [opções]

Comandos de geração:
  people                Gera uma ou mais pessoas fictícias
  cpf                    Gera um CPF
  cnpj                    Gera um CNPJ
  rg                      Gera um RG
  cnh                     Gera uma CNH
  pis-pasep               Gera um PIS/PASEP
  renavam                 Gera um RENAVAM
  voter-title              Gera um título de eleitor         (requer --uf)
  state-registration       Gera uma inscrição estadual
  certificate              Gera uma certidão
  bank-account             Gera dados de conta bancária
  credit-card              Gera dados de cartão de crédito
  vehicle                  Gera dados de veículo
  vehicle-brand            Sorteia marca(s) de veículo (local, sem rede)
  vehicle-plate            Gera uma placa de veículo
  company                  Gera dados de empresa
  city                     Lista cidades de um estado
  uf                       Sorteia código(s) de UF (local, sem rede)

Comandos de validação (use: 4devs validate <comando> <valor> [opções]):
  cpf, cnpj, rg, cnh, pis-pasep, renavam, voter-title, certificate  <codigo>
  state-registration <codigo> --uf SP
  bank-account --bank brasil --agency 1234 --account 56789-0
  credit-card <numero> --flag visa

Opções gerais:
  --json               Imprime o envelope de resposta completo (FourDevsResult)
  --timeout <ms>        Timeout da requisição, em milissegundos (padrão: 15000)
  --offline              Não tenta o 4devs.com.br; usa direto o modo local
                          (mesmo motor que entra em ação sozinho se o site cair)
  -h, --help            Mostra esta mensagem

Opções específicas por comando (exemplos):
  --n <numero>          people, vehicle-brand, uf
  --sex M|F|random       people
  --age <numero>         people, company
  --uf <UF>               vários comandos
  --no-formatting        desativa pontuação (cpf, cnpj, rg, ...)
  --type <tipo>           certificate (any|birth|wedding|religiousWedding|death)
  --bank <banco>          bank-account (random|brasil|bradesco|citibank|itau|santander)
  --flag <bandeira>       credit-card
  --brand <nome>          vehicle (ex.: Fiat, Toyota, Honda)

Exemplos:
  4devs people --n 3 --uf SP
  4devs cpf --no-formatting
  4devs bank-account --bank itau
  4devs cnpj --offline
  4devs validate cpf 123.456.789-09
  4devs validate credit-card 5555555555554444 --flag mastercard

Nota: se o 4devs.com.br estiver fora do ar, os comandos de geração e
validação caem sozinhos para o modo local (veja "source" no --json). Use
--offline para pular a tentativa de rede e ir direto ao modo local.
`;

interface ParsedArgs {
  command?: string;
  sub?: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let command: string | undefined;
  let sub: string | undefined;

  let i = 0;
  while (i < argv.length) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (key.startsWith('no-')) {
        flags[key.slice(3)] = false;
        i += 1;
      } else if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
      continue;
    }
    if (token === '-h') {
      flags.help = true;
      i += 1;
      continue;
    }
    if (!command) {
      command = token;
    } else if (command === 'validate' && !sub) {
      sub = token;
    } else {
      positional.push(token);
    }
    i += 1;
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
  if (typeof v === 'boolean') return v;
  return v !== 'false';
}

function printResult(result: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const r = result as { success: boolean; error: string | null; data: unknown };
  if (!r.success) {
    console.error(`Erro: ${r.error}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(r.data, null, 2));
}

function runOfflineGenerator(command: string, flags: ParsedArgs['flags'], formatting: boolean): unknown {
  switch (command) {
    case 'people':
      return buildLocalResult(local.generators.people({
        n: toNumber(flags.n),
        sex: (toStr(flags.sex) as 'M' | 'F' | 'random' | undefined) ?? 'random',
        age: toNumber(flags.age),
        uf: toStr(flags.uf) as never,
        formatting,
      }));
    case 'cpf':
      return buildLocalResult(local.generators.cpf({ uf: toStr(flags.uf) as never, formatting }));
    case 'cnpj':
      return buildLocalResult(local.generators.cnpj({ formatting }));
    case 'rg':
      return buildLocalResult(local.generators.rg({ formatting }));
    case 'cnh':
      return buildLocalResult(local.generators.cnh());
    case 'pis-pasep':
      return buildLocalResult(local.generators.pisPasep({ formatting }));
    case 'renavam':
      return buildLocalResult(local.generators.renavam());
    case 'voter-title': {
      const uf = toStr(flags.uf);
      if (!uf) throw new Error('voter-title exige --uf <UF>');
      return buildLocalResult(local.generators.voterTitle({ uf: uf as never }));
    }
    case 'state-registration':
      return buildLocalResult(local.generators.stateRegistration({ uf: toStr(flags.uf) as never, formatting }));
    case 'certificate':
      return buildLocalResult(local.generators.certificate({
        type: (toStr(flags.type) as CertificateType | undefined) ?? 'any',
        formatting,
      }));
    case 'bank-account':
      return buildLocalResult(local.generators.bankAccount({
        bank: (toStr(flags.bank) as BankAccountBank | 'random' | undefined) ?? 'random',
        uf: toStr(flags.uf) as never,
      }));
    case 'credit-card':
      return buildLocalResult(local.generators.creditCard({
        flag: toStr(flags.flag) as CreditCardGeneratorFlag | undefined,
        formatting,
      }));
    case 'vehicle':
      return buildLocalResult(local.generators.vehicle({ brand: toStr(flags.brand), uf: toStr(flags.uf) as never, formatting }));
    case 'vehicle-brand':
      return generators.vehicleBrand({ n: toNumber(flags.n) });
    case 'vehicle-plate':
      return buildLocalResult(local.generators.vehiclePlate({ uf: toStr(flags.uf) as never, formatting }));
    case 'company':
      return buildLocalResult(local.generators.company({ uf: toStr(flags.uf) as never, age: toNumber(flags.age), formatting }));
    case 'city':
      return buildLocalResult(local.generators.city({ uf: toStr(flags.uf) as never }));
    case 'uf':
      return generators.uf({ n: toNumber(flags.n) });
    default:
      throw new Error(`Comando de geração desconhecido: "${command}". Use --help para ver a lista.`);
  }
}

function runOfflineValidator(command: string, value: string | undefined, flags: ParsedArgs['flags']): unknown {
  switch (command) {
    case 'cpf':
      return buildLocalResult(local.validators.cpf(requireValue(value, command)));
    case 'cnpj':
      return buildLocalResult(local.validators.cnpj(requireValue(value, command)));
    case 'rg':
      return buildLocalResult(local.validators.rg(requireValue(value, command)));
    case 'cnh':
      return buildLocalResult(local.validators.cnh(requireValue(value, command)));
    case 'pis-pasep':
      return buildLocalResult(local.validators.pisPasep(requireValue(value, command)));
    case 'renavam':
      return buildLocalResult(local.validators.renavam(requireValue(value, command)));
    case 'voter-title':
      return buildLocalResult(local.validators.voterTitle(requireValue(value, command)));
    case 'certificate':
      return buildLocalResult(local.validators.certificate(requireValue(value, command)));
    case 'state-registration': {
      const uf = toStr(flags.uf);
      if (!uf) throw new Error('validate state-registration exige --uf <UF>');
      return buildLocalResult(local.validators.stateRegistration({ uf: uf as never, code: requireValue(value, command) }));
    }
    case 'bank-account': {
      const bank = toStr(flags.bank);
      const agency = toStr(flags.agency);
      const account = toStr(flags.account);
      if (!bank || !agency || !account) {
        throw new Error('validate bank-account exige --bank, --agency e --account');
      }
      return buildLocalResult(local.validators.bankAccount({ bank: bank as BankAccountBank, agency, account }));
    }
    case 'credit-card': {
      const flag = toStr(flags.flag);
      if (!flag) throw new Error('validate credit-card exige --flag <bandeira>');
      return buildLocalResult(local.validators.creditCard({ flag: flag as CreditCardValidatorFlag, code: requireValue(value, command) }));
    }
    default:
      throw new Error(`Comando de validação desconhecido: "${command}". Use --help para ver a lista.`);
  }
}

async function runGenerator(command: string, flags: ParsedArgs['flags']): Promise<unknown> {
  const timeout = toNumber(flags.timeout);
  const formatting = toBool(flags.formatting, true);

  if (flags.offline) return runOfflineGenerator(command, flags, formatting);

  switch (command) {
    case 'people':
      return generators.people({
        n: toNumber(flags.n),
        sex: (toStr(flags.sex) as 'M' | 'F' | 'random' | undefined) ?? 'random',
        age: toNumber(flags.age),
        uf: toStr(flags.uf) as never,
        formatting,
        timeout,
      });
    case 'cpf':
      return generators.cpf({ uf: toStr(flags.uf) as never, formatting, timeout });
    case 'cnpj':
      return generators.cnpj({ formatting, timeout });
    case 'rg':
      return generators.rg({ formatting, timeout });
    case 'cnh':
      return generators.cnh({ timeout });
    case 'pis-pasep':
      return generators.pisPasep({ formatting, timeout });
    case 'renavam':
      return generators.renavam({ timeout });
    case 'voter-title': {
      const uf = toStr(flags.uf);
      if (!uf) throw new Error('voter-title exige --uf <UF>');
      return generators.voterTitle({ uf: uf as never, timeout });
    }
    case 'state-registration':
      return generators.stateRegistration({ uf: toStr(flags.uf) as never, formatting, timeout });
    case 'certificate':
      return generators.certificate({
        type: (toStr(flags.type) as CertificateType | undefined) ?? 'any',
        formatting,
        timeout,
      });
    case 'bank-account':
      return generators.bankAccount({
        bank: (toStr(flags.bank) as BankAccountBank | 'random' | undefined) ?? 'random',
        uf: toStr(flags.uf) as never,
        timeout,
      });
    case 'credit-card':
      return generators.creditCard({
        flag: toStr(flags.flag) as CreditCardGeneratorFlag | undefined,
        formatting,
        timeout,
      });
    case 'vehicle':
      return generators.vehicle({
        brand: toStr(flags.brand),
        uf: toStr(flags.uf) as never,
        formatting,
        timeout,
      });
    case 'vehicle-brand':
      return generators.vehicleBrand({ n: toNumber(flags.n) });
    case 'vehicle-plate':
      return generators.vehiclePlate({ uf: toStr(flags.uf) as never, formatting, timeout });
    case 'company':
      return generators.company({
        uf: toStr(flags.uf) as never,
        age: toNumber(flags.age),
        formatting,
        timeout,
      });
    case 'city':
      return generators.city({ uf: toStr(flags.uf) as never, timeout });
    case 'uf':
      return generators.uf({ n: toNumber(flags.n) });
    default:
      throw new Error(`Comando de geração desconhecido: "${command}". Use --help para ver a lista.`);
  }
}

async function runValidator(command: string, value: string | undefined, flags: ParsedArgs['flags']): Promise<unknown> {
  const timeout = toNumber(flags.timeout);

  if (flags.offline) return runOfflineValidator(command, value, flags);

  switch (command) {
    case 'cpf':
      return validators.cpf(requireValue(value, command), { timeout });
    case 'cnpj':
      return validators.cnpj(requireValue(value, command), { timeout });
    case 'rg':
      return validators.rg(requireValue(value, command), { timeout });
    case 'cnh':
      return validators.cnh(requireValue(value, command), { timeout });
    case 'pis-pasep':
      return validators.pisPasep(requireValue(value, command), { timeout });
    case 'renavam':
      return validators.renavam(requireValue(value, command), { timeout });
    case 'voter-title':
      return validators.voterTitle(requireValue(value, command), { timeout });
    case 'certificate':
      return validators.certificate(requireValue(value, command), { timeout });
    case 'state-registration': {
      const uf = toStr(flags.uf);
      if (!uf) throw new Error('validate state-registration exige --uf <UF>');
      return validators.stateRegistration({ uf: uf as never, code: requireValue(value, command), timeout });
    }
    case 'bank-account': {
      const bank = toStr(flags.bank);
      const agency = toStr(flags.agency);
      const account = toStr(flags.account);
      if (!bank || !agency || !account) {
        throw new Error('validate bank-account exige --bank, --agency e --account');
      }
      return validators.bankAccount({ bank: bank as BankAccountBank, agency, account, timeout });
    }
    case 'credit-card': {
      const flag = toStr(flags.flag);
      if (!flag) throw new Error('validate credit-card exige --flag <bandeira>');
      return validators.creditCard({ flag: flag as CreditCardValidatorFlag, code: requireValue(value, command), timeout });
    }
    default:
      throw new Error(`Comando de validação desconhecido: "${command}". Use --help para ver a lista.`);
  }
}

function requireValue(value: string | undefined, command: string): string {
  if (!value) throw new Error(`O comando "validate ${command}" exige um valor posicional (o código a validar).`);
  return value;
}

async function main(): Promise<void> {
  const { command, sub, positional, flags } = parseArgs(process.argv.slice(2));

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
    const result = await runValidator(sub, positional[0], flags);
    printResult(result, asJson);
    return;
  }

  const result = await runGenerator(command, flags);
  printResult(result, asJson);
}

main().catch((err) => {
  console.error(`[4devs] erro: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
