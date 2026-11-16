import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeHtmlEntities, stripTags, extractLabeledPairs, extractStrongInputPairs,
  extractOptionTexts, extractDivTextsByClass, parseVerdadeiroFalso,
} from '../dist/index.js';

test('decodeHtmlEntities: nomeadas, decimais e hexadecimais', () => {
  assert.equal(decodeHtmlEntities('S&atilde;o Paulo'), 'São Paulo');
  assert.equal(decodeHtmlEntities('&#67;&#97;f&#233;'), 'Café');
  assert.equal(decodeHtmlEntities('&#x43;afe'), 'Cafe');
});

test('stripTags: remove tags e normaliza espaços', () => {
  assert.equal(stripTags('  <b>Olá</b>&nbsp;Mundo  '), 'Olá Mundo');
});

test('extractLabeledPairs: pares simples (output-subtitle / output-txt)', () => {
  const html = `
    <div class="output-subtitle">Banco:</div>
    <div class="output-txt">001 - Banco do Brasil</div>
    <div class="output-subtitle">Agência:</div>
    <div class="output-txt">1234</div>
  `;
  assert.deepEqual(extractLabeledPairs(html, 'output-subtitle', 'output-txt'), {
    'Banco:': '001 - Banco do Brasil',
    'Agência:': '1234',
  });
});

test('extractLabeledPairs: lê os valores mesmo com <div> de layout em volta', () => {
  // Uma regex simples de <div>...</div> pararia na primeira tag de fechamento, que
  // aqui não é a do elemento procurado.
  const html = `
    <div class="row">
      <div class="col-md-6">
        <div class="output-subtitle">Banco:</div>
        <div class="output-txt">001 - Banco do Brasil</div>
      </div>
      <div class="col-md-6">
        <div class="output-subtitle">Agência:</div>
        <div class="output-txt">  1234  </div>
      </div>
      <div class="col-md-12">
        <div class="output-subtitle">Conta:</div>
        <div class="output-txt">56789-0</div>
      </div>
    </div>`;
  assert.deepEqual(extractLabeledPairs(html, 'output-subtitle', 'output-txt'), {
    'Banco:': '001 - Banco do Brasil',
    'Agência:': '1234',
    'Conta:': '56789-0',
  });
});

test('extractStrongInputPairs: rótulos em <strong> + valores em input.margem_menor', () => {
  const html = `
    <div class="form-group">
      <strong>Marca:</strong>
      <input type="text" readonly class="form-control margem_menor" value="FIAT">
    </div>
    <div class="form-group">
      <strong>Modelo:</strong>
      <input value="UNO MILLE" class="margem_menor form-control" type="text" readonly>
    </div>`;
  assert.deepEqual(extractStrongInputPairs(html), { Marca: 'FIAT', Modelo: 'UNO MILLE' });
});

test('extractOptionTexts: ignora a primeira opção (placeholder) por padrão', () => {
  const html = '<select><option value="">Selecione a cidade</option><option value="1">S&atilde;o Paulo</option><option value="2">Campinas</option></select>';
  assert.deepEqual(extractOptionTexts(html), ['São Paulo', 'Campinas']);
  assert.deepEqual(extractOptionTexts(html, { skipFirst: false }).length, 3);
});

test('parseVerdadeiroFalso: último segmento por padrão, penúltimo quando fromEnd=2 (caso do título de eleitor)', () => {
  assert.equal(parseVerdadeiroFalso('CPF: 123.456.789-09 - Válido - Verdadeiro'), true);
  assert.equal(parseVerdadeiroFalso('CPF: 111.111.111-11 - Inválido - Falso'), false);
  assert.equal(parseVerdadeiroFalso('Título: 123456789012 - Verdadeiro - Válido', 2), true);
});

test('decodeHtmlEntities: entidade numérica fora do intervalo Unicode não lança e fica como está', () => {
  assert.equal(decodeHtmlEntities('a &#99999999999; b'), 'a &#99999999999; b');
  assert.equal(decodeHtmlEntities('&entidadeinexistente;'), '&entidadeinexistente;');
});

test('stripTags: "<" solto no texto não é tag', () => {
  assert.equal(stripTags('1 < 2 e 3 > 2'), '1 < 2 e 3 > 2');
});

test('stripTags: ">" dentro de aspas de atributo não fecha a tag', () => {
  assert.equal(stripTags('<a title="a > b">texto</a>'), 'texto');
});

test('stripTags: comentário é removido e tag sem fechamento é descartada', () => {
  assert.equal(stripTags('a<!-- b > c -->d'), 'a d');
  assert.equal(stripTags('texto <b class="x'), 'texto');
});

test('extractDivTextsByClass: elementos aninhados com a mesma classe saem na ordem de abertura', () => {
  const html = '<div class="x">fora <div class="x">dentro</div> fim</div><div class="x">outro</div>';
  assert.deepEqual(extractDivTextsByClass(html, 'x'), ['fora dentro fim', 'dentro', 'outro']);
});

test('extractDivTextsByClass: elemento que não fecha vai até o fim', () => {
  assert.deepEqual(extractDivTextsByClass('<div class="x">sem fim', 'x'), ['sem fim']);
});

test('parser: entradas montadas para ficar lentas terminam rápido', () => {
  const inputs = [
    '<div class="x">'.repeat(40_000),
    '<a '.repeat(80_000),
    '<'.repeat(150_000),
    '<option>'.repeat(30_000),
    `<strong>${'<strong>'.repeat(20_000)}`,
  ];

  for (const input of inputs) {
    const start = Date.now();
    stripTags(input);
    extractDivTextsByClass(input, 'x');
    extractStrongInputPairs(input);
    extractOptionTexts(input);
    assert.ok(Date.now() - start < 2000, `demorou demais para a entrada que começa com ${input.slice(0, 12)}`);
  }
});
