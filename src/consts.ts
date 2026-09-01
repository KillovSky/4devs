/**
 * Tabelas de referência (constantes) usadas pelos geradores e validadores.
 *
 * Todos os valores aqui foram conferidos diretamente contra os formulários
 * públicos do 4devs.com.br (dropdowns de banco, bandeira, certidão etc.),
 * garantindo paridade total com o que o site realmente aceita.
 */

/** Código de Unidade Federativa (estado) do Brasil. */
export type UFCode =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'ES' | 'GO' | 'MA'
  | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ'
  | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO' | 'DF';

/** Todos os códigos de UF válidos, na ordem usada pelo site. */
export const UF_CODES: readonly UFCode[] = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'DF',
];

const UF_SET = new Set<string>(UF_CODES);

/** Verifica se uma string é um código de UF válido. */
export function isValidUF(uf: string): uf is UFCode {
  return UF_SET.has(uf.toUpperCase());
}

/** Lança um erro descritivo caso `uf` não seja um código de UF válido. */
export function assertValidUF(uf: string, { allowEmpty = false }: { allowEmpty?: boolean } = {}): void {
  if (allowEmpty && uf === '') return;
  if (!isValidUF(uf)) {
    throw new RangeError(
      `Código de UF "${uf}" é inválido. Use um dos seguintes: ${UF_CODES.join(', ')}.`,
    );
  }
}

/** Uma marca de veículo suportada pelo gerador de veículos (tabela FIPE). */
export interface VehicleBrand {
  name: string;
  fipeCode: number;
}

/** Todas as 87 marcas de veículos suportadas pelo gerador de veículos do 4devs. */
export const VEHICLE_BRANDS: readonly VehicleBrand[] = [
  { name: 'Acura', fipeCode: 1 },
  { name: 'Agrale', fipeCode: 2 },
  { name: 'Alfa Romeo', fipeCode: 3 },
  { name: 'AM Gen', fipeCode: 4 },
  { name: 'Asia Motors', fipeCode: 5 },
  { name: 'ASTON MARTIN', fipeCode: 189 },
  { name: 'Audi', fipeCode: 6 },
  { name: 'BMW', fipeCode: 7 },
  { name: 'BRM', fipeCode: 8 },
  { name: 'Buggy', fipeCode: 9 },
  { name: 'Bugre', fipeCode: 123 },
  { name: 'Cadillac', fipeCode: 10 },
  { name: 'CBT Jipe', fipeCode: 11 },
  { name: 'CHANA', fipeCode: 136 },
  { name: 'CHANGAN', fipeCode: 182 },
  { name: 'CHERY', fipeCode: 161 },
  { name: 'Chrysler', fipeCode: 12 },
  { name: 'Citroen', fipeCode: 13 },
  { name: 'Cross Lander', fipeCode: 14 },
  { name: 'Daewoo', fipeCode: 15 },
  { name: 'Daihatsu', fipeCode: 16 },
  { name: 'Dodge', fipeCode: 17 },
  { name: 'EFFA', fipeCode: 147 },
  { name: 'Engesa', fipeCode: 18 },
  { name: 'Envemo', fipeCode: 19 },
  { name: 'Ferrari', fipeCode: 20 },
  { name: 'Fiat', fipeCode: 21 },
  { name: 'Fibravan', fipeCode: 149 },
  { name: 'Ford', fipeCode: 22 },
  { name: 'FOTON', fipeCode: 190 },
  { name: 'Fyber', fipeCode: 170 },
  { name: 'GEELY', fipeCode: 199 },
  { name: 'GM - Chevrolet', fipeCode: 23 },
  { name: 'GREAT WALL', fipeCode: 153 },
  { name: 'Gurgel', fipeCode: 24 },
  { name: 'HAFEI', fipeCode: 152 },
  { name: 'Honda', fipeCode: 25 },
  { name: 'Hyundai', fipeCode: 26 },
  { name: 'Isuzu', fipeCode: 27 },
  { name: 'JAC', fipeCode: 177 },
  { name: 'Jaguar', fipeCode: 28 },
  { name: 'Jeep', fipeCode: 29 },
  { name: 'JINBEI', fipeCode: 154 },
  { name: 'JPX', fipeCode: 30 },
  { name: 'Kia Motors', fipeCode: 31 },
  { name: 'Lada', fipeCode: 32 },
  { name: 'LAMBORGHINI', fipeCode: 171 },
  { name: 'Land Rover', fipeCode: 33 },
  { name: 'Lexus', fipeCode: 34 },
  { name: 'LIFAN', fipeCode: 168 },
  { name: 'LOBINI', fipeCode: 127 },
  { name: 'Lotus', fipeCode: 35 },
  { name: 'Mahindra', fipeCode: 140 },
  { name: 'Maserati', fipeCode: 36 },
  { name: 'Matra', fipeCode: 37 },
  { name: 'Mazda', fipeCode: 38 },
  { name: 'Mercedes-Benz', fipeCode: 39 },
  { name: 'Mercury', fipeCode: 40 },
  { name: 'MG', fipeCode: 167 },
  { name: 'MINI', fipeCode: 156 },
  { name: 'Mitsubishi', fipeCode: 41 },
  { name: 'Miura', fipeCode: 42 },
  { name: 'Nissan', fipeCode: 43 },
  { name: 'Peugeot', fipeCode: 44 },
  { name: 'Plymouth', fipeCode: 45 },
  { name: 'Pontiac', fipeCode: 46 },
  { name: 'Porsche', fipeCode: 47 },
  { name: 'RAM', fipeCode: 185 },
  { name: 'RELY', fipeCode: 186 },
  { name: 'Renault', fipeCode: 48 },
  { name: 'Rolls-Royce', fipeCode: 195 },
  { name: 'Rover', fipeCode: 49 },
  { name: 'Saab', fipeCode: 50 },
  { name: 'Saturn', fipeCode: 51 },
  { name: 'Seat', fipeCode: 52 },
  { name: 'SHINERAY', fipeCode: 183 },
  { name: 'smart', fipeCode: 157 },
  { name: 'SSANGYONG', fipeCode: 125 },
  { name: 'Subaru', fipeCode: 54 },
  { name: 'Suzuki', fipeCode: 55 },
  { name: 'TAC', fipeCode: 165 },
  { name: 'Toyota', fipeCode: 56 },
  { name: 'Troller', fipeCode: 57 },
  { name: 'Volvo', fipeCode: 58 },
  { name: 'VW - VolksWagen', fipeCode: 59 },
  { name: 'Wake', fipeCode: 163 },
  { name: 'Walk', fipeCode: 120 },
];

const VEHICLE_BRANDS_BY_NAME = new Map<string, VehicleBrand>(
  VEHICLE_BRANDS.map((brand) => [brand.name.toLowerCase(), brand]),
);

/** Busca uma marca de veículo pelo nome (case-insensitive). */
export function findVehicleBrand(name: string): VehicleBrand | undefined {
  return VEHICLE_BRANDS_BY_NAME.get(name.toLowerCase());
}

/**
 * Bandeiras aceitas pelo **gerador** de cartão de crédito.
 * O valor de cada entrada é literalmente o que o formulário do 4devs espera
 * no campo `bandeira` (são códigos curtos, diferentes dos usados pelo validador).
 */
export const CREDIT_CARD_GENERATOR_FLAGS = {
  master: 'master',
  visa16: 'visa16',
  amex: 'amex',
  diners: 'diners',
  discover: 'discover',
  enroute: 'enroute',
  jcb: 'jcb',
  voyager: 'voyager',
  hiper: 'hiper',
  aura: 'aura',
} as const;

export type CreditCardGeneratorFlag = keyof typeof CREDIT_CARD_GENERATOR_FLAGS;

/**
 * Bandeiras aceitas pelo **validador** de cartão de crédito.
 * O site usa o nome completo da bandeira (não os códigos curtos do gerador).
 */
export const CREDIT_CARD_VALIDATOR_FLAGS = {
  mastercard: 'MasterCard',
  visa: 'Visa',
  visaElectron: 'Visa Electron',
  americanExpress: 'American Express',
  dinersClub: 'Diners Club',
  discover: 'Discover',
  enroute: 'Enroute',
  jcb: 'JCB',
  maestro: 'Maestro',
  solo: 'Solo',
  switch: 'Switch',
  laserCard: 'LaserCard',
} as const;

export type CreditCardValidatorFlag = keyof typeof CREDIT_CARD_VALIDATOR_FLAGS;

/**
 * Bancos suportados pelo gerador/validador de conta bancária, na mesma
 * ordem do dropdown "Banco" em https://www.4devs.com.br/gerador_conta_bancaria.
 */
export const BANK_ACCOUNT_BANKS = {
  brasil: { code: 2, label: 'Banco do Brasil' },
  bradesco: { code: 121, label: 'Bradesco' },
  citibank: { code: 85, label: 'Citibank' },
  itau: { code: 120, label: 'Itaú' },
  santander: { code: 151, label: 'Santander' },
} as const;

export type BankAccountBank = keyof typeof BANK_ACCOUNT_BANKS;

/** Tipos de certidão aceitos pelo gerador/validador de certidões. */
export const CERTIFICATE_TYPES = {
  any: 'Indiferente',
  birth: 'nascimento',
  wedding: 'casamento',
  religiousWedding: 'casamento_religioso',
  death: 'obito',
} as const;

export type CertificateType = keyof typeof CERTIFICATE_TYPES;
