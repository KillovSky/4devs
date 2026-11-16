import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generators, validators, local } from '../dist/index.js';

const originalFetch = globalThis.fetch;

function mockFetchReject(message = 'network down'): void {
  globalThis.fetch = (async () => {
    throw new Error(message);
  }) as typeof fetch;
}

function mockFetchStatus(status: number, body = ''): void {
  globalThis.fetch = (async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  })) as unknown as typeof fetch;
}

function mockFetchOk(body: string): void {
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    text: async () => body,
  })) as unknown as typeof fetch;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

// 4devs indisponível (erro de rede)

test('fallback: erro de rede faz generators.cpf() cair para geração local', async () => {
  mockFetchReject();
  try {
    const result = await generators.cpf();
    assert.equal(result.success, true);
    assert.equal(result.source, 'local');
    assert.match(result.warning ?? '', /4devs\.com\.br/);
    assert.equal(local.validators.cpf(result.data as string).isValid, true);
  } finally {
    restoreFetch();
  }
});

test('fallback: erro de rede faz validators.cpf() validar localmente (algoritmo real)', async () => {
  mockFetchReject();
  try {
    const validCpf = local.generators.cpf();
    const result = await validators.cpf(validCpf);
    assert.equal(result.success, true);
    assert.equal(result.source, 'local');
    assert.equal(result.data?.isValid, true);
    assert.match(result.data?.raw ?? '', /algoritmo oficial/);
  } finally {
    restoreFetch();
  }
});

// 4devs respondendo com erro HTTP (bloqueio, 403, 500)

test('fallback: status HTTP 403 faz generators.people() cair para geração local', async () => {
  mockFetchStatus(403, 'Forbidden');
  try {
    const result = await generators.people({ n: 2, uf: 'SP' });
    assert.equal(result.success, true);
    assert.equal(result.source, 'local');
    assert.equal(result.data?.length, 2);
    assert.equal(result.data?.[0]?.estado, 'SP');
  } finally {
    restoreFetch();
  }
});

test('fallback: status HTTP 500 faz generators.bankAccount() cair para geração local', async () => {
  mockFetchStatus(500, 'Internal Server Error');
  try {
    const result = await generators.bankAccount({ bank: 'itau' });
    assert.equal(result.source, 'local');
    assert.match(result.data?.Banco ?? '', /Itaú/);
  } finally {
    restoreFetch();
  }
});

// resposta com status 200, mas em formato inesperado

test('fallback: corpo em formato inesperado (JSON inválido) faz generators.people() cair para local', async () => {
  mockFetchOk('<html>isto não é o JSON esperado</html>');
  try {
    const result = await generators.people({ n: 1 });
    assert.equal(result.success, true);
    assert.equal(result.source, 'local');
    assert.match(result.warning ?? '', /formato inesperado/);
  } finally {
    restoreFetch();
  }
});

// 4devs disponível: a resposta da rede é usada

test('rede OK: generators.cpf() usa a resposta do 4devs quando ela chega normalmente', async () => {
  mockFetchOk('123.456.789-09');
  try {
    const result = await generators.cpf();
    assert.equal(result.source, 'network');
    assert.equal(result.warning, null);
    assert.equal(result.data, '123.456.789-09');
  } finally {
    restoreFetch();
  }
});

test('rede OK: validators.cpf() usa a resposta do 4devs quando ela chega normalmente', async () => {
  mockFetchOk('CPF: 123.456.789-09 - Válido - Verdadeiro');
  try {
    const result = await validators.cpf('123.456.789-09');
    assert.equal(result.source, 'network');
    assert.equal(result.data?.isValid, true);
  } finally {
    restoreFetch();
  }
});

test('rede OK: generators.bankAccount() interpreta o fragmento HTML do 4devs (com divs aninhados)', async () => {
  mockFetchOk(`
    <div class="row">
      <div class="col-md-6">
        <div class="output-subtitle">Banco:</div>
        <div class="output-txt">001 - Banco do Brasil</div>
      </div>
    </div>`);
  try {
    const result = await generators.bankAccount({ bank: 'brasil' });
    assert.equal(result.source, 'network');
    assert.equal(result.data?.['Banco:'], '001 - Banco do Brasil');
  } finally {
    restoreFetch();
  }
});

// parâmetros e opções

test('timeout inválido (NaN, 0, negativo) usa o padrão e não aborta a requisição na hora', async () => {
  mockFetchOk('123.456.789-09');
  try {
    for (const timeout of [Number.NaN, 0, -5]) {
      const result = await generators.cpf({ timeout });
      assert.equal(result.source, 'network', `timeout ${timeout}`);
    }
  } finally {
    restoreFetch();
  }
});

test('generators.cnpj({ alphanumeric: true }) gera localmente, sem requisição', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error('não deveria ser chamado');
  }) as typeof fetch;
  try {
    const result = await generators.cnpj({ alphanumeric: true, formatting: false });
    assert.equal(calls, 0);
    assert.equal(result.source, 'local');
    assert.equal(result.warning, null);
    assert.equal(local.validators.cnpj(result.data as string).isValid, true);
  } finally {
    restoreFetch();
  }
});

test('resposta HTML com entidade inválida não derruba a leitura', async () => {
  mockFetchOk('<div class="output-subtitle">Banco:</div><div class="output-txt">A &#99999999999; B</div>');
  try {
    const result = await generators.bankAccount({ bank: 'brasil' });
    assert.equal(result.source, 'network');
    assert.equal(result.data?.['Banco:'], 'A &#99999999999; B');
  } finally {
    restoreFetch();
  }
});
