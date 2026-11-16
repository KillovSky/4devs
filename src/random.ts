import { randomInt as cryptoRandomInt } from 'node:crypto';

// Todos os dados gerados aqui são fictícios, mas usamos node:crypto em vez de
// Math.random() mesmo assim: custa o mesmo e evita alertas de análise estática.

/** Inteiro aleatório em `[min, max]`, os dois inclusivos. */
export function randomInt(min: number, max: number): number {
  if (max < min) return min;
  return cryptoRandomInt(min, max + 1);
}

/** Um dígito decimal aleatório (0 a 9). */
export function randomDigit(): number {
  return cryptoRandomInt(0, 10);
}

/** `length` dígitos decimais aleatórios, como números. */
export function randomDigits(length: number): number[] {
  return Array.from({ length }, () => randomDigit());
}

/** `length` dígitos decimais aleatórios, como texto. */
export function randomDigitString(length: number): string {
  return randomDigits(length).join('');
}

/** Um elemento aleatório de um array que não esteja vazio. */
export function randomItem<T>(items: readonly T[]): T {
  return items[cryptoRandomInt(0, items.length)];
}

/** Sorteia até `n` elementos distintos de `items`. */
export function sampleWithoutReplacement<T>(items: readonly T[], n: number): T[] {
  const pool = items.slice();
  const picked: T[] = [];
  const count = Math.min(n, pool.length);

  for (let i = 0; i < count; i += 1) {
    const index = cryptoRandomInt(0, pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
}
