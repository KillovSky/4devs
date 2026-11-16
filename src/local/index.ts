// Geração e validação sem rede. É o que as funções principais usam quando o
// 4devs.com.br não responde, e também pode ser chamado direto:
//
//   import { local } from '@killovsky/4devs';
//   local.generators.cpf();
//   local.validators.cpf('123.456.789-09');

export { localGenerators as generators } from './generators.js';
export { localValidators as validators } from './validators.js';
export * from './checksums.js';
export * from './plausible.js';

import { localGenerators } from './generators.js';
import { localValidators } from './validators.js';

export const local = { generators: localGenerators, validators: localValidators };

export default local;
