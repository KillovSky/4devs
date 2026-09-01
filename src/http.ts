/**
 * Núcleo de requisições HTTP para a API pública do 4devs.com.br.
 *
 * Todas as ferramentas (geradores e validadores) do site conversam com o
 * mesmo endpoint, `POST /ferramentas_online.php`, diferenciando o que fazer
 * através do campo `acao` do corpo da requisição e do header `Referer`
 * (que deve apontar para a página da ferramenta correspondente).
 */

const API_URL = 'https://www.4devs.com.br/ferramentas_online.php';
const ORIGIN = 'https://www.4devs.com.br';

/**
 * Teto de tamanho para o corpo da resposta. As respostas reais do 4devs são
 * pequenas (a maior é a lista de cidades de SP, algo como algumas dezenas de
 * KB) — este limite existe como defesa em profundidade: `parse.ts` usa
 * regex para extrair conteúdo desses fragmentos, e um corpo de resposta
 * anormalmente grande (site comprometido, MITM, resposta inesperada)
 * poderia, em tese, deixar esse parsing mais lento que o necessário. Cortar
 * o tamanho aqui, antes de qualquer parsing, elimina esse risco na raiz.
 */
const MAX_RESPONSE_LENGTH = 200_000; // ~200.000 caracteres (~200 KB) — bem acima de qualquer resposta real

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' +
  ' (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Resultado bruto (não interpretado) de uma requisição à API do 4devs. */
export interface RawApiResult {
  ok: boolean;
  status: number;
  /** Corpo da resposta como texto (HTML, JSON ou texto simples, dependendo do endpoint). */
  body: string;
  /** Mensagem de erro, presente somente quando `ok` é `false`. */
  error: string | null;
}

export interface RequestOptions {
  /** Timeout da requisição em milissegundos. Padrão: 15000. */
  timeout?: number;
}

function buildHeaders(referer: string): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    DNT: '1',
    Origin: ORIGIN,
    Referer: `${ORIGIN}/${referer}`,
    'X-Requested-With': 'XMLHttpRequest',
  };
}

/**
 * Envia uma requisição `POST` ao endpoint de ferramentas do 4devs.
 *
 * @param referer Slug da página da ferramenta (ex.: `"gerador_de_cpf"`), usado
 *   para montar o header `Referer` exigido pelo servidor.
 * @param payload Campos do formulário a enviar (equivalente ao `FormData` da página).
 */
export async function fordevRequest(
  referer: string,
  payload: Record<string, string | number>,
  options: RequestOptions = {},
): Promise<RawApiResult> {
  const requestBody = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    requestBody.append(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: buildHeaders(referer),
      body: requestBody.toString(),
      signal: controller.signal,
    });

    const text = await res.text();
    const body = text.length > MAX_RESPONSE_LENGTH ? text.slice(0, MAX_RESPONSE_LENGTH) : text;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        body,
        error: `Requisição falhou com status HTTP ${res.status}.`,
      };
    }

    return { ok: true, status: res.status, body, error: null };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      body: '',
      error: isAbort
        ? `Requisição excedeu o tempo limite de ${options.timeout ?? 15000}ms.`
        : `Falha de rede: ${(err as Error).message}. Você pode ter sido bloqueado` +
          ' pelo servidor (evite usar proxy/VPN) ou o site pode estar fora do ar.',
    };
  } finally {
    clearTimeout(timer);
  }
}
