/**
 * fordev-native/generators
 * ------------------------
 * Geradores de dados fictícios brasileiros via 4devs.com.br.
 *
 * Todas as funções devolvem um `FourDevsResult<T>` (veja `types.ts`) e nunca
 * lançam exceção por falha de rede — se a requisição ao 4devs falhar por
 * qualquer motivo, a função cai automaticamente para geração local
 * (`source: "local"` no resultado; veja `local/generators.ts`). Só lançam
 * exceção por parâmetros de entrada inválidos (ex.: UF inexistente),
 * validados de forma síncrona antes de qualquer requisição.
 */

import {
  assertValidUF,
  BANK_ACCOUNT_BANKS,
  CERTIFICATE_TYPES,
  CREDIT_CARD_GENERATOR_FLAGS,
  findVehicleBrand,
  UF_CODES,
  VEHICLE_BRANDS,
} from './consts.js';
import { fordevRequest } from './http.js';
import { localGenerators } from './local/generators.js';
import {
  extractLabeledPairs,
  extractOptionTexts,
  extractStrongInputPairs,
} from './parse.js';
import { randomChoice, sampleWithoutReplacement } from './random.js';
import { buildLocalResult, buildResult } from './result.js';
import type {
  BankAccountInfo,
  BankAccountOptions,
  CertificateOptions,
  CityOptions,
  CompanyInfo,
  CompanyOptions,
  CpfOptions,
  CreditCardInfo,
  CreditCardOptions,
  FakePerson,
  FormattingOptions,
  FourDevsResult,
  PeopleOptions,
  RequestTimeoutOption,
  StateRegistrationOptions,
  UfOptions,
  VehicleBrandOptions,
  VehicleInfo,
  VehicleOptions,
  VehiclePlateOptions,
  VoterTitleOptions,
} from './types.js';

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function scoreFlag(formatting: boolean | undefined): 'S' | 'N' {
  return formatting === false ? 'N' : 'S';
}

/**
 * Gera dados de uma ou mais pessoas fictícias (nome, CPF, RG, endereço,
 * contato, dados físicos etc). Se o 4devs estiver indisponível, os dados
 * são compostos localmente (veja `result.source`).
 *
 * @example
 * ```ts
 * const { data } = await generators.people({ n: 3, uf: 'SP' });
 * ```
 */
export async function people(options: PeopleOptions = {}): Promise<FourDevsResult<FakePerson[]>> {
  const n = clamp(options.n ?? 1, 1, 30);
  const uf = (options.uf ?? '').toUpperCase();
  assertValidUF(uf, { allowEmpty: true });

  const age = options.age ?? 0;
  if (age !== 0 && (age < 18 || age > 80)) {
    throw new RangeError(`A idade "${age}" é inválida. Use um valor entre 18 e 80, ou omita para aleatório.`);
  }

  const sexoField = options.sex === 'M' ? 'H' : options.sex === 'F' ? 'M' : 'I';

  const raw = await fordevRequest(
    'gerador_de_pessoas',
    {
      acao: 'gerar_pessoa',
      sexo: sexoField,
      pontuacao: scoreFlag(options.formatting),
      idade: age,
      cep_estado: uf,
      txt_qtde: n,
      cep_cidade: uf === '' ? 'Selecione o estado!' : '',
    },
    options,
  );

  return buildResult(
    raw,
    (body) => (JSON.parse(body) as FakePerson[]).map((record) => ({ ...record })),
    () => localGenerators.people({ ...options, n }),
  );
}

/** Gera o código de um CPF aleatório (válido perante o algoritmo oficial). */
export async function cpf(options: CpfOptions = {}): Promise<FourDevsResult<string>> {
  const uf = (options.uf ?? '').toUpperCase();
  assertValidUF(uf, { allowEmpty: true });

  const raw = await fordevRequest(
    'gerador_de_cpf',
    { acao: 'gerar_cpf', pontuacao: scoreFlag(options.formatting), cpf_estado: uf },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.cpf(options));
}

/** Gera o código de um CNPJ aleatório (válido perante o algoritmo oficial). */
export async function cnpj(options: FormattingOptions = {}): Promise<FourDevsResult<string>> {
  const raw = await fordevRequest(
    'gerador_de_cnpj',
    { acao: 'gerar_cnpj', pontuacao: scoreFlag(options.formatting) },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.cnpj(options));
}

/** Gera o código de um RG aleatório (padrão de emissão SSP-SP). */
export async function rg(options: FormattingOptions = {}): Promise<FourDevsResult<string>> {
  const raw = await fordevRequest(
    'gerador_de_rg',
    { acao: 'gerar_rg', pontuacao: scoreFlag(options.formatting) },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.rg(options));
}

/** Gera o número de uma CNH (Carteira Nacional de Habilitação) aleatória. */
export async function cnh(options: RequestTimeoutOption = {}): Promise<FourDevsResult<string>> {
  const raw = await fordevRequest('gerador_de_cnh', { acao: 'gerar_cnh' }, options);
  return buildResult(raw, (body) => body.trim(), () => localGenerators.cnh());
}

/** Gera o código de um PIS/PASEP aleatório. */
export async function pisPasep(options: FormattingOptions = {}): Promise<FourDevsResult<string>> {
  const raw = await fordevRequest(
    'gerador_de_pis_pasep',
    { acao: 'gerar_pis', pontuacao: scoreFlag(options.formatting) },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.pisPasep(options));
}

/** Gera o código de um RENAVAM (Registro Nacional de Veículos Automotores) aleatório. */
export async function renavam(options: RequestTimeoutOption = {}): Promise<FourDevsResult<string>> {
  const raw = await fordevRequest('gerador_de_renavam', { acao: 'gerar_renavam' }, options);
  return buildResult(raw, (body) => body.trim(), () => localGenerators.renavam());
}

/** Gera o número de um título de eleitor aleatório para o estado informado. */
export async function voterTitle(options: VoterTitleOptions): Promise<FourDevsResult<string>> {
  const uf = options.uf.toUpperCase();
  assertValidUF(uf);

  const raw = await fordevRequest(
    'gerador_de_titulo_de_eleitor',
    { acao: 'gerar_titulo_eleitor', estado: uf },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.voterTitle({ uf: uf as never }));
}

/** Gera o número de uma inscrição estadual aleatória. */
export async function stateRegistration(
  options: StateRegistrationOptions = {},
): Promise<FourDevsResult<string>> {
  const uf = (options.uf ?? 'SP').toUpperCase();
  assertValidUF(uf);

  const raw = await fordevRequest(
    'gerador_de_inscricao_estadual',
    { acao: 'gerar_ie', pontuacao: scoreFlag(options.formatting), estado: uf },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.stateRegistration(options));
}

/** Gera o número de uma certidão (nascimento, casamento, casamento religioso ou óbito) aleatória. */
export async function certificate(options: CertificateOptions = {}): Promise<FourDevsResult<string>> {
  const type = options.type ?? 'any';
  const tipoCertidao = CERTIFICATE_TYPES[type];
  if (!tipoCertidao) {
    throw new RangeError(
      `Tipo de certidão "${type}" é inválido. Use um de: ${Object.keys(CERTIFICATE_TYPES).join(', ')}.`,
    );
  }

  const raw = await fordevRequest(
    'gerador_numero_certidoes',
    { acao: 'gerador_certidao', pontuacao: scoreFlag(options.formatting), tipo_certidao: tipoCertidao },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.certificate(options));
}

/** Gera dados de uma conta bancária aleatória (banco, agência, conta e dígito verificador). */
export async function bankAccount(options: BankAccountOptions = {}): Promise<FourDevsResult<BankAccountInfo>> {
  const bankKey = options.bank ?? 'random';
  const bankCode = bankKey === 'random' ? '' : BANK_ACCOUNT_BANKS[bankKey]?.code;
  if (bankKey !== 'random' && bankCode === undefined) {
    throw new RangeError(
      `Banco "${bankKey}" é inválido. Use um de: random, ${Object.keys(BANK_ACCOUNT_BANKS).join(', ')}.`,
    );
  }

  const uf = (options.uf ?? '').toUpperCase();
  assertValidUF(uf, { allowEmpty: true });

  const raw = await fordevRequest(
    'gerador_conta_bancaria',
    { acao: 'gerar_conta_bancaria', estado: uf, banco: bankCode ?? '' },
    options,
  );

  return buildResult(
    raw,
    (body) => extractLabeledPairs(body, 'output-subtitle', 'output-txt'),
    () => localGenerators.bankAccount(options),
  );
}

/** Gera dados de um cartão de crédito aleatório (número, validade e CVV) para testes. */
export async function creditCard(options: CreditCardOptions = {}): Promise<FourDevsResult<CreditCardInfo>> {
  const flagKey = options.flag ?? randomChoice(Object.keys(CREDIT_CARD_GENERATOR_FLAGS) as Array<
    keyof typeof CREDIT_CARD_GENERATOR_FLAGS
  >);
  const flagValue = CREDIT_CARD_GENERATOR_FLAGS[flagKey];
  if (!flagValue) {
    throw new RangeError(
      `Bandeira "${flagKey}" é inválida. Use uma de: ${Object.keys(CREDIT_CARD_GENERATOR_FLAGS).join(', ')}.`,
    );
  }

  const raw = await fordevRequest(
    'gerador_de_numero_cartao_credito',
    { acao: 'gerar_cc', pontuacao: scoreFlag(options.formatting), bandeira: flagValue },
    options,
  );

  return buildResult(
    raw,
    (body) => extractLabeledPairs(body, 'output-subtitle', 'output-txt'),
    () => localGenerators.creditCard({ ...options, flag: flagKey }),
  );
}

/** Gera dados de um veículo aleatório (marca, modelo, placa, chassi, Renavam etc). */
export async function vehicle(options: VehicleOptions = {}): Promise<FourDevsResult<VehicleInfo>> {
  let fipeCode = '';
  if (options.brand) {
    const brand = findVehicleBrand(options.brand);
    if (!brand) {
      throw new RangeError(`Marca de veículo "${options.brand}" não encontrada. Veja \`VEHICLE_BRANDS\` para as opções suportadas.`);
    }
    fipeCode = String(brand.fipeCode);
  }

  const uf = (options.uf ?? '').toUpperCase();
  assertValidUF(uf, { allowEmpty: true });

  const raw = await fordevRequest(
    'gerador_de_veiculos',
    {
      acao: 'gerar_veiculo',
      pontuacao: scoreFlag(options.formatting),
      estado: uf,
      fipe_codigo_marca: fipeCode,
    },
    options,
  );

  return buildResult(raw, (body) => extractStrongInputPairs(body), () => localGenerators.vehicle(options));
}

/** Sorteia (localmente, sem requisição de rede) o nome de uma ou mais marcas de veículo suportadas. */
export function vehicleBrand(options: VehicleBrandOptions = {}): FourDevsResult<string[]> {
  const n = clamp(options.n ?? 1, 1, VEHICLE_BRANDS.length);
  const names = sampleWithoutReplacement(VEHICLE_BRANDS, n).map((b) => b.name);
  return buildLocalResult(names);
}

/** Gera o texto de uma placa de veículo aleatória. */
export async function vehiclePlate(options: VehiclePlateOptions = {}): Promise<FourDevsResult<string>> {
  const uf = (options.uf ?? '').toUpperCase();
  assertValidUF(uf, { allowEmpty: true });

  const raw = await fordevRequest(
    'gerador_de_placa_automoveis',
    { acao: 'gerar_placa', pontuacao: scoreFlag(options.formatting), estado: uf },
    options,
  );

  return buildResult(raw, (body) => body.trim(), () => localGenerators.vehiclePlate(options));
}

/** Gera dados de uma empresa fictícia (razão social, CNPJ, inscrição estadual, endereço etc). */
export async function company(options: CompanyOptions = {}): Promise<FourDevsResult<CompanyInfo>> {
  const uf = (options.uf ?? 'SP').toUpperCase();
  assertValidUF(uf);

  const age = clamp(options.age ?? 1, 1, 30);

  const raw = await fordevRequest(
    'gerador_de_empresas',
    { acao: 'gerar_empresa', pontuacao: scoreFlag(options.formatting), estado: uf, idade: age },
    options,
  );

  return buildResult(raw, (body) => extractStrongInputPairs(body), () => localGenerators.company(options));
}

/** Lista os nomes de todas as cidades do estado informado. */
export async function city(options: CityOptions = {}): Promise<FourDevsResult<string[]>> {
  const uf = (options.uf ?? 'SP').toUpperCase();
  assertValidUF(uf);

  const raw = await fordevRequest(
    'gerador_de_pessoas',
    { acao: 'carregar_cidades', cep_estado: uf },
    options,
  );

  return buildResult(raw, (body) => extractOptionTexts(body), () => localGenerators.city(options));
}

/** Sorteia (localmente, sem requisição de rede) um ou mais códigos de UF distintos. */
export function uf(options: UfOptions = {}): FourDevsResult<string[]> {
  const n = clamp(options.n ?? 1, 1, UF_CODES.length);
  return buildLocalResult(sampleWithoutReplacement(UF_CODES, n));
}

export const generators = {
  people,
  cpf,
  cnpj,
  rg,
  cnh,
  pisPasep,
  renavam,
  voterTitle,
  stateRegistration,
  certificate,
  bankAccount,
  creditCard,
  vehicle,
  vehicleBrand,
  vehiclePlate,
  company,
  city,
  uf,
};

export default generators;
