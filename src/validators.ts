/**
 * fordev-native/validators
 * ------------------------
 * Validadores de documentos/dados brasileiros via 4devs.com.br.
 *
 * Todas as funções devolvem um `FourDevsResult<ValidationResult>` — verifique
 * `data.isValid` para o resultado booleano da validação. Se a requisição ao
 * 4devs falhar, a validação é feita localmente como alternativa (veja
 * `local/validators.ts` e o campo `source`/`warning` do resultado).
 */

import { assertValidUF, BANK_ACCOUNT_BANKS, CREDIT_CARD_VALIDATOR_FLAGS } from './consts.js';
import { fordevRequest } from './http.js';
import { localValidators } from './local/validators.js';
import { parseVerdadeiroFalso, stripTags } from './parse.js';
import { buildResult } from './result.js';
import type {
  BankAccountValidationOptions,
  CreditCardValidationOptions,
  FourDevsResult,
  RequestTimeoutOption,
  StateRegistrationValidationOptions,
  ValidationResult,
} from './types.js';

function verdict(fromEnd = 1) {
  return (body: string): ValidationResult => ({
    isValid: parseVerdadeiroFalso(body, fromEnd),
    raw: stripTags(body),
  });
}

/** Verifica se um código de CPF é válido. */
export async function cpf(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_cpf', { acao: 'validar_cpf', txt_cpf: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cpf(code));
}

/** Verifica se um código de CNPJ é válido. */
export async function cnpj(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_cnpj', { acao: 'validar_cnpj', txt_cnpj: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cnpj(code));
}

/** Verifica se um código de RG é válido. */
export async function rg(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_rg', { acao: 'validar_rg', txt_rg: code }, options);
  return buildResult(raw, verdict(), () => localValidators.rg(code));
}

/** Verifica se um número de CNH é válido. */
export async function cnh(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_cnh', { acao: 'validar_cnh', txt_cnh: code }, options);
  return buildResult(raw, verdict(), () => localValidators.cnh(code));
}

/** Verifica se um código de PIS/PASEP é válido. */
export async function pisPasep(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_pis_pasep', { acao: 'validar_pis', txt_pis: code }, options);
  return buildResult(raw, verdict(), () => localValidators.pisPasep(code));
}

/** Verifica se um código de RENAVAM é válido. */
export async function renavam(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_de_renavam', { acao: 'validar_renavam', txt_renavam: code }, options);
  return buildResult(raw, verdict(), () => localValidators.renavam(code));
}

/**
 * Verifica se um número de título de eleitor é válido.
 *
 * Nota: por peculiaridade do próprio 4devs, a resposta desta ferramenta
 * específica traz o veredito no penúltimo (não no último) segmento do texto
 * — já tratado internamente.
 */
export async function voterTitle(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest(
    'validador_titulo_de_eleitor',
    { acao: 'validar_titulo_eleitor', txt_titulo_eleitor: code },
    options,
  );
  return buildResult(raw, verdict(2), () => localValidators.voterTitle(code));
}

/** Verifica se um código de certidão (nascimento, casamento, casamento religioso ou óbito) é válido. */
export async function certificate(code: string, options: RequestTimeoutOption = {}): Promise<FourDevsResult<ValidationResult>> {
  const raw = await fordevRequest('validador_certidoes', { acao: 'validar_certidao', txt_certidao: code }, options);
  return buildResult(raw, verdict(), () => localValidators.certificate(code));
}

/** Verifica se uma inscrição estadual é válida para o estado informado. */
export async function stateRegistration(
  options: StateRegistrationValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
  const uf = options.uf.toUpperCase();
  assertValidUF(uf);

  const raw = await fordevRequest(
    'validar_inscricao_estadual',
    { acao: 'validar_ie', txt_ie: options.code, estado: uf },
    options,
  );

  return buildResult(raw, verdict(), () => localValidators.stateRegistration({ ...options, uf: uf as never }));
}

/** Verifica se os dados (banco + agência + conta) de uma conta bancária são válidos. */
export async function bankAccount(
  options: BankAccountValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
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

/** Verifica se um número de cartão de crédito é válido para a bandeira informada. */
export async function creditCard(
  options: CreditCardValidationOptions,
): Promise<FourDevsResult<ValidationResult>> {
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
