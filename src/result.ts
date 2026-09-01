import httpCodesJson from './httpCodes.json' with { type: 'json' };
import type { RawApiResult } from './http.js';
import type { FourDevsResult, HttpCodeExplain } from './types.js';

const HTTP_CODES = httpCodesJson as unknown as Record<string, HttpCodeExplain>;

/** Retorna a tabela de explicações de status HTTP embutida no pacote. */
export function getHttpCodes(): Record<string, HttpCodeExplain> {
  return HTTP_CODES;
}

/**
 * Converte uma resposta HTTP bruta do 4devs no envelope público
 * `FourDevsResult<T>`.
 *
 * Se a requisição falhou (rede, timeout ou status não-2xx) **ou** se
 * `transform` lançar uma exceção ao interpretar o corpo da resposta (sinal
 * de que o formato mudou ou o site bloqueou a chamada), a função cai
 * automaticamente para `fallback()` — que gera/valida o mesmo dado
 * localmente — em vez de propagar o erro. O resultado final tem
 * `success: true` e `source: "local"` nesse caso; o motivo da queda para o
 * modo local fica em `warning`.
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
      const data = transform(raw.body);
      return { ...base, success: true, error: null, data, source: 'network' as const, warning: null };
    } catch (err) {
      return {
        ...base,
        success: true,
        error: null,
        data: fallback(),
        source: 'local' as const,
        warning: `A resposta do 4devs.com.br veio em um formato inesperado (${(err as Error).message}); os dados foram gerados/validados localmente como alternativa.`,
      };
    }
  }

  return {
    ...base,
    success: true,
    error: null,
    data: fallback(),
    source: 'local' as const,
    warning: `Não foi possível falar com o 4devs.com.br (${raw.error ?? `status HTTP ${raw.status}`}); os dados foram gerados/validados localmente como alternativa.`,
  };
}

/** Constrói um `FourDevsResult<T>` "local" (sem requisição HTTP), usado por funções puramente locais como `uf()` e `vehicleBrand()`. */
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
