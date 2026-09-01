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

// -- 4devs indisponível (erro de rede) -------------------------------------

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

// -- 4devs respondendo com erro HTTP (ex.: bloqueio, 403/500) --------------

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

// -- resposta "bem-sucedida" mas em formato inesperado ----------------------

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

// -- 4devs disponível: o caminho de rede é usado normalmente ---------------

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
