/**
 * fordev-native/local/checksums
 * ------------------------------
 * Algoritmos de dígito verificador implementados localmente, para os
 * documentos que têm uma regra de cálculo pública e nacionalmente padronizada
 * (CPF, CNPJ, PIS/PASEP, RENAVAM, CNH e o algoritmo de Luhn para cartão de
 * crédito). Usados tanto para gerar quanto para validar esses documentos
 * sem depender do 4devs.com.br — como alternativa local caso o site esteja
 * fora do ar, e como base dos comandos "offline" do módulo.
 *
 * Documentos sem uma regra única e nacional (RG, título de eleitor,
 * inscrição estadual, certidão, conta bancária — cada um varia por estado
 * ou por instituição) não entram aqui; eles são tratados em `plausible.ts`
 * com verificações de formato, não de dígito verificador.
 */

function toDigits(value: string): number[] {
  return value.replace(/\D/g, '').split('').map(Number);
}

function allSameDigit(digits: number[]): boolean {
  return digits.every((d) => d === digits[0]);
}

function randomDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

// ---------------------------------------------------------------------------
// CPF
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CNPJ
// ---------------------------------------------------------------------------

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

export function isValidCnpj(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length !== 14 || allSameDigit(digits)) return false;
  return cnpjDigit(digits.slice(0, 12)) === digits[12] && cnpjDigit(digits.slice(0, 13)) === digits[13];
}

export function formatCnpj(digits: number[]): string {
  const s = digits.join('');
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`;
}

// ---------------------------------------------------------------------------
// PIS/PASEP
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// RENAVAM
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CNH
// ---------------------------------------------------------------------------

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
  if (dv2 >= 10) dv2 = 0; // garante um único dígito mesmo no caso-limite do ajuste acima

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

// ---------------------------------------------------------------------------
// Cartão de crédito (algoritmo de Luhn — padrão internacional, não é
// específico do Brasil, mas é o que garante que um número de cartão "fecha")
// ---------------------------------------------------------------------------

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

export function generateCardDigits(length = 16): number[] {
  const base = randomDigits(length - 1);
  return [...base, luhnDigit(base)];
}

export function isValidLuhn(code: string): boolean {
  const digits = toDigits(code);
  if (digits.length < 12) return false;
  return luhnDigit(digits.slice(0, -1)) === digits[digits.length - 1];
}
