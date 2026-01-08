
export interface FinancialDataPoint {
  periodo: string;
  receita: number;
  custos: number;
  lucroBruto: number;
  despesas: number;
  ebitda: number;
  lajir?: number; // EBIT
  lair?: number;  // EBT
  lucroLiquido: number;
}

export interface CashFlowPoint {
  periodo: string;
  entrada: number;
  saida: number;
  saldoOperacional: number;
  saldoAcumulado: number;
}

export interface BalancoPatrimonial {
  liquidez: {
    corrente: number;
    seca: number;
    imediata: number;
    geral: number;
  };
  endividamento: {
    geral: number;
    dividaPatrimonio: number;
    composicao: number;
    dividaLiquida: number;
  };
  estrutura: {
    cgl: number;
    ncg: number;
    saldoTesouraria: number;
  };
  eficiencia: {
    giroAtivo: number;
    giroAtivoCirculante: number;
    imobilizacaoPL: number;
  };
  solvencia: {
    alavancagemFinanceira: number;
    dependenciaTerceiros: number;
    coberturaCapitalProprio: number;
  };
  resumoPatrimonial: {
    crescimentoAtivo: number;
    evolucaoPL: number;
    participacaoCaixa: number;
  };
}

export interface FinancialAnalysis {
  id: string;
  clientId: string;
  date: string;
  dre: FinancialDataPoint[];
  fluxoCaixa: CashFlowPoint[];
  balanco?: BalancoPatrimonial;
  kpis: {
    margemBruta: number;
    margemLiquida: number;
    burnRate?: number;
    runway?: number;
    liquidezCorrente?: number;
    endividamento?: number;
    despesasComerciaisPerc?: number;
    despesasAdmPerc?: number;
    eficienciaOperacional?: number;
    margemOperacional?: number;
    margemEbitda?: number;
    pontoEquilibrio?: number;
    alavancagemOperacional?: number;
  };
  insights: string[];
  recommendations: string[];
  taxAnalysis?: string[];
  composition?: { name: string; value: number }[];
  chartNotes?: Record<string, string>;
}

export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cnae: string;
  lastAnalysisDate?: string;
}

export interface User {
  name: string;
  email: string;
  officeName: string;
}
