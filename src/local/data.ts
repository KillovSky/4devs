/**
 * fordev-native/local/data
 * -------------------------
 * Listas de apoio (nomes, ruas, bairros, cidades por UF, termos de empresa)
 * usadas pelos geradores locais em `local/generators.ts`. Pequenas e
 * deliberadamente simples — servem para o modo de contingência funcionar de
 * forma plausível quando o 4devs.com.br está fora do ar, não para substituir
 * a base de dados real do site.
 */

export const FIRST_NAMES_MALE = [
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Felipe',
  'Diego', 'Thiago', 'Marcelo', 'André', 'Ricardo', 'Eduardo', 'Gustavo',
  'Vinícius', 'Rodrigo', 'Leonardo', 'Fernando', 'Daniel',
];

export const FIRST_NAMES_FEMALE = [
  'Maria', 'Ana', 'Juliana', 'Camila', 'Fernanda', 'Larissa', 'Beatriz',
  'Amanda', 'Patrícia', 'Carolina', 'Letícia', 'Mariana', 'Bruna', 'Aline',
  'Vanessa', 'Gabriela', 'Isabela', 'Renata', 'Débora', 'Priscila',
];

export const SURNAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues',
  'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho',
  'Gomes', 'Martins', 'Ribeiro', 'Barbosa', 'Cardoso', 'Teixeira', 'Moreira',
];

export const STREET_PREFIXES = ['Rua', 'Avenida', 'Travessa', 'Alameda'];

export const STREET_NAMES = [
  'das Flores', 'Brasil', 'das Palmeiras', 'Sete de Setembro', 'Rio Branco',
  'das Acácias', 'Voluntários da Pátria', 'Getúlio Vargas', 'dos Andradas',
  'Marechal Deodoro', 'das Laranjeiras', 'São João', 'Independência',
];

export const NEIGHBORHOODS = [
  'Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'Santa Luzia',
  'Jardim das Flores', 'Cidade Nova', 'São José', 'Bela Vista', 'Alto da Boa Vista',
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EYE_HAIR_COLORS = ['Castanho', 'Preto', 'Loiro', 'Ruivo', 'Grisalho'];

/**
 * Uma pequena amostra de cidades por UF — suficiente para o modo de
 * contingência de `generators.city()` devolver algo plausível quando o
 * 4devs está indisponível. Não é (nem pretende ser) a lista completa de
 * municípios, que só o próprio 4devs fornece.
 */
export const SAMPLE_CITIES_BY_UF: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira'],
  AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte'],
  ES: ['Vitória', 'Vila Velha', 'Serra'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
  MA: ['São Luís', 'Imperatriz', 'Caxias'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem'],
  PA: ['Belém', 'Ananindeua', 'Santarém'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita'],
  PR: ['Curitiba', 'Londrina', 'Maringá'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
  PI: ['Teresina', 'Parnaíba', 'Picos'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  RN: ['Natal', 'Mossoró', 'Parnamirim'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau'],
  SP: ['São Paulo', 'Campinas', 'Guarulhos'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto'],
  TO: ['Palmas', 'Araguaína', 'Gurupi'],
  DF: ['Brasília', 'Ceilândia', 'Taguatinga'],
};

export const COMPANY_ACTIVITIES = [
  'Comércio de Produtos', 'Indústria e Comércio', 'Serviços Digitais',
  'Consultoria Empresarial', 'Distribuidora', 'Tecnologia da Informação',
  'Alimentos e Bebidas', 'Materiais de Construção', 'Móveis e Decoração',
  'Transportes e Logística',
];

export const COMPANY_SUFFIXES = ['LTDA', 'ME', 'EIRELI', 'S.A.'];

// randomItem/randomInt reexportados de `secureRandom.ts` (crypto.randomInt em
// vez de Math.random()) — mantidos aqui por compatibilidade, já que
// `local/generators.ts` os importa deste módulo.
export { randomItem, randomInt } from './secureRandom.js';
