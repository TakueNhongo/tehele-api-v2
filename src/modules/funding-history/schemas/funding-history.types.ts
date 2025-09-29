export class ExternalInvestor {
  name: string; // Investor or Firm name
  firm?: string; // Optional investor firm
  amount: number; // Amount invested
}

export class PlatformInvestment {
  investorId: string; // Reference to the Investor on the platform
  amount: number; // Amount invested
  investmentType: string; // Equity, Convertible Notes, etc.
  description?: string; // Optional details about the investment
}
