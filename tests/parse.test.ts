import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeHtmlEntities, stripTags, extractLabeledPairs, extractStrongInputPairs,
  extractOptionTexts, parseVerdadeiroFalso,
} from '../dist/index.js';

test('decodeHtmlEntities: nomeadas, decimais e hexadecimais', () => {
  assert.equal(decodeHtmlEntities('S&atilde;o Paulo'), 'São Paulo');
  assert.equal(decodeHtmlEntities('&#67;&#97;f&#233;'), 'Café');
  assert.equal(decodeHtmlEntities('&#x43;afe&#x301;'.replace('&#x301;', '')), 'Cafe');
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

test('extractLabeledPairs: REGRESSÃO — funciona mesmo com <div> aninhados em volta (grid/coluna)', () => {
  // Este é exatamente o padrão que quebrava uma regex ingênua <div>...<\/div>,
  // porque a tag de fechamento mais próxima não é a correspondente.
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
