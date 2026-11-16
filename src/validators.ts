// Validadores de documentos e dados brasileiros via 4devs.com.br. O resultado fica em
// `data.isValid`. Se a requisição falhar, a validação é refeita localmente (veja
// local/validators.ts e os campos `source` e `warning`).

import { assertValidUF, BANK_ACCOUNT_BANKS, CREDIT_CARD_VALIDATOR_FLAGS } from './consts.js';
import { fordevRequest } from './http.js';
import { localValidators } from './local/validators.js';
import { parseVerdadeiroFalso, stripTags } from './parse.js';
import { buildResult } from './result.js';
import type { UFCode } from './consts.js';
import type {
  BankAccountValidationOptions,
  CreditCardValidationOptions,
  FourDevsResult,
  RequestTimeoutOption,
  StateRegistrationValidationOptions,
  ValidationResult,
} from './types.js';

function assertText(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} deve ser um texto não vazio.`);
  }
}

function verdict(fromEnd = 1) {
  return (body: string): ValidationResult => ({
    isValid: parseVerdadeiroFalso(body, fromEnd),
    raw: stripTags(body),
  });
}

/** Confere um CPF. */
export async function cpf(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_cpf', { acao: 'validar_cpf', txt_cpf: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cpf(code));
}

/** Confere um CNPJ. Na validação local, aceita também o CNPJ alfanumérico. */
export async function cnpj(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_cnpj', { acao: 'validar_cnpj', txt_cnpj: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cnpj(code));
}

/** Confere um RG. */
export async function rg(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_rg', { acao: 'validar_rg', txt_rg: code }, options);
  return buildResult(raw, verdict(), () => localValidators.rg(code));
}

/** Confere uma CNH. */
export async function cnh(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_cnh', { acao: 'validar_cnh', txt_cnh: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cnh(code));
}

/** Confere um PIS/PASEP. */
export async function pisPasep(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_pis_pasep', { acao: 'validar_pis', txt_pis: code }, options);
  return buildResult(raw, verdict(), () => localValidators.pisPasep(code));
}

/** Confere um RENAVAM. */
export async function renavam(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_de_renavam', { acao: 'validar_renavam', txt_renavam: code }, options);
  return buildResult(raw, verdict(), () => localValidators.renavam(code));
}

/** Confere um título de eleitor. A resposta do 4devs para esta ferramenta traz o veredito no penúltimo segmento, e isso já é tratado aqui. */
export async function voterTitle(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest(
    'validador_titulo_de_eleitor',
    { acao: 'validar_titulo_eleitor', txt_titulo_eleitor: code },
    options,
  );
  return buildResult(raw, verdict(2), () => localValidators.voterTitle(code));
}

/** Confere a matrícula de uma certidão. */
export async function certificate(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  assertText(code, 'O código');
  const raw = await fordevRequest('validador_certidoes', { acao: 'validar_certidao', txt_certidao: code }, options);
  return buildResult(raw, verdict(), () => localValidators.certificate(code));
}

/** Confere uma inscrição estadual do estado informado. */
export async function stateRegistration(
  options: StateRegistrationValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
  assertText(options.code, 'O código');
  const uf = options.uf.toUpperCase();
  assertValidUF(uf);

  const raw = await fordevRequest(
    'validar_inscricao_estadual',
    { acao: 'validar_ie', txt_ie: options.code, estado: uf },
    options,
  );

  return buildResult(raw, verdict(), () => localValidators.stateRegistration({ ...options, uf: uf as UFCode }));
}

/** Confere banco, agência e conta. */
export async function bankAccount(
  options: BankAccountValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
  assertText(options.agency, 'A agência');
  assertText(options.account, 'A conta');
  const bank = BANK_ACCOUNT_BANKS[options.bank];
  if (!bank) {
    throw new RangeError(
      `Banco "${options.bank}" é inválido. Use um de: ${Object.keys(BANK_ACCOUNT_BANKS).join(', ')}.`,
    );
  }

  const raw = await fordevRequest(
    'validador_conta_bancaria',
    { acao: 'validar_conta_bancaria', banco: bank.code, agencia: options.agency, conta: options.account },
    options,
  );

  return buildResult(raw, verdict(), () => localValidators.bankAccount(options));
}

/** Confere um número de cartão para a bandeira informada. */
export async function creditCard(
  options: CreditCardValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
  assertText(options.code, 'O número do cartão');
  const flagValue = CREDIT_CARD_VALIDATOR_FLAGS[options.flag];
  if (!flagValue) {
    throw new RangeError(
      `Bandeira "${options.flag}" é inválida. Use uma de: ${Object.keys(CREDIT_CARD_VALIDATOR_FLAGS).join(', ')}.`,
    );
  }

  const raw = await fordevRequest(
    'validador_numero_cartao_credito',
    { acao: 'validar_cc', txt_cc: options.code, bandeira: flagValue },
    options,
  );

  return buildResult(raw, verdict(), () => localValidators.creditCard(options));
}

export const validators = {
  cpf,
  cnpj,
  rg,
  cnh,
  pisPasep,
  renavam,
  voterTitle,
  certificate,
  stateRegistration,
  bankAccount,
  creditCard,
};

export default validators;
