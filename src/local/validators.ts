/**
 * fordev-native/local/validators
 * ---------------------------------
 * Validação inteiramente local (sem nenhuma requisição de rede).
 *
 * Para CPF, CNPJ, PIS/PASEP, RENAVAM, CNH e cartão de crédito, o dígito
 * verificador é conferido de verdade, com o mesmo algoritmo oficial usado
 * para gerar esses documentos em `local/generators.ts` — o resultado é
 * confiável mesmo sem o 4devs.
 *
 * Para RG, título de eleitor, inscrição estadual, certidão e conta
 * bancária, não existe uma regra nacional única (varia por estado/banco),
 * então a checagem local se limita ao formato — isso fica explícito no
 * campo `raw` do resultado, para não passar confiança indevida.
 */

import { BANK_ACCOUNT_BANKS } from '../consts.js';
import type { BankAccountValidationOptions, CreditCardValidationOptions, StateRegistrationValidationOptions, ValidationResult } from '../types.js';
import {
  isValidCnh, isValidCnpj, isValidCpf, isValidLuhn, isValidPisPasep, isValidRenavam,
} from './checksums.js';
import {
  isPlausibleBankAccountField, isPlausibleCertificate, isPlausibleRg,
  isPlausibleStateRegistration, isPlausibleVoterTitle,
} from './plausible.js';

function algorithmic(label: string, isValid: boolean): ValidationResult {
  return {
    isValid,
    raw: `Validado localmente (algoritmo oficial de ${label}, sem consultar o 4devs): ${isValid ? 'válido' : 'inválido'}.`,
  };
}

function formatOnly(label: string, isValid: boolean): ValidationResult {
  return {
    isValid,
    raw: `Verificação local de formato apenas (${label}) — não confirma emissão real, o 4devs estava indisponível: ${isValid ? 'formato válido' : 'formato inválido'}.`,
  };
}

export function cpf(code: string): ValidationResult {
  return algorithmic('CPF', isValidCpf(code));
}

export function cnpj(code: string): ValidationResult {
  return algorithmic('CNPJ', isValidCnpj(code));
}

export function rg(code: string): ValidationResult {
  return formatOnly('RG', isPlausibleRg(code));
}

export function cnh(code: string): ValidationResult {
  return algorithmic('CNH', isValidCnh(code));
}

export function pisPasep(code: string): ValidationResult {
  return algorithmic('PIS/PASEP', isValidPisPasep(code));
}

export function renavam(code: string): ValidationResult {
  return algorithmic('RENAVAM', isValidRenavam(code));
}

export function voterTitle(code: string): ValidationResult {
  return formatOnly('título de eleitor', isPlausibleVoterTitle(code));
}

export function certificate(code: string): ValidationResult {
  return formatOnly('certidão', isPlausibleCertificate(code));
}

export function stateRegistration(options: StateRegistrationValidationOptions): ValidationResult {
  return formatOnly('inscrição estadual', isPlausibleStateRegistration(options.code));
}

export function bankAccount(options: BankAccountValidationOptions): ValidationResult {
  const knownBank = Boolean(BANK_ACCOUNT_BANKS[options.bank]);
  const ok = knownBank
    && isPlausibleBankAccountField(options.agency, 1, 6)
    && isPlausibleBankAccountField(options.account, 3, 12);
  return formatOnly('conta bancária', ok);
}

export function creditCard(options: CreditCardValidationOptions): ValidationResult {
  return algorithmic('cartão de crédito (Luhn)', isValidLuhn(options.code));
}

export const localValidators = {
  cpf, cnpj, rg, cnh, pisPasep, renavam, voterTitle, certificate,
  stateRegistration, bankAccount, creditCard,
};

export default localValidators;
