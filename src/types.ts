import type {
  BankAccountBank,
  CertificateType,
  CreditCardGeneratorFlag,
  CreditCardValidatorFlag,
  UFCode,
} from './consts.js';

/** Entrada de explicação de um status HTTP, incluída no pacote. */
export interface HttpCodeExplain {
  code: string;
  why: string;
}

/**
 * Envelope de resposta padrão devolvido por **todas** as funções deste
 * módulo (geradores e validadores).
 */
export interface FourDevsResult<T> {
  /** Data/hora (ISO 8601) em que a resposta foi processada. */
  date: string;
  /** `true` quando a chamada foi bem-sucedida e `data` está preenchido. */
  success: boolean;
  /** Status HTTP da resposta (ou `0` em caso de falha de rede/timeout). */
  status: number;
  /** Explicação do status HTTP, extraída da tabela embutida no pacote. */
  explain: HttpCodeExplain | undefined;
  /** Mensagem de erro legível, presente somente quando `success` é `false`. */
  error: string | null;
  /** Dado processado. `null` quando `success` é `false`. */
  data: T | null;
  /**
   * De onde `data` veio: `"network"` quando obtido do 4devs.com.br, ou
   * `"local"` quando gerado/validado localmente porque a requisição ao
   * 4devs falhou (veja `warning` para o motivo).
   */
  source: 'network' | 'local';
  /**
   * Presente quando `source` é `"local"`: explica por que o modo de
   * contingência foi usado e, para validadores sem algoritmo nacional
   * único (RG, título de eleitor, inscrição estadual, certidão, conta
   * bancária), avisa que a checagem local é apenas de formato.
   */
  warning: string | null;
}

/** Opções comuns de timeout aceitas por toda função que faz requisição HTTP. */
export interface RequestTimeoutOption {
  /** Timeout da requisição, em milissegundos. Padrão: 15000. */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export type Sex = 'M' | 'F' | 'random';

export interface PeopleOptions extends RequestTimeoutOption {
  /** Quantas pessoas gerar. Mínimo 1, máximo 30. Padrão: 1. */
  n?: number;
  /** Sexo das pessoas geradas. Padrão: `"random"`. */
  sex?: Sex;
  /** Idade das pessoas geradas (18 a 80). Padrão: aleatória. */
  age?: number;
  /** Restringe a geração a um estado específico. Padrão: qualquer estado. */
  uf?: UFCode;
  /** Inclui pontuação (CPF, telefone, CEP...) nos dados gerados. Padrão: `true`. */
  formatting?: boolean;
}

/** Um registro de pessoa fictícia completo, gerado pela ferramenta "Gerador de Pessoas". */
export interface FakePerson {
  nome: string;
  idade: number;
  cpf: string;
  rg: string;
  data_nasc: string;
  sexo: string;
  signo: string;
  mae: string;
  pai: string;
  email: string;
  senha: string;
  cep: string;
  endereco: string;
  numero: number;
  bairro: string;
  cidade: string;
  estado: string;
  telefone_fixo: string;
  celular: string;
  altura: string;
  peso: number;
  tipo_sanguineo: string;
  cor: string;
  [key: string]: unknown;
}

export interface CpfOptions extends RequestTimeoutOption {
  /** Restringe o CPF gerado a um estado de emissão específico. Padrão: qualquer. */
  uf?: UFCode;
  /** Inclui pontuação (`000.000.000-00`). Padrão: `true`. */
  formatting?: boolean;
}

export interface FormattingOptions extends RequestTimeoutOption {
  /** Inclui pontuação no dado gerado. Padrão: `true`. */
  formatting?: boolean;
}

export interface VoterTitleOptions extends RequestTimeoutOption {
  /** Estado de emissão do título de eleitor (obrigatório). */
  uf: UFCode;
}

export interface StateRegistrationOptions extends RequestTimeoutOption {
  /** Estado da inscrição estadual. Padrão: `"SP"`. */
  uf?: UFCode;
  /** Inclui pontuação. Padrão: `true`. */
  formatting?: boolean;
}

export interface CertificateOptions extends RequestTimeoutOption {
  /** Tipo de certidão a gerar. Padrão: `"any"` (indiferente). */
  type?: CertificateType;
  /** Inclui pontuação. Padrão: `true`. */
  formatting?: boolean;
}

export interface BankAccountOptions extends RequestTimeoutOption {
  /** Banco da conta. Padrão: `"random"` (qualquer um dos suportados). */
  bank?: BankAccountBank | 'random';
  /** Restringe a agência/conta a um estado específico. Padrão: qualquer. */
  uf?: UFCode;
}

/** Dados de conta bancária, extraídos do fragmento HTML retornado pelo 4devs. */
export type BankAccountInfo = Record<string, string>;

export interface CreditCardOptions extends RequestTimeoutOption {
  /** Bandeira do cartão. Padrão: aleatória entre as suportadas pelo gerador. */
  flag?: CreditCardGeneratorFlag;
  /** Inclui pontuação/espaçamento no número do cartão. Padrão: `true`. */
  formatting?: boolean;
}

/** Dados de cartão de crédito, extraídos do fragmento HTML retornado pelo 4devs. */
export type CreditCardInfo = Record<string, string>;

export interface VehicleOptions extends RequestTimeoutOption {
  /** Nome da marca (ex.: `"Fiat"`, `"Toyota"`). Padrão: aleatória. */
  brand?: string;
  /** Restringe a placa/UF do veículo. Padrão: qualquer. */
  uf?: UFCode;
  /** Inclui pontuação. Padrão: `true`. */
  formatting?: boolean;
}

/** Dados de veículo, extraídos do fragmento HTML retornado pelo 4devs. */
export type VehicleInfo = Record<string, string>;

export interface VehicleBrandOptions {
  /** Quantas marcas sortear (1 a 87). Padrão: 1. */
  n?: number;
}

export interface VehiclePlateOptions extends RequestTimeoutOption {
  /** Restringe a placa a um estado específico. Padrão: qualquer. */
  uf?: UFCode;
  /** Inclui o traço (padrão antigo: `ABC-1234`). Padrão: `true`. */
  formatting?: boolean;
}

export interface CompanyOptions extends RequestTimeoutOption {
  /** Estado da empresa. Padrão: `"SP"`. */
  uf?: UFCode;
  /** Tempo de existência da empresa, em anos (1 a 30). Padrão: 1. */
  age?: number;
  /** Inclui pontuação. Padrão: `true`. */
  formatting?: boolean;
}

/** Dados de empresa, extraídos do fragmento HTML retornado pelo 4devs. */
export type CompanyInfo = Record<string, string>;

export interface CityOptions extends RequestTimeoutOption {
  /** Estado do qual listar as cidades. Padrão: `"SP"`. */
  uf?: UFCode;
}

export interface UfOptions {
  /** Quantos códigos de UF sortear (1 a 27). Padrão: 1. */
  n?: number;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/** Resultado da validação de um documento/dado. */
export interface ValidationResult {
  /** `true` quando o 4devs reconheceu o dado como válido. */
  isValid: boolean;
  /** Texto bruto (sem tags) devolvido pelo validador, para depuração/log. */
  raw: string;
}

export interface StateRegistrationValidationOptions extends RequestTimeoutOption {
  uf: UFCode;
  code: string;
}

export interface BankAccountValidationOptions extends RequestTimeoutOption {
  bank: BankAccountBank;
  agency: string;
  account: string;
}

export interface CreditCardValidationOptions extends RequestTimeoutOption {
  flag: CreditCardValidatorFlag;
  code: string;
}
