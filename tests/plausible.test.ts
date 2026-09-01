import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRgDigits, formatRg, isPlausibleRg,
  generateVoterTitleDigits, isPlausibleVoterTitle,
  generateStateRegistrationDigits, isPlausibleStateRegistration,
  generateCertificateDigits, formatCertificate, isPlausibleCertificate,
  generatePlate, generateAgency, generateAccountNumber, isPlausibleBankAccountField,
  generateChassis,
} from '../dist/index.js';

test('RG: formato gerado é sempre plausível e a formatação bate com o padrão SP', () => {
  for (let i = 0; i < 200; i += 1) {
    const raw = generateRgDigits();
    assert.equal(isPlausibleRg(raw), true);
    assert.match(formatRg(raw), /^\d{2}\.\d{3}\.\d{3}-[\dX]$/);
  }
  assert.equal(isPlausibleRg('abc'), false);
});

test('Título de eleitor: 12 dígitos, código de UF embutido nas posições 9-10', () => {
  const raw = generateVoterTitleDigits('SP');
  assert.equal(raw.length, 12);
  assert.equal(raw.slice(8, 10), '01');
  assert.equal(isPlausibleVoterTitle(raw), true);
  assert.equal(isPlausibleVoterTitle('123'), false);
});

test('Inscrição estadual: comprimento plausível (8 a 14 dígitos)', () => {
  const raw = generateStateRegistrationDigits();
  assert.equal(isPlausibleStateRegistration(raw), true);
  assert.equal(isPlausibleStateRegistration('123'), false);
  assert.equal(isPlausibleStateRegistration('1'.repeat(20)), false);
});

test('Certidão: matrícula de 32 dígitos, formatação com pontuação', () => {
  const raw = generateCertificateDigits();
  assert.equal(raw.length, 32);
  assert.equal(isPlausibleCertificate(raw), true);
  assert.match(formatCertificate(raw), /^\d{6}\.\d{2}\.\d{2}\.\d{2}\.\d{1}\.\d{5}\.\d{3}\.\d{7}-\d{2}$/);
});

test('Placa: padrão Mercosul (LLLNLNN) e padrão antigo (LLL-NNNN)', () => {
  const mercosul = generatePlate(true);
  assert.match(mercosul, /^[A-Z]{3}\d[A-Z]\d{2}$/);
  const antiga = generatePlate(false);
  assert.match(antiga, /^[A-Z]{3}\d{4}$/);
});

test('Agência/conta: formato numérico plausível', () => {
  assert.match(generateAgency(), /^\d{4}$/);
  assert.match(generateAccountNumber(), /^\d{5,7}-\d$/);
  assert.equal(isPlausibleBankAccountField('1234', 1, 6), true);
  assert.equal(isPlausibleBankAccountField('', 1, 6), false);
});

test('Chassi: 17 caracteres alfanuméricos, sem I/O/Q (padrão VIN)', () => {
  const chassis = generateChassis();
  assert.equal(chassis.length, 17);
  assert.doesNotMatch(chassis, /[IOQ]/);
});
