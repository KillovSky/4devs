/**
 * fordev-native/local/plausible
 * ------------------------------
 * Verificações e geração *de formato* para documentos que não têm uma regra
 * de dígito verificador única e nacional — RG (cada estado tem seu próprio
 * órgão emissor e critério), título de eleitor (regras com exceções por UF),
 * inscrição estadual (27 algoritmos diferentes, um por estado) e certidão
 * (matrícula CNJ de 32 dígitos). Nesses casos o fallback local confere só o
 * formato (tamanho, caracteres, estrutura), não confirma a emissão real —
 * isso fica marcado explicitamente no `raw` do resultado.
 */

import { randomDigitString, randomInt } from './secureRandom.js';

// RG (formato SP: NN.NNN.NNN-D, D pode ser dígito ou X)
export function generateRgDigits(): string {
  const base = randomDigitString(8);
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  for (let i = 0; i < 8; i += 1) sum += Number(base[i]) * weights[i];
  const rest = sum % 11;
  const dv = rest === 10 ? 'X' : String(rest);
  return base + dv;
}

export function formatRg(raw: string): string {
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}-${raw.slice(8, 9)}`;
}

export function isPlausibleRg(code: string): boolean {
  const clean = code.replace(/[.\-\s]/g, '').toUpperCase();
  return /^\d{7,9}[\dX]$/.test(clean);
}

// Título de eleitor: 12 dígitos (8 sequenciais + 2 do código da UF + 2 verificadores)
const UF_VOTER_CODE: Record<string, string> = {
  SP: '01', MG: '02', RJ: '03', RS: '04', BA: '05', PR: '06', CE: '07',
  PE: '08', SC: '09', GO: '10', MA: '11', PA: '12', ES: '13', PB: '14',
  AM: '15', RN: '16', AL: '17', PI: '18', MT: '19', DF: '20', SE: '21',
  MS: '22', RO: '23', TO: '24', AC: '25', AP: '26', RR: '27',
};

export function generateVoterTitleDigits(uf: string): string {
  const sequence = randomDigitString(8);
  const ufCode = UF_VOTER_CODE[uf] ?? '01';
  const checkDigits = randomDigitString(2);
  return sequence + ufCode + checkDigits;
}

export function isPlausibleVoterTitle(code: string): boolean {
  return /^\d{12}$/.test(code.replace(/\D/g, ''));
}

// Inscrição estadual: tamanho varia por estado (8 a 14 dígitos, dependendo da UF)
export function generateStateRegistrationDigits(length = 12): string {
  return randomDigitString(length);
}

export function isPlausibleStateRegistration(code: string): boolean {
  const digits = code.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

// Certidão (matrícula CNJ, 32 dígitos numéricos)
export function generateCertificateDigits(): string {
  return randomDigitString(32);
}

export function formatCertificate(raw: string): string {
  return `${raw.slice(0, 6)}.${raw.slice(6, 8)}.${raw.slice(8, 10)}.${raw.slice(10, 12)}.${raw.slice(12, 13)}.${raw.slice(13, 18)}.${raw.slice(18, 21)}.${raw.slice(21, 28)}-${raw.slice(28, 30)}`;
}

export function isPlausibleCertificate(code: string): boolean {
  return code.replace(/\D/g, '').length === 32;
}

// Placa de veículo (padrão antigo ABC-1234 e padrão Mercosul ABC1D23)
export function generatePlate(mercosul = true): string {
  const letters = () => Array.from({ length: 3 }, () => String.fromCharCode(65 + randomInt(0, 25))).join('');
  if (mercosul) {
    const letter = String.fromCharCode(65 + randomInt(0, 25));
    return `${letters()}${randomInt(0, 9)}${letter}${randomDigitString(2)}`;
  }
  return `${letters()}${randomDigitString(4)}`;
}

// Conta bancária / agência: sem um algoritmo público único entre bancos;
// apenas confere se são numéricos com um tamanho plausível.
export function isPlausibleBankAccountField(value: string, minLength = 1, maxLength = 12): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= minLength && digits.length <= maxLength;
}

export function generateAgency(): string {
  return randomDigitString(4);
}

export function generateAccountNumber(): string {
  return `${randomDigitString(randomInt(5, 7))}-${randomInt(0, 9)}`;
}

// Chassi (VIN) — formato de 17 caracteres alfanuméricos (sem I, O, Q), sem
// verificação de dígito real (o cálculo oficial de VIN é específico dos EUA/ISO 3779
// e não é o que o 4devs usa para o campo "Chassi" desta ferramenta).
const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
export function generateChassis(): string {
  return Array.from({ length: 17 }, () => VIN_CHARS[randomInt(0, VIN_CHARS.length - 1)]).join('');
}
