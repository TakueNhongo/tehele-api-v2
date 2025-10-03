export enum InvestmentStageEnum {
  SEED = 'Seed',
  EARLY = 'Early Stage',
  GROWTH = 'Growth Stage',
  LATE = 'Late Stage',
  PRE_IPO = 'Pre-IPO',
  ALL = 'All Stages',
}

export enum InvestmentTypeEnum {
  EQUITY = 'Equity',
  LOAN = 'Loan',
  SAFE = 'SAFE',
}

export enum InvolvementLevelEnum {
  BOARD_SEAT = 'Board Seat',
  ADVISORY = 'Advisory',
  PASSIVE = 'Passive',
  HANDS_ON = 'Hands-on',
  OTHER = 'Other',
}

export enum InvestmentLevelEnum {
  EQUITY = 'Equity',
  LOAN = 'Loan',
  SAFE = 'SAFE',
}

export interface InvestmentPreference {
  minAmount: number;
  maxAmount: number;
  ticketSize?: number;
}
