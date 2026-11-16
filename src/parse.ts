// Leitura dos fragmentos de HTML que o 4devs devolve (conta bancária, cartão,
// veículo, empresa e lista de cidades). Não usa biblioteca de HTML: as funções
// abaixo percorrem o texto uma única vez, sem regex, porque o HTML vem da rede
// e não deve poder deixar o parser lento.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  aacute: 'á', Aacute: 'Á',
  eacute: 'é', Eacute: 'É',
  iacute: 'í', Iacute: 'Í',
  oacute: 'ó', Oacute: 'Ó',
  uacute: 'ú', Uacute: 'Ú',
  atilde: 'ã', Atilde: 'Ã',
  otilde: 'õ', Otilde: 'Õ',
  acirc: 'â', Acirc: 'Â',
  ecirc: 'ê', Ecirc: 'Ê',
  ocirc: 'ô', Ocirc: 'Ô',
  agrave: 'à', Agrave: 'À',
  ccedil: 'ç', Ccedil: 'Ç',
  uuml: 'ü', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ',
};

/** Decodifica entidades HTML nomeadas, decimais e hexadecimais. O que não for reconhecido fica como está. */
export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return NAMED_ENTITIES[entity] ?? match;

    const isHex = entity[1] === 'x' || entity[1] === 'X';
    const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

interface Tag {
  /** Nome em minúsculas. Vazio para comentários e declarações (`<!-- -->`, `<!doctype>`). */
  name: string;
  closing: boolean;
  /** Texto entre o nome e o `>`, onde ficam os atributos. */
  attrs: string;
  /** Posição do `<`. */
  start: number;
  /** Posição logo depois do `>`. */
  end: number;
}

function isLetter(ch: string | undefined): boolean {
  return ch !== undefined && ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'));
}

/**
 * Lista as tags de um trecho de HTML, em ordem.
 *
 * Um `<` só começa uma tag se vier seguido de letra, `/`, `!` ou `?`; fora disso é
 * texto comum ("1 < 2"). Aspas dentro da tag são respeitadas, então um `>` dentro de
 * um atributo não fecha a tag. Se uma tag não for fechada até o fim do texto, a
 * leitura para ali, como faz um navegador, e `stoppedAt` marca onde ela começa.
 * Cada caractere é visitado uma vez só.
 */
function scanTags(html: string): { tags: Tag[]; stoppedAt: number | null } {
  const tags: Tag[] = [];
  let stoppedAt: number | null = null;
  let i = 0;

  while (i < html.length) {
    const start = html.indexOf('<', i);
    if (start === -1) break;

    const next = html[start + 1];
    const closing = next === '/';
    const nameStart = closing ? start + 2 : start + 1;

    if (next === '!' || next === '?') {
      const terminator = html.startsWith('<!--', start) ? '-->' : '>';
      const close = html.indexOf(terminator, start + 2);
      if (close === -1) {
        stoppedAt = start;
        break;
      }
      const end = close + terminator.length;
      tags.push({ name: '', closing: false, attrs: '', start, end });
      i = end;
      continue;
    }

    if (!isLetter(html[nameStart])) {
      i = start + 1;
      continue;
    }

    let j = nameStart;
    while (j < html.length && /[A-Za-z0-9:-]/.test(html[j])) j += 1;
    const name = html.slice(nameStart, j).toLowerCase();

    let quote = '';
    const attrsStart = j;
    while (j < html.length) {
      const ch = html[j];
      if (quote) {
        if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
      j += 1;
    }
    if (j >= html.length) {
      stoppedAt = start;
      break;
    }

    tags.push({ name, closing, attrs: html.slice(attrsStart, j), start, end: j + 1 });
    i = j + 1;
  }

  return { tags, stoppedAt };
}

/** Tira as tags e comentários de um trecho de HTML. Cada tag vira um espaço. */
function removeTags(html: string): string {
  const { tags, stoppedAt } = scanTags(html);
  let out = '';
  let last = 0;

  for (const tag of tags) {
    out += `${html.slice(last, tag.start)} `;
    last = tag.end;
  }

  return out + html.slice(last, stoppedAt ?? html.length);
}

/** Remove as tags, decodifica as entidades e junta os espaços em branco seguidos. */
export function stripTags(input: string): string {
  return decodeHtmlEntities(removeTags(input))
    .replace(/\s+/g, ' ')
    .trim();
}

const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v';
const isNameStart = (c: string) => /[a-zA-Z_:]/.test(c);
const isNameChar = (c: string) => /[-a-zA-Z0-9_:.]/.test(c);

/** Lê os atributos `nome="valor"` (ou com aspas simples) de um trecho de tag. Atributos sem aspas são ignorados. */
function parseAttributes(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const len = attrs.length;
  let i = 0;

  while (i < len) {
    while (i < len && !isNameStart(attrs[i])) i += 1;
    if (i >= len) break;

    const nameStart = i;
    i += 1;
    while (i < len && isNameChar(attrs[i])) i += 1;
    const name = attrs.slice(nameStart, i).toLowerCase();

    let j = i;
    while (j < len && isSpace(attrs[j])) j += 1;
    if (j >= len || attrs[j] !== '=') {
      i = j;
      continue;
    }
    j += 1;
    while (j < len && isSpace(attrs[j])) j += 1;

    const quote = attrs[j];
    if (quote !== '"' && quote !== "'") {
      i = j;
      continue;
    }
    j += 1;
    const valueStart = j;
    while (j < len && attrs[j] !== quote) j += 1;
    result[name] = attrs.slice(valueStart, j);
    i = j < len ? j + 1 : j;
  }

  return result;
}

function hasClass(classAttr: string | undefined, className: string): boolean {
  return classAttr ? classAttr.split(/\s+/).includes(className) : false;
}

// Quantos elementos aninhados são lidos ao mesmo tempo. Os fragmentos reais têm poucos
// níveis; o limite evita custo quadrático em um HTML feito só de tags abertas.
const MAX_NESTING = 64;

/**
 * Devolve o texto de cada elemento `<tagName>` que tenha a classe `className`, na
 * ordem em que eles abrem no documento.
 *
 * As tags de fechamento são casadas com as de abertura, então um elemento dentro
 * de vários `<div>` de layout (como nos fragmentos do 4devs) é lido por inteiro.
 * Elemento que não chega a fechar vai até o fim do texto.
 */
export function extractElementTextsByClass(html: string, tagName: string, className: string): string[] {
  const name = tagName.toLowerCase();
  const results: string[] = [];
  const open: Array<{ slot: number | null; contentStart: number }> = [];

  for (const tag of scanTags(html).tags) {
    if (tag.name !== name) continue;

    if (!tag.closing) {
      const matches = open.length < MAX_NESTING && hasClass(parseAttributes(tag.attrs).class, className);
      open.push({ slot: matches ? results.push('') - 1 : null, contentStart: tag.end });
      continue;
    }

    const element = open.pop();
    if (element && element.slot !== null) {
      results[element.slot] = stripTags(html.slice(element.contentStart, tag.start));
    }
  }

  for (const element of open) {
    if (element.slot !== null) results[element.slot] = stripTags(html.slice(element.contentStart));
  }

  return results;
}

/** Atalho de `extractElementTextsByClass` para `<div>`. */
export function extractDivTextsByClass(html: string, className: string): string[] {
  return extractElementTextsByClass(html, 'div', className);
}

function pairUp(labels: string[], values: string[]): Record<string, string> {
  const pairs: Record<string, string> = {};
  labels.forEach((label, i) => {
    pairs[label] = values[i] ?? '';
  });
  return pairs;
}

/**
 * Junta rótulos e valores de duas listas de `<div>`, pela posição de cada um. É o
 * formato dos fragmentos de conta bancária e cartão (`output-subtitle` e `output-txt`).
 */
export function extractLabeledPairs(
  html: string,
  labelClass: string,
  valueClass: string,
): Record<string, string> {
  return pairUp(extractDivTextsByClass(html, labelClass), extractDivTextsByClass(html, valueClass));
}

/**
 * Formato dos fragmentos de veículo e empresa: o rótulo fica em `<strong>Rótulo:</strong>`
 * e o valor no atributo `value` de um `<input class="margem_menor">`.
 */
export function extractStrongInputPairs(html: string): Record<string, string> {
  const labels: string[] = [];
  const values: string[] = [];
  let strongStart = -1;

  for (const tag of scanTags(html).tags) {
    if (tag.name === 'strong') {
      if (!tag.closing) {
        strongStart = tag.end;
      } else if (strongStart !== -1) {
        const text = stripTags(html.slice(strongStart, tag.start));
        labels.push(text.endsWith(':') ? text.slice(0, -1) : text);
        strongStart = -1;
      }
    } else if (tag.name === 'input' && !tag.closing) {
      const attrs = parseAttributes(tag.attrs);
      if (hasClass(attrs.class, 'margem_menor')) values.push(decodeHtmlEntities(attrs.value ?? ''));
    }
  }

  return pairUp(labels, values);
}

/** Texto de cada `<option>` de um `<select>`. Por padrão a primeira é descartada, porque é o "Selecione...". */
export function extractOptionTexts(html: string, { skipFirst = true }: { skipFirst?: boolean } = {}): string[] {
  const texts: string[] = [];
  let optionStart = -1;

  for (const tag of scanTags(html).tags) {
    if (tag.name !== 'option') continue;

    if (!tag.closing) {
      optionStart = tag.end;
    } else if (optionStart !== -1) {
      texts.push(stripTags(html.slice(optionStart, tag.start)));
      optionStart = -1;
    }
  }

  return skipFirst ? texts.slice(1) : texts;
}

/**
 * Lê a resposta de um validador do 4devs, no formato `"... - ... - Verdadeiro"` ou
 * `"... - ... - Falso"`.
 *
 * `fromEnd` diz em qual segmento, contando do fim, está o veredito: 1 é o último,
 * 2 é o penúltimo. O validador de título de eleitor usa 2.
 */
export function parseVerdadeiroFalso(raw: string, fromEnd = 1): boolean {
  const parts = raw.split(' - ').map((part) => stripTags(part).toLowerCase());
  return (parts[parts.length - fromEnd] ?? '') === 'verdadeiro';
}
