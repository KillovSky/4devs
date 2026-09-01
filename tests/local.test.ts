import { test } from 'node:test';
import assert from 'node:assert/strict';
import { local } from '../dist/index.js';

test('local.generators.people: gera N pessoas com CPF/RG plausíveis e UF respeitada', () => {
  const people = local.generators.people({ n: 5, uf: 'SP', sex: 'F' });
  assert.equal(people.length, 5);
  for (const person of people) {
    assert.equal(person.estado, 'SP');
    assert.equal(person.sexo, 'Feminino');
    assert.match(person.cpf, /^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    assert.equal(local.validators.cpf(person.cpf).isValid, true);
  }
});

test('local.generators.cpf/cnpj/pisPasep/renavam/cnh: sempre fecham no respectivo validador local', () => {
  assert.equal(local.validators.cpf(local.generators.cpf()).isValid, true);
  assert.equal(local.validators.cnpj(local.generators.cnpj()).isValid, true);
  assert.equal(local.validators.pisPasep(local.generators.pisPasep()).isValid, true);
  assert.equal(local.validators.renavam(local.generators.renavam()).isValid, true);
  assert.equal(local.validators.cnh(local.generators.cnh()).isValid, true);
});

test('local.generators.creditCard: número gerado é Luhn-válido pelo validador local', () => {
  const card = local.generators.creditCard({ flag: 'visa16' });
  const check = local.validators.creditCard({ flag: 'visa', code: card['Número'] });
  assert.equal(check.isValid, true);
});

test('local.generators.vehicle: respeita marca pedida e gera placa/renavam/chassi com formato válido', () => {
  const vehicle = local.generators.vehicle({ brand: 'Honda', uf: 'PR' });
  assert.equal(vehicle.Marca, 'Honda');
  assert.equal(vehicle.Estado, 'PR');
  assert.match(vehicle.Placa, /^[A-Z]{3}\d[A-Z]\d{2}$/);
  assert.equal(vehicle.Chassi.length, 17);
});

test('local.generators.bankAccount: respeita o banco pedido', () => {
  const account = local.generators.bankAccount({ bank: 'santander' });
  assert.match(account.Banco, /Santander/);
});

test('local.generators.city: devolve a amostra embutida para a UF', () => {
  const cities = local.generators.city({ uf: 'RS' });
  assert.ok(cities.includes('Porto Alegre'));
});

test('local.validators.rg/voterTitle/certificate/stateRegistration/bankAccount: fallback de formato, não de dígito verificador', () => {
  assert.equal(local.validators.rg('12.345.678-9').isValid, true);
  assert.equal(local.validators.rg('abc').isValid, false);
  assert.match(local.validators.rg('12.345.678-9').raw, /formato/);

  assert.equal(local.validators.stateRegistration({ uf: 'SP', code: '123456789' }).isValid, true);
  assert.equal(local.validators.bankAccount({ bank: 'brasil', agency: '1234', account: '56789-0' }).isValid, true);
  assert.equal(local.validators.bankAccount({ bank: 'brasil', agency: '', account: '' }).isValid, false);
});
