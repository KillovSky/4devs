/**
 * Utilitários de extração de dados a partir dos fragmentos HTML que o
 * 4devs.com.br devolve para algumas ferramentas (conta bancária, cartão de
 * crédito, veículo, empresa e lista de cidades).
 *
 * Implementados sem nenhuma dependência de parsing de HTML (sem cheerio,
 * jsdom, etc.) — apenas regex bem delimitadas, o suficiente para os
 * fragmentos pequenos e previsíveis que essas ferramentas retornam.
 */

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

/** Decodifica entidades HTML (nomeadas, decimais e hexadecimais). */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

/**
 * Remove tags HTML de uma string em uma única passada linear (sem regex).
 *
 * Evitamos aqui uma regex do tipo `/<[^>]*>/g` de propósito: aplicada
 * globalmente sobre HTML não confiável (a resposta vem de rede, de um
 * terceiro), esse padrão pode degradar para tempo quadrático em entradas
 * adversariais com muitos `<` sem `>` correspondente — CodeQL sinaliza isso
 * como "polynomial regular expression used on uncontrolled data". Um
 * scanner de um único caractere por vez é O(n) garantido, sem esse risco.
 */
function removeTags(input: string): string {
  let out = '';
  let inTag = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '<') {
      inTag = true;
      out += ' '; // cada tag vira um espaço, igual ao comportamento anterior baseado em regex
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) out += ch;
  }
  return out;
}

/** Remove tags HTML e normaliza espaços em branco de um trecho de texto. */
export function stripTags(input: string): string {
  return decodeHtmlEntities(removeTags(input))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai atributos `nome="valor"` (ou `nome='valor'`) de uma tag HTML isolada.
 *
 * Implementado como um tokenizer de uma passada (sem regex) pelo mesmo
 * motivo de `removeTags`: o conteúdo de uma tag pode vir de uma resposta de
 * rede não confiável, e um parser linear elimina qualquer risco de
 * complexidade polinomial em entradas adversariais.
 */
function extractAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const len = tag.length;
  const isNameStart = (c: string) => /[a-zA-Z_:]/.test(c);
  const isNameChar = (c: string) => /[-a-zA-Z0-9_:.]/.test(c);
  const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v';

  let i = 0;
  while (i < len) {
    while (i < len && !isNameStart(tag[i])) i += 1;
    if (i >= len) break;

    const nameStart = i;
    i += 1;
    while (i < len && isNameChar(tag[i])) i += 1;
    const name = tag.slice(nameStart, i).toLowerCase();

    let j = i;
    while (j < len && isSpace(tag[j])) j += 1;
    if (j >= len || tag[j] !== '=') {
      i = j;
      continue; // atributo sem valor (booleano) — ignorado, como no comportamento anterior
    }
    j += 1;
    while (j < len && isSpace(tag[j])) j += 1;

    const quote = tag[j];
    if (quote !== '"' && quote !== "'") {
      i = j;
      continue; // valor sem aspas — fora do escopo do parser (os fragmentos do 4devs sempre usam aspas)
    }
    j += 1;
    const valueStart = j;
    while (j < len && tag[j] !== quote) j += 1;
    attrs[name] = tag.slice(valueStart, j);
    i = j < len ? j + 1 : j;
  }

  return attrs;
}

function hasClass(classAttr: string | undefined, className: string): boolean {
  if (!classAttr) return false;
  return classAttr.split(/\s+/).includes(className);
}

/**
 * Extrai o texto de todos os elementos `<TAG>` cujo atributo `class`
 * contenha `className`, na ordem em que aparecem no documento.
 *
 * Diferente de uma regex "gulosa" simples (`<div>...<\/div>`), esta função
 * rastreia o nível de aninhamento de tags com o mesmo nome para encontrar a
 * tag de fechamento **correta** — necessário porque os fragmentos do 4devs
 * costumam aninhar `<div class="output-txt">` dentro de outras `<div>`s de
 * layout (grid/coluna), e uma regex ingênua pararia na primeira `</div>`
 * encontrada, que nem sempre é a correspondente.
 */
export function extractElementTextsByClass(html: string, tagName: string, className: string): string[] {
  const results: string[] = [];
  const openTagRe = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const anyTagRe = new RegExp(`<${tagName}\\b[^>]*>|<\\/${tagName}\\s*>`, 'gi');

  let openMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((openMatch = openTagRe.exec(html)) !== null) {
    const attrs = extractAttributes(openMatch[1]);
    if (!hasClass(attrs.class, className)) continue;

    const contentStart = openTagRe.lastIndex;
    anyTagRe.lastIndex = contentStart;

    let depth = 1;
    let contentEnd = html.length;
    let innerMatch: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((innerMatch = anyTagRe.exec(html)) !== null) {
      if (innerMatch[0].charAt(1) === '/') {
        depth -= 1;
        if (depth === 0) {
          contentEnd = innerMatch.index;
          break;
        }
      } else {
        depth += 1;
      }
    }

    results.push(stripTags(html.slice(contentStart, contentEnd)));
  }

  return results;
}

/** Alias específico para `<div>`, o caso mais comum nos fragmentos do 4devs. */
export function extractDivTextsByClass(html: string, className: string): string[] {
  return extractElementTextsByClass(html, 'div', className);
}

/**
 * Extrai pares rótulo/valor de duas listas de `<div>` (rótulos e valores),
 * combinando pelo índice — usado para os fragmentos de conta bancária e
 * cartão de crédito, que seguem o padrão `output-subtitle` / `output-txt`.
 */
export function extractLabeledPairs(
  html: string,
  labelClass: string,
  valueClass: string,
): Record<string, string> {
  const labels = extractDivTextsByClass(html, labelClass);
  const values = extractDivTextsByClass(html, valueClass);
  const out: Record<string, string> = {};
  labels.forEach((label, i) => {
    out[label] = values[i] ?? '';
  });
  return out;
}

/**
 * Extrai pares rótulo/valor no padrão usado pelos fragmentos de veículo e
 * empresa: rótulos em `<strong>Rótulo:</strong>` e valores no atributo
 * `value` de `<input class="... margem_menor ...">`.
 */
export function extractStrongInputPairs(html: string): Record<string, string> {
  const labels: string[] = [];
  const strongRe = /<strong\b[^>]*>([\s\S]*?)<\/strong>/gi;
  let strongMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((strongMatch = strongRe.exec(html)) !== null) {
    const text = stripTags(strongMatch[1]);
    labels.push(text.endsWith(':') ? text.slice(0, -1) : text);
  }

  const values: string[] = [];
  const inputRe = /<input\b[^>]*>/gi;
  let inputMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((inputMatch = inputRe.exec(html)) !== null) {
    const attrs = extractAttributes(inputMatch[0]);
    if (hasClass(attrs.class, 'margem_menor')) {
      values.push(decodeHtmlEntities(attrs.value ?? ''));
    }
  }

  const out: Record<string, string> = {};
  labels.forEach((label, i) => {
    out[label] = values[i] ?? '';
  });
  return out;
}

/**
 * Extrai o texto de todas as `<option>` de um `<select>`, ignorando a
 * primeira (que é sempre o placeholder "Selecione o estado!"/"Selecione a
 * cidade" etc.).
 */
export function extractOptionTexts(html: string, { skipFirst = true }: { skipFirst?: boolean } = {}): string[] {
  const results: string[] = [];
  const re = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = re.exec(html)) !== null) {
    results.push(stripTags(match[1]));
  }
  return skipFirst ? results.slice(1) : results;
}

/**
 * Interpreta a resposta textual de um validador do 4devs, no formato
 * `"... - ... - Verdadeiro"` / `"... - ... - Falso"`.
 *
 * @param fromEnd Quantas posições a partir do final (1 = último segmento,
 *   2 = penúltimo) contêm o valor booleano. A maioria dos validadores usa 1;
 *   o de título de eleitor, por peculiaridade do site, usa 2.
 */
export function parseVerdadeiroFalso(raw: string, fromEnd = 1): boolean {
  const parts = raw.split(' - ').map((part) => stripTags(part).toLowerCase());
  const segment = parts[parts.length - fromEnd] ?? '';
  return segment === 'verdadeiro';
}
