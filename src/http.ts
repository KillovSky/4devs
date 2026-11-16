// Todas as ferramentas do 4devs usam o mesmo endpoint (POST /ferramentas_online.php).
// O que muda é o campo `acao` do corpo e o header `Referer`, que precisa apontar
// para a página da ferramenta.

const API_URL = 'https://www.4devs.com.br/ferramentas_online.php';
const ORIGIN = 'https://www.4devs.com.br';
const DEFAULT_TIMEOUT = 15000;

// As respostas reais têm poucas dezenas de KB. O que passar disso é cortado antes
// de chegar ao parser.
const MAX_RESPONSE_LENGTH = 200_000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' +
  ' (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Resposta da API do 4devs, antes de ser interpretada. */
export interface RawApiResult {
  ok: boolean;
  /** Status HTTP, ou 0 se a requisição nem chegou a ser respondida. */
  status: number;
  /** Corpo como texto: HTML, JSON ou texto simples, conforme a ferramenta. */
  body: string;
  /** Mensagem de erro; só existe quando `ok` é `false`. */
  error: string | null;
}

export interface RequestOptions {
  /** Tempo limite da requisição, em ms. Padrão: 15000. Valores que não sejam um número maior que zero usam o padrão. */
  timeout?: number;
}

function resolveTimeout(timeout: number | undefined): number {
  return typeof timeout === 'number' && Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT;
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
 * Envia um POST ao endpoint do 4devs.
 *
 * @param referer Nome da página da ferramenta (por exemplo `"gerador_de_cpf"`).
 * @param payload Campos do formulário.
 */
export async function fordevRequest(
  referer: string,
  payload: Record<string, string | number>,
  options: RequestOptions = {},
): Promise<RawApiResult> {
  const timeout = resolveTimeout(options.timeout);

  const requestBody = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    requestBody.append(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

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
      return { ok: false, status: res.status, body, error: `Requisição falhou com status HTTP ${res.status}.` };
    }

    return { ok: true, status: res.status, body, error: null };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      body: '',
      error: isAbort
        ? `Requisição excedeu o tempo limite de ${timeout}ms.`
        : `Falha de rede: ${(err as Error).message}. O site pode estar fora do ar ou ter bloqueado a requisição (evite proxy e VPN).`,
    };
  } finally {
    clearTimeout(timer);
  }
}
