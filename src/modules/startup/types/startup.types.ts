export class TeamMember {
  name: string;
  role: string;
  bio: string;
  email?: string;
}

// Add this new interface
export interface FundingRound {
  investor: string;
  amount: number;
  month: number;
  year: number;
  stage: string;
  _id?: string;
}
