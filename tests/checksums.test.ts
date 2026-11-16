import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCpfDigits, isValidCpf, formatCpf,
  generateCnpjDigits, generateAlphanumericCnpj, isValidCnpj, formatCnpj,
  generatePisDigits, isValidPisPasep, formatPisPasep,
  generateRenavamDigits, isValidRenavam,
  generateCnhDigits, isValidCnh,
  generateCardDigits, isValidLuhn,
} from '../dist/index.js';

const TRIALS = 500;

test('CPF: todo código gerado localmente valida como verdadeiro (round-trip)', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    assert.equal(isValidCpf(generateCpfDigits().join('')), true);
  }
});

test('CPF: formatação e detecção de dígitos repetidos', () => {
  const digits = generateCpfDigits();
  assert.match(formatCpf(digits), /^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('123'), false);
});

test('CPF: um dígito alterado invalida o código', () => {
  const digits = generateCpfDigits();
  const tampered = [...digits];
  tampered[3] = (tampered[3] + 1) % 10;
  // só é garantido inválido se o dígito alterado não for um dos verificadores recalculados; testamos vários índices
  let foundInvalid = false;
  for (let i = 0; i < 9; i += 1) {
    const t2 = [...digits];
    t2[i] = (t2[i] + 1) % 10;
    if (!isValidCpf(t2.join(''))) foundInvalid = true;
  }
  assert.equal(foundInvalid, true);
});

test('CNPJ: round-trip e formatação', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    const digits = generateCnpjDigits();
    assert.equal(isValidCnpj(digits.join('')), true);
    assert.match(formatCnpj(digits), /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  }
  assert.equal(isValidCnpj('11.111.111/1111-11'), false);
});

test('PIS/PASEP: round-trip e formatação', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    const digits = generatePisDigits();
    assert.equal(isValidPisPasep(digits.join('')), true);
    assert.match(formatPisPasep(digits), /^\d{3}\.\d{5}\.\d{2}-\d{1}$/);
  }
});

test('RENAVAM: round-trip (11 dígitos) e aceita 9 dígitos com padding', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    const digits = generateRenavamDigits();
    assert.equal(digits.length, 11);
    assert.equal(isValidRenavam(digits.join('')), true);
  }
});

test('CNH: round-trip e sempre 11 dígitos', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    const digits = generateCnhDigits();
    assert.equal(digits.length, 11);
    assert.ok(digits.every((d) => d >= 0 && d <= 9), 'todo dígito deve ser 0-9 (regressão do bug de ajuste dsc)');
    assert.equal(isValidCnh(digits.join('')), true);
  }
});

test('Cartão de crédito (Luhn): round-trip para tamanhos comuns', () => {
  for (const length of [13, 15, 16, 19]) {
    for (let i = 0; i < 100; i += 1) {
      const digits = generateCardDigits(length);
      assert.equal(digits.length, length);
      assert.equal(isValidLuhn(digits.join('')), true);
    }
  }
  assert.equal(isValidLuhn('4111111111111112'), false); // último dígito do número de teste clássico alterado
  assert.equal(isValidLuhn('4111111111111111'), true); // número de teste clássico (Luhn-válido)
});

test('CNPJ alfanumérico: o exemplo da Receita Federal valida', () => {
  assert.equal(isValidCnpj('12.ABC.345/01DE-35'), true);
  assert.equal(isValidCnpj('12abc34501de35'), true);
  assert.equal(isValidCnpj('12.ABC.345/01DE-36'), false);
  assert.equal(isValidCnpj('12.ABC.345/01DE-3A'), false);
});

test('CNPJ alfanumérico: round-trip e formatação', () => {
  for (let i = 0; i < TRIALS; i += 1) {
    const cnpj = generateAlphanumericCnpj();
    assert.match(cnpj, /^[0-9A-Z]{12}\d{2}$/);
    assert.equal(isValidCnpj(cnpj), true, cnpj);
    assert.equal(isValidCnpj(formatCnpj(cnpj)), true);
  }
  assert.match(formatCnpj('12ABC34501DE35'), /^12\.ABC\.345\/01DE-35$/);
});

test('CNPJ: caracteres que não são pontuação invalidam', () => {
  assert.equal(isValidCnpj('CNPJ 11.222.333/0001-81'), false);
  assert.equal(isValidCnpj(''), false);
  assert.equal(isValidCnpj('11111111111111'), false);
});
