/**
 * fordev-native/local/secureRandom
 * ---------------------------------
 * Fonte de aleatoriedade compartilhada por todos os geradores locais.
 *
 * Usa `crypto.randomInt` — módulo nativo do Node (`node:crypto`, disponível
 * desde o Node 14.10, bem abaixo do mínimo `>=18` deste pacote), portanto
 * sem adicionar nenhuma dependência de runtime — em vez de `Math.random()`.
 *
 * Os dados aqui são inteiramente fictícios (CPF/CNPJ/cartão de teste,
 * nomes, senhas de exemplo etc.) e nada disso protege algo sensível de
 * verdade; ainda assim, evitar `Math.random()` é a prática recomendada em
 * uma biblioteca pública — é o que ferramentas de análise estática como o
 * CodeQL cobram (categoria "insecure randomness"), e o custo de usar a
 * alternativa seguro é zero.
 */

import { randomInt as cryptoRandomInt } from 'node:crypto';

/** Inteiro aleatório em `[min, max]`, ambos inclusivos. */
export function randomInt(min: number, max: number): number {
  if (max < min) return min;
  return cryptoRandomInt(min, max + 1);
}

/** Um único dígito decimal aleatório (0–9). */
export function randomDigit(): number {
  return cryptoRandomInt(0, 10);
}

/** Array com `length` dígitos decimais aleatórios (como números). */
export function randomDigits(length: number): number[] {
  return Array.from({ length }, () => randomDigit());
}

/** String com `length` dígitos decimais aleatórios. */
export function randomDigitString(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += randomDigit();
  return out;
}

/** Elemento aleatório de um array não vazio. */
export function randomItem<T>(items: readonly T[]): T {
  return items[cryptoRandomInt(0, items.length)];
}
