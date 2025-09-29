import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExternalInvestor, PlatformInvestment } from './funding-history.types';
import { FundingStageEnum } from 'src/modules/startup/enums/startup.enums';

export type FundingHistoryDocument = HydratedDocument<FundingHistory>;

@Schema({ timestamps: true })
export class FundingHistory {
  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true })
  startupId: Types.ObjectId; // The startup receiving funding

  @Prop({ required: true, enum: FundingStageEnum })
  stage: FundingStageEnum;

  @Prop({ required: true })
  amountRaised: number;

  @Prop({ required: true })
  fundingDate: Date; // Provided by the startup/investor

  @Prop()
  valuation?: number;

  @Prop({ type: [ExternalInvestor] })
  externalInvestors?: ExternalInvestor[]; // Logged by startups

  @Prop({ type: [PlatformInvestment] })
  platformInvestments?: PlatformInvestment[]; // Logged by investors

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId; // ID of user who recorded this entry

  @Prop({ type: Types.ObjectId, ref: 'Investor', default: null })
  investorId?: Types.ObjectId; // If logged by an investor, they are the only investor in this round

  @Prop({ default: false })
  isVerified: boolean; // Admin approval status
}

export const FundingHistorySchema =
  SchemaFactory.createForClass(FundingHistory);
