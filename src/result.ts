import httpCodesJson from './httpCodes.json' with { type: 'json' };
import type { RawApiResult } from './http.js';
import type { FourDevsResult, HttpCodeExplain } from './types.js';

const HTTP_CODES = httpCodesJson as unknown as Record<string, HttpCodeExplain>;

/** Tabela com a explicação dos códigos de status HTTP. */
export function getHttpCodes(): Record<string, HttpCodeExplain> {
  return HTTP_CODES;
}

/**
 * Monta o `FourDevsResult` a partir da resposta bruta do 4devs.
 *
 * Se a requisição falhou, ou se `transform` lançar erro ao ler o corpo (o formato
 * do site mudou, por exemplo), o dado é produzido por `fallback()`, localmente, e o
 * resultado sai com `source: 'local'` e o motivo em `warning`. A função não lança.
 */
export function buildResult<T>(
  raw: RawApiResult,
  transform: (body: string) => T,
  fallback: () => T,
): FourDevsResult<T> {
  const base = {
    date: new Date().toISOString(),
    status: raw.status,
    explain: HTTP_CODES[String(raw.status)],
  };

  if (raw.ok) {
    try {
      return { ...base, success: true, error: null, data: transform(raw.body), source: 'network', warning: null };
    } catch (err) {
      return {
        ...base,
        success: true,
        error: null,
        data: fallback(),
        source: 'local',
        warning: `A resposta do 4devs.com.br veio em um formato inesperado (${(err as Error).message}); os dados foram gerados ou validados localmente.`,
      };
    }
  }

  return {
    ...base,
    success: true,
    error: null,
    data: fallback(),
    source: 'local',
    warning: `Não foi possível falar com o 4devs.com.br (${raw.error ?? `status HTTP ${raw.status}`}); os dados foram gerados ou validados localmente.`,
  };
}

/** Resultado de uma função que nunca usa a rede, como `uf()` e `vehicleBrand()`. */
export function buildLocalResult<T>(data: T): FourDevsResult<T> {
  return {
    date: new Date().toISOString(),
    success: true,
    status: 200,
    explain: HTTP_CODES['200'],
    error: null,
    data,
    source: 'local',
    warning: null,
  };
}
