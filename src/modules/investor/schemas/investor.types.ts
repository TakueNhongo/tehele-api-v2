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
  CONVERTIBLE_NOTE = 'Convertible Note',
  SAFE = 'SAFE',
  DEBT = 'Debt',
  OTHER = 'Other',
}

export enum InvolvementLevelEnum {
  BOARD_SEAT = 'Board Seat',
  ADVISORY = 'Advisory',
  PASSIVE = 'Passive',
  HANDS_ON = 'Hands-on',
  OTHER = 'Other',
}

export interface InvestmentPreference {
  minAmount: number;
  maxAmount: number;
  ticketSize?: number;
}
