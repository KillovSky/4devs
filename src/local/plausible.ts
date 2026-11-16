// Geração e conferência de formato para documentos sem regra de dígito verificador
// única e nacional: RG (cada estado tem a sua), título de eleitor, inscrição
// estadual (um algoritmo por estado) e certidão (matrícula de 32 dígitos). Aqui só se
// confere tamanho e estrutura; isso não confirma que o documento existe.

import type { CertificateType } from '../consts.js';
import { randomDigitString, randomInt } from '../random.js';

// RG no formato de SP: NN.NNN.NNN-D, com D sendo um dígito ou X.
export function generateRgDigits(): string {
  const base = randomDigitString(8);
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  for (let i = 0; i < 8; i += 1) sum += Number(base[i]) * weights[i];
  const rest = sum % 11;
  return base + (rest === 10 ? 'X' : String(rest));
}

export function formatRg(raw: string): string {
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}-${raw.slice(8, 9)}`;
}

export function isPlausibleRg(code: string): boolean {
  const clean = code.replace(/[.\-\s]/g, '').toUpperCase();
  return /^\d{7,9}[\dX]$/.test(clean);
}

// Título de eleitor: 12 dígitos (8 de sequência, 2 do código da UF e 2 verificadores).
const UF_VOTER_CODE: Record<string, string> = {
  SP: '01', MG: '02', RJ: '03', RS: '04', BA: '05', PR: '06', CE: '07',
  PE: '08', SC: '09', GO: '10', MA: '11', PA: '12', ES: '13', PB: '14',
  AM: '15', RN: '16', AL: '17', PI: '18', MT: '19', DF: '20', SE: '21',
  MS: '22', RO: '23', TO: '24', AC: '25', AP: '26', RR: '27',
};

export function generateVoterTitleDigits(uf: string): string {
  return randomDigitString(8) + (UF_VOTER_CODE[uf] ?? '01') + randomDigitString(2);
}

export function isPlausibleVoterTitle(code: string): boolean {
  return /^\d{12}$/.test(code.replace(/\D/g, ''));
}

// Inscrição estadual: de 8 a 14 dígitos, dependendo do estado.
export function generateStateRegistrationDigits(length = 12): string {
  return randomDigitString(length);
}

export function isPlausibleStateRegistration(code: string): boolean {
  const digits = code.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

// Certidão: matrícula do CNJ, com 32 dígitos nesta ordem:
//   cartório (6) | acervo (2) | serviço (2) | ano (4) | tipo do livro (1) |
//   livro (5) | folha (3) | termo (7) | dígitos verificadores (2)
const BOOK_TYPES: Record<Exclude<CertificateType, 'any'>, string> = {
  birth: '1',
  wedding: '2',
  religiousWedding: '3',
  death: '4',
};

/** Matrícula de certidão com 32 dígitos. O dígito do tipo do livro segue o `type` pedido. Os dois últimos são sorteados, não calculados. */
export function generateCertificateDigits(type: CertificateType = 'any'): string {
  const bookType = type === 'any' ? String(randomInt(1, 4)) : BOOK_TYPES[type];
  const year = randomInt(2000, new Date().getFullYear());

  return (
    randomDigitString(6) // cartório
    + '01' // acervo próprio
    + '55' // serviço de registro civil
    + String(year)
    + bookType
    + randomDigitString(5) // livro
    + randomDigitString(3) // folha
    + randomDigitString(7) // termo
    + randomDigitString(2) // verificadores
  );
}

export function formatCertificate(raw: string): string {
  const part = (from: number, to: number) => raw.slice(from, to);
  return `${part(0, 6)}.${part(6, 8)}.${part(8, 10)}.${part(10, 14)}.${part(14, 15)}.${part(15, 20)}.${part(20, 23)}.${part(23, 30)}-${part(30, 32)}`;
}

export function isPlausibleCertificate(code: string): boolean {
  return code.replace(/\D/g, '').length === 32;
}

// Placa: padrão antigo (ABC-1234) e Mercosul (ABC1D23).
export function generatePlate(mercosul = true): string {
  const letter = () => String.fromCharCode(65 + randomInt(0, 25));
  const letters = Array.from({ length: 3 }, letter).join('');
  return mercosul
    ? `${letters}${randomInt(0, 9)}${letter()}${randomDigitString(2)}`
    : `${letters}${randomDigitString(4)}`;
}

// Conta e agência não têm algoritmo comum entre os bancos; só se confere se são
// numéricas e de um tamanho possível.
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

// Chassi: 17 caracteres sem I, O e Q. O dígito verificador do VIN (ISO 3779) não é
// calculado, porque não é o que o 4devs usa neste campo.
const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';

export function generateChassis(): string {
  return Array.from({ length: 17 }, () => VIN_CHARS[randomInt(0, VIN_CHARS.length - 1)]).join('');
}
