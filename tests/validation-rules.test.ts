import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generators, validators } from '../dist/index.js';

test('generators.uf/vehicleBrand: síncronos, locais, e respeitam limites (clamp)', () => {
  const ufs = generators.uf({ n: 100 });
  assert.equal(ufs.data?.length, 27); // clampa no total de UFs

  const brands = generators.vehicleBrand({ n: 0 });
  assert.equal(brands.data?.length, 1); // clampa para o mínimo

  const someUfs = generators.uf({ n: 3 });
  assert.equal(new Set(someUfs.data).size, 3); // sem repetição
});

test('generators.*: lançam erro síncrono para entradas inválidas, sem tentar rede', async () => {
  await assert.rejects(() => generators.cpf({ uf: 'XX' }), RangeError);
  await assert.rejects(() => generators.people({ age: 5 }), RangeError);
  await assert.rejects(() => generators.bankAccount({ bank: 'nubank' as never }), RangeError);
  await assert.rejects(() => generators.vehicle({ brand: 'MarcaInexistente' }), RangeError);
  await assert.rejects(() => generators.creditCard({ flag: 'diners_club' as never }), RangeError);
  await assert.rejects(() => generators.certificate({ type: 'invalido' as never }), RangeError);
  await assert.rejects(() => generators.voterTitle({ uf: 'XX' as never }), RangeError);
});

test('validators.*: lançam erro síncrono para entradas inválidas, sem tentar rede', async () => {
  await assert.rejects(
    () => validators.bankAccount({ bank: 'nubank' as never, agency: '1', account: '2' }),
    RangeError,
  );
  await assert.rejects(
    () => validators.creditCard({ flag: 'diners_club' as never, code: '123' }),
    RangeError,
  );
  await assert.rejects(
    () => validators.stateRegistration({ uf: 'XX' as never, code: '123' }),
    RangeError,
  );
});
