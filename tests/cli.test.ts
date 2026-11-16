import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isValidCnpj, isValidCpf } from '../dist/index.js';

// fileURLToPath em vez de .pathname: no Windows, .pathname devolve "/C:/...".
const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

function run(...args: string[]): { out: string; err: string; status: number | null } {
  const res = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  return { out: res.stdout, err: res.stderr, status: res.status };
}

test('cli: --version mostra a versão do package.json', () => {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(run('--version').out.trim(), version);
  assert.equal(run('-v').out.trim(), version);
});

test('cli: --offline antes do comando não é lido como valor da flag', () => {
  const { out, status } = run('--offline', 'cpf');
  assert.equal(status, 0);
  assert.equal(isValidCpf(JSON.parse(out)), true);
});

test('cli: --flag=valor e --no-formatting', () => {
  const { out } = run('cpf', '--offline', '--no-formatting');
  assert.match(JSON.parse(out), /^\d{11}$/);
  assert.match(run('credit-card', '--offline', '--flag=visa16', '--no-formatting').out, /"Número": "4\d{15}"/);
});

test('cli: cnpj --alphanumeric e validate cnpj com letras', () => {
  const generated = JSON.parse(run('cnpj', '--offline', '--alphanumeric', '--no-formatting').out) as string;
  assert.equal(isValidCnpj(generated), true);

  const { out } = run('validate', 'cnpj', '12.ABC.345/01DE-35', '--offline', '--json');
  assert.equal(JSON.parse(out).data.isValid, true);
});

test('cli: comando desconhecido e argumento faltando saem com erro', () => {
  const unknown = run('naoexiste', '--offline');
  assert.equal(unknown.status, 1);
  assert.match(unknown.err, /desconhecido/);

  const missing = run('validate', 'cpf', '--offline');
  assert.equal(missing.status, 1);
  assert.match(missing.err, /exige o código/);

  const noUf = run('voter-title', '--offline');
  assert.equal(noUf.status, 1);
  assert.match(noUf.err, /exige --uf/);
});

test('cli: --json devolve o envelope completo', () => {
  const result = JSON.parse(run('uf', '--n', '2', '--json').out);
  assert.equal(result.success, true);
  assert.equal(result.source, 'local');
  assert.equal(result.data.length, 2);
});
