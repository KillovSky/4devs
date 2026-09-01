/**
 * fordev-native/local
 * ---------------------
 * Camada 100% offline do módulo: nenhuma função aqui faz requisição de
 * rede. É o que alimenta o modo de contingência das funções principais em
 * `generators.ts`/`validators.ts` quando o 4devs.com.br está indisponível,
 * e também pode ser usada diretamente por quem quiser gerar/validar dados
 * garantidamente sem depender de rede.
 *
 * ```ts
 * import { local } from '@killovsky/4devs';
 *
 * const cpf = local.generators.cpf();           // síncrono, sem rede
 * const check = local.validators.cpf('123.456.789-09');
 * ```
 */

export { localGenerators as generators } from './generators.js';
export { localValidators as validators } from './validators.js';
export * from './checksums.js';
export * from './plausible.js';

import { localGenerators } from './generators.js';
import { localValidators } from './validators.js';

export const local = { generators: localGenerators, validators: localValidators };

export default local;
