import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InvestmentStageEnum } from '../../investor/schemas/investor.types';

export type InvestmentDocument = HydratedDocument<Investment>;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'Investor', required: true })
  investorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true })
  startupId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number, required: true })
  equityPercentage: number;

  @Prop({ type: String, required: true })
  stage: string;

  @Prop({ type: Date, default: Date.now })
  investmentDate: Date;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);
