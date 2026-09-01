/**
 * @killovsky/4devs
 * ----------------
 * Cliente não-oficial, nativo e sem dependências, para as ferramentas de
 * geração e validação de dados brasileiros fictícios do 4devs.com.br.
 *
 * ```ts
 * import { generators, validators } from '@killovsky/4devs';
 *
 * const { data: pessoas } = await generators.people({ n: 3, uf: 'SP' });
 * const { data: cpfCheck } = await validators.cpf('123.456.789-09');
 * ```
 *
 * Se o 4devs.com.br estiver fora do ar, as mesmas funções continuam
 * funcionando: caem automaticamente para geração/validação local
 * (`result.source === 'local'`). Para usar esse modo local diretamente e de
 * propósito (garantidamente offline, síncrono), importe `local`.
 */

export * from './consts.js';
export * from './types.js';
export { getHttpCodes } from './result.js';

export { generators } from './generators.js';
export { validators } from './validators.js';
export { local } from './local/index.js';

// Utilitários de baixo nível (parsing de HTML, algoritmos de dígito
// verificador, checagens de formato). Usados internamente pelos geradores/
// validadores acima e pela suíte de testes do pacote; expostos aqui porque
// também são úteis por si só para quem quiser compor seu próprio fallback
// ou depurar uma resposta inesperada do 4devs.
export * from './parse.js';
export * from './local/checksums.js';
export * from './local/plausible.js';

import { generators } from './generators.js';
import { validators } from './validators.js';
import { local } from './local/index.js';
import { getHttpCodes } from './result.js';

export default { generators, validators, local, getHttpCodes };
