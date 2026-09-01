/**
 * fordev-native/local/generators
 * --------------------------------
 * Geração de dados inteiramente local (sem nenhuma requisição de rede).
 *
 * Usada como modo de contingência pelas funções de `generators.ts` quando o
 * 4devs.com.br está fora do ar, mas também exportada como `local.generators`
 * para quem quiser gerar dados garantidamente offline, de propósito.
 *
 * Onde existe uma regra de dígito verificador nacional real (CPF, CNPJ,
 * PIS/PASEP, RENAVAM, CNH, cartão de crédito), ela é aplicada de verdade —
 * os documentos "fecham" nos mesmos algoritmos usados para validação. Para o
 * resto (nomes, endereços, cidades, dados de empresa...) é uma composição
 * simples a partir de listas pequenas embutidas no pacote.
 */

import { UF_CODES, VEHICLE_BRANDS, BANK_ACCOUNT_BANKS, CREDIT_CARD_GENERATOR_FLAGS, CERTIFICATE_TYPES, findVehicleBrand } from '../consts.js';
import type {
  BankAccountInfo, BankAccountOptions, CertificateOptions, CityOptions, CompanyInfo,
  CompanyOptions, CpfOptions, CreditCardInfo, CreditCardOptions, FakePerson,
  FormattingOptions, PeopleOptions, StateRegistrationOptions, VehicleInfo,
  VehicleOptions, VehiclePlateOptions, VoterTitleOptions,
} from '../types.js';
import {
  formatCnpj, formatCpf, formatPisPasep, generateCardDigits, generateCnhDigits,
  generateCnpjDigits, generateCpfDigits, generatePisDigits, generateRenavamDigits,
} from './checksums.js';
import {
  BLOOD_TYPES, COMPANY_ACTIVITIES, COMPANY_SUFFIXES, EYE_HAIR_COLORS,
  FIRST_NAMES_FEMALE, FIRST_NAMES_MALE, NEIGHBORHOODS, SAMPLE_CITIES_BY_UF,
  STREET_NAMES, STREET_PREFIXES, SURNAMES, randomInt, randomItem,
} from './data.js';
import {
  formatCertificate, formatRg, generateAccountNumber, generateAgency,
  generateCertificateDigits, generateChassis, generatePlate, generateRgDigits,
  generateStateRegistrationDigits, generateVoterTitleDigits,
} from './plausible.js';

import { randomDigitString } from './secureRandom.js';

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function digitString(length: number): string {
  return randomDigitString(length);
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

const ZODIAC_RANGES: Array<[number, number, number, number, string]> = [
  [3, 21, 4, 19, 'Áries'], [4, 20, 5, 20, 'Touro'], [5, 21, 6, 20, 'Gêmeos'],
  [6, 21, 7, 22, 'Câncer'], [7, 23, 8, 22, 'Leão'], [8, 23, 9, 22, 'Virgem'],
  [9, 23, 10, 22, 'Libra'], [10, 23, 11, 21, 'Escorpião'], [11, 22, 12, 21, 'Sagitário'],
  [1, 20, 2, 18, 'Aquário'], [2, 19, 3, 20, 'Peixes'],
];

function zodiacSign(day: number, month: number): string {
  for (const [m1, d1, m2, d2, name] of ZODIAC_RANGES) {
    if ((month === m1 && day >= d1) || (month === m2 && day <= d2) || (month > m1 && month < m2)) return name;
  }
  return 'Capricórnio'; // 22 dez – 19 jan (atravessa o fim do ano)
}

function cityFor(uf: string): string {
  return randomItem(SAMPLE_CITIES_BY_UF[uf] ?? ['Cidade Exemplo']);
}

export function people(options: PeopleOptions = {}): FakePerson[] {
  const n = clamp(options.n ?? 1, 1, 30);
  const formatting = options.formatting !== false;
  const uf = options.uf || randomItem(UF_CODES);

  return Array.from({ length: n }, () => {
    const sex = options.sex === 'M' || options.sex === 'F' ? options.sex : randomItem(['M', 'F'] as const);
    const firstName = sex === 'M' ? randomItem(FIRST_NAMES_MALE) : randomItem(FIRST_NAMES_FEMALE);
    const surname1 = randomItem(SURNAMES);
    const surname2 = randomItem(SURNAMES);
    const nome = `${firstName} ${surname1} ${surname2}`;

    const age = options.age && options.age > 0 ? options.age : randomInt(18, 80);
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = randomInt(1, 12);
    const birthDay = randomInt(1, 28);

    const cpfDigits = generateCpfDigits();
    const rgDigits = generateRgDigits();

    const person: FakePerson = {
      nome,
      idade: age,
      cpf: formatting ? formatCpf(cpfDigits) : cpfDigits.join(''),
      rg: formatting ? formatRg(rgDigits) : rgDigits,
      data_nasc: `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}/${birthYear}`,
      sexo: sex === 'M' ? 'Masculino' : 'Feminino',
      signo: zodiacSign(birthDay, birthMonth),
      mae: `${randomItem(FIRST_NAMES_FEMALE)} ${randomItem(SURNAMES)}`,
      pai: `${randomItem(FIRST_NAMES_MALE)} ${randomItem(SURNAMES)}`,
      email: `${slugify(firstName)}.${slugify(surname1)}${randomInt(1, 999)}@exemplo.com`,
      senha: digitString(4) + slugify(surname2).slice(0, 4),
      cep: `${digitString(5)}-${digitString(3)}`,
      endereco: `${randomItem(STREET_PREFIXES)} ${randomItem(STREET_NAMES)}`,
      numero: randomInt(1, 2000),
      bairro: randomItem(NEIGHBORHOODS),
      cidade: cityFor(uf),
      estado: uf,
      telefone_fixo: `(${randomInt(11, 99)}) ${digitString(4)}-${digitString(4)}`,
      celular: `(${randomInt(11, 99)}) 9${digitString(4)}-${digitString(4)}`,
      altura: `1,${randomInt(50, 99)}`,
      peso: randomInt(50, 120),
      tipo_sanguineo: randomItem(BLOOD_TYPES),
      cor: randomItem(EYE_HAIR_COLORS),
    };

    return person;
  });
}

export function cpf(options: CpfOptions = {}): string {
  const digits = generateCpfDigits();
  return options.formatting === false ? digits.join('') : formatCpf(digits);
}

export function cnpj(options: FormattingOptions = {}): string {
  const digits = generateCnpjDigits();
  return options.formatting === false ? digits.join('') : formatCnpj(digits);
}

export function rg(options: FormattingOptions = {}): string {
  const raw = generateRgDigits();
  return options.formatting === false ? raw : formatRg(raw);
}

export function cnh(): string {
  return generateCnhDigits().join('');
}

export function pisPasep(options: FormattingOptions = {}): string {
  const digits = generatePisDigits();
  return options.formatting === false ? digits.join('') : formatPisPasep(digits);
}

export function renavam(): string {
  return generateRenavamDigits().join('');
}

export function voterTitle(options: VoterTitleOptions): string {
  return generateVoterTitleDigits(options.uf);
}

export function stateRegistration(options: StateRegistrationOptions = {}): string {
  return generateStateRegistrationDigits();
}

export function certificate(options: CertificateOptions = {}): string {
  const raw = generateCertificateDigits();
  const type = options.type ?? 'any';
  void CERTIFICATE_TYPES[type]; // valida que o tipo existe (lança fora se não)
  return options.formatting === false ? raw : formatCertificate(raw);
}

export function bankAccount(options: BankAccountOptions = {}): BankAccountInfo {
  const bankKeys = Object.keys(BANK_ACCOUNT_BANKS) as Array<keyof typeof BANK_ACCOUNT_BANKS>;
  const bankKey = options.bank && options.bank !== 'random' ? options.bank : randomItem(bankKeys);
  const bank = BANK_ACCOUNT_BANKS[bankKey];
  const uf = options.uf || randomItem(UF_CODES);

  return {
    Banco: `${bank.code} - ${bank.label}`,
    Agência: generateAgency(),
    Conta: generateAccountNumber(),
    Cidade: cityFor(uf),
    Estado: uf,
  };
}

export function creditCard(options: CreditCardOptions = {}): CreditCardInfo {
  const flagKeys = Object.keys(CREDIT_CARD_GENERATOR_FLAGS) as Array<keyof typeof CREDIT_CARD_GENERATOR_FLAGS>;
  const flag = options.flag ?? randomItem(flagKeys);
  const digits = generateCardDigits(16).join('');
  const formatting = options.formatting !== false;
  const expYear = new Date().getFullYear() + randomInt(1, 6);

  return {
    Bandeira: flag,
    Número: formatting ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : digits,
    Validade: `${String(randomInt(1, 12)).padStart(2, '0')}/${expYear}`,
    CVV: digitString(3),
  };
}

export function vehicle(options: VehicleOptions = {}): VehicleInfo {
  const brand = (options.brand && findVehicleBrand(options.brand)) || randomItem(VEHICLE_BRANDS);
  const uf = options.uf || randomItem(UF_CODES);

  return {
    Marca: brand.name,
    Modelo: `${brand.name.toUpperCase()} ${randomInt(1, 4)}.${randomInt(0, 9)}`,
    'Ano Modelo': String(randomInt(2005, new Date().getFullYear())),
    Placa: generatePlate(true),
    Renavam: generateRenavamDigits().join(''),
    Chassi: generateChassis(),
    Cor: randomItem(['Branco', 'Preto', 'Prata', 'Vermelho', 'Azul']),
    Estado: uf,
  };
}

export function vehiclePlate(options: VehiclePlateOptions = {}): string {
  return generatePlate(true);
}

export function company(options: CompanyOptions = {}): CompanyInfo {
  const uf = options.uf || 'SP';
  const cnpjDigits = generateCnpjDigits();
  const formatting = options.formatting !== false;

  return {
    'Razão Social': `${randomItem(COMPANY_ACTIVITIES)} ${randomItem(SURNAMES)} ${randomItem(COMPANY_SUFFIXES)}`,
    CNPJ: formatting ? formatCnpj(cnpjDigits) : cnpjDigits.join(''),
    'Inscrição Estadual': generateStateRegistrationDigits(),
    CEP: `${digitString(5)}-${digitString(3)}`,
    Endereço: `${randomItem(STREET_PREFIXES)} ${randomItem(STREET_NAMES)}, ${randomInt(1, 2000)}`,
    Bairro: randomItem(NEIGHBORHOODS),
    Cidade: cityFor(uf),
    Estado: uf,
  };
}

export function city(options: CityOptions = {}): string[] {
  const uf = options.uf || 'SP';
  return SAMPLE_CITIES_BY_UF[uf] ?? [];
}

export const localGenerators = {
  people, cpf, cnpj, rg, cnh, pisPasep, renavam, voterTitle, stateRegistration,
  certificate, bankAccount, creditCard, vehicle, vehiclePlate, company, city,
};

export default localGenerators;
