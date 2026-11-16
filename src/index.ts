// @killovsky/4devs: cliente não oficial para as ferramentas de geração e validação
// de dados brasileiros fictícios do 4devs.com.br. Se o site cair, as mesmas funções
// passam a gerar e validar localmente (`result.source === 'local'`).

export * from './consts.js';
export * from './types.js';
export { getHttpCodes } from './result.js';

export { generators } from './generators.js';
export { validators } from './validators.js';
export { local } from './local/index.js';

// Parser de HTML e algoritmos de dígito verificador. São usados pelos geradores e
// validadores, e ficam exportados para quem quiser montar o próprio fallback.
export * from './parse.js';
export * from './local/checksums.js';
export * from './local/plausible.js';

import { generators } from './generators.js';
import { validators } from './validators.js';
import { local } from './local/index.js';
import { getHttpCodes } from './result.js';

export default { generators, validators, local, getHttpCodes };
