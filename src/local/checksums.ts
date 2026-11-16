// Algoritmos de dígito verificador dos documentos que têm uma regra nacional
// pública: CPF, CNPJ, PIS/PASEP, RENAVAM, CNH e Luhn (cartão). Servem para gerar e
// para validar sem depender do 4devs.com.br.
//
// RG, título de eleitor, inscrição estadual, certidão e conta bancária variam por
// estado ou instituição e ficam em `plausible.ts`, que só confere o formato.

import { randomDigits, randomInt } from '../random.js';

function toDigits(value: string): number[] {
  return value.replace(/\D/g, '').split('').map(Number);
}

function allSameDigit(digits: number[]): boolean {
  return digits.every((d) => d === digits[0]);
}

// CPF

function cpfDigit(base: number[]): number {
  const start = base.length + 1;
  let sum = 0;
  for (let i = 0; i < base.length; i += 1) sum += base[i] * (start - i);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function generateCpfDigits(): number[] {
  const base = randomDigits(9);
  const d1 = cpfDigit(base);
  const d2 = cpfDigit([...base, d1]);
  return [...base, d1, d2];
}

export function isValidCpf(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length !== 11 || allSameDigit(digits)) return false;
  return cpfDigit(digits.slice(0, 9)) === digits[9] && cpfDigit(digits.slice(0, 10)) === digits[10];
}

export function formatCpf(digits: number[]): string {
  const s = digits.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`;
}

// CNPJ

// A partir de julho de 2026 o CNPJ pode ter letras nas 12 primeiras posições. O
// cálculo é o mesmo de sempre, com o valor de cada caractere sendo o código ASCII
// menos 48 ('0' a '9' valem 0 a 9, 'A' a 'Z' valem 17 a 42). Os dois dígitos
// verificadores continuam numéricos.
const CNPJ_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function cnpjValues(text: string): number[] {
  return Array.from(text, (ch) => ch.charCodeAt(0) - 48);
}

function cnpjDigit(base: number[]): number {
  const weights = base.length === 12
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < base.length; i += 1) sum += base[i] * weights[i];
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function generateCnpjDigits(): number[] {
  const base = [...randomDigits(8), 0, 0, 0, 1]; // filial 0001 (matriz)
  const d1 = cnpjDigit(base);
  const d2 = cnpjDigit([...base, d1]);
  return [...base, d1, d2];
}

/** Gera um CNPJ alfanumérico (14 caracteres, sem pontuação) com os dois dígitos verificadores corretos. */
export function generateAlphanumericCnpj(): string {
  const root = Array.from({ length: 8 }, () => CNPJ_ALPHABET[randomInt(0, CNPJ_ALPHABET.length - 1)]).join('');
  const base = `${root}0001`;
  const values = cnpjValues(base);
  const d1 = cnpjDigit(values);
  const d2 = cnpjDigit([...values, d1]);
  return `${base}${d1}${d2}`;
}

/** Confere um CNPJ numérico ou alfanumérico. Pontos, barra, traço e espaços são ignorados. */
export function isValidCnpj(code: string): boolean {
  const clean = code.replace(/[.\-/\s]/g, '').toUpperCase();
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(clean)) return false;

  const values = cnpjValues(clean);
  if (allSameDigit(values)) return false;
  return cnpjDigit(values.slice(0, 12)) === values[12] && cnpjDigit(values.slice(0, 13)) === values[13];
}

/** Aplica a máscara `00.000.000/0000-00` a 14 caracteres, vindos de um array de dígitos ou de um texto. */
export function formatCnpj(chars: number[] | string): string {
  const s = typeof chars === 'string' ? chars : chars.join('');
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`;
}

// PIS/PASEP

const PIS_WEIGHTS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function pisDigit(base: number[]): number {
  let sum = 0;
  for (let i = 0; i < 10; i += 1) sum += base[i] * PIS_WEIGHTS[i];
  const dv = 11 - (sum % 11);
  return dv >= 10 ? 0 : dv;
}

export function generatePisDigits(): number[] {
  const base = randomDigits(10);
  return [...base, pisDigit(base)];
}

export function isValidPisPasep(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length !== 11) return false;
  return pisDigit(digits.slice(0, 10)) === digits[10];
}

export function formatPisPasep(digits: number[]): string {
  const s = digits.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 8)}.${s.slice(8, 10)}-${s.slice(10, 11)}`;
}

// RENAVAM

function renavamDigit(base10: number[]): number {
  const reversed = [...base10].reverse();
  let sum = 0;
  for (let i = 0; i < reversed.length; i += 1) sum += reversed[i] * ((i % 8) + 2);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function generateRenavamDigits(): number[] {
  const base = randomDigits(10);
  return [...base, renavamDigit(base)];
}

export function isValidRenavam(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length < 9 || digits.length > 11) return false;
  const padded = digits.map(String).join('').padStart(11, '0').split('').map(Number);
  return renavamDigit(padded.slice(0, 10)) === padded[10];
}

// CNH

function cnhDigits(base: number[]): [number, number] {
  let dsc = 0;
  let v = 0;
  let j = 9;
  for (let i = 0; i < 9; i += 1, j -= 1) v += base[i] * j;
  let dv1 = v % 11;
  if (dv1 >= 10) {
    dv1 = 0;
    dsc = 2;
  }

  v = 0;
  j = 1;
  for (let i = 0; i < 9; i += 1, j += 1) v += base[i] * j;
  let dv2 = v % 11;
  dv2 = dv2 >= 10 ? 0 : dv2 - dsc;
  if (dv2 < 0) dv2 += 11;
  if (dv2 >= 10) dv2 = 0;

  return [dv1, dv2];
}

export function generateCnhDigits(): number[] {
  const base = randomDigits(9);
  return [...base, ...cnhDigits(base)];
}

export function isValidCnh(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length !== 11 || allSameDigit(digits)) return false;
  const [dv1, dv2] = cnhDigits(digits.slice(0, 9));
  return dv1 === digits[9] && dv2 === digits[10];
}

// Cartão de crédito (Luhn, padrão internacional)

function luhnDigit(base: number[]): number {
  const reversed = [...base].reverse();
  let sum = 0;
  reversed.forEach((d, i) => {
    let v = d;
    if (i % 2 === 0) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
  });
  return (10 - (sum % 10)) % 10;
}

/** Número de cartão de `length` dígitos que fecha no Luhn, começando por `prefix` (só dígitos), se houver. */
export function generateCardDigits(length = 16, prefix = ''): number[] {
  const start = Array.from(prefix.slice(0, length - 1), Number);
  const base = [...start, ...randomDigits(length - 1 - start.length)];
  return [...base, luhnDigit(base)];
}

export function isValidLuhn(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length < 12) return false;
  return luhnDigit(digits.slice(0, -1)) === digits[digits.length - 1];
}
