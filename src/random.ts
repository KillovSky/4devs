import { randomInt } from 'node:crypto';

/** Sorteia `n` elementos distintos de `items`, sem repetição (Fisher–Yates parcial). */
export function sampleWithoutReplacement<T>(items: readonly T[], n: number): T[] {
  const pool = items.slice();
  const result: T[] = [];
  const count = Math.min(n, pool.length);

  for (let i = 0; i < count; i += 1) {
    const idx = randomInt(0, pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return result;
}

/** Escolhe um elemento aleatório de `items`. */
export function randomChoice<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length)];
}
