import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UF_CODES, isValidUF, assertValidUF, VEHICLE_BRANDS, findVehicleBrand,
  BANK_ACCOUNT_BANKS, CREDIT_CARD_GENERATOR_FLAGS, CREDIT_CARD_VALIDATOR_FLAGS,
  CERTIFICATE_TYPES,
} from '../dist/index.js';

test('UF_CODES tem os 27 códigos, sem duplicatas', () => {
  assert.equal(UF_CODES.length, 27);
  assert.equal(new Set(UF_CODES).size, 27);
});

test('isValidUF aceita códigos válidos (normalizando maiúsculas) e rejeita inválidos', () => {
  assert.equal(isValidUF('SP'), true);
  assert.equal(isValidUF('sp'), true); // normaliza para maiúsculas internamente
  assert.equal(isValidUF('XX'), false);
});

test('assertValidUF lança para UF inválida e aceita vazio quando permitido', () => {
  assert.throws(() => assertValidUF('XX'), RangeError);
  assert.doesNotThrow(() => assertValidUF('SP'));
  assert.throws(() => assertValidUF(''));
  assert.doesNotThrow(() => assertValidUF('', { allowEmpty: true }));
});

test('VEHICLE_BRANDS tem 87 marcas, todas com fipeCode numérico único', () => {
  assert.equal(VEHICLE_BRANDS.length, 87);
  const codes = new Set(VEHICLE_BRANDS.map((b) => b.fipeCode));
  assert.equal(codes.size, 87);
});

test('findVehicleBrand é case-insensitive e retorna undefined se não achar', () => {
  assert.equal(findVehicleBrand('fiat')?.name, 'Fiat');
  assert.equal(findVehicleBrand('FIAT')?.name, 'Fiat');
  assert.equal(findVehicleBrand('MarcaQueNaoExiste'), undefined);
});

test('BANK_ACCOUNT_BANKS tem os 5 bancos na ordem do formulário do 4devs', () => {
  assert.deepEqual(Object.keys(BANK_ACCOUNT_BANKS), ['brasil', 'bradesco', 'citibank', 'itau', 'santander']);
  assert.equal(BANK_ACCOUNT_BANKS.brasil.code, 2);
  assert.equal(BANK_ACCOUNT_BANKS.santander.code, 151);
});

test('bandeiras de cartão: 10 no gerador, 12 no validador (listas distintas do site)', () => {
  assert.equal(Object.keys(CREDIT_CARD_GENERATOR_FLAGS).length, 10);
  assert.equal(Object.keys(CREDIT_CARD_VALIDATOR_FLAGS).length, 12);
});

test('CERTIFICATE_TYPES cobre os 5 tipos aceitos pelo 4devs', () => {
  assert.deepEqual(Object.keys(CERTIFICATE_TYPES).sort(), ['any', 'birth', 'death', 'religiousWedding', 'wedding'].sort());
});
