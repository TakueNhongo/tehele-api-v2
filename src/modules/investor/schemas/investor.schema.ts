import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  InvestmentTypeEnum,
  InvolvementLevelEnum,
  InvestmentPreference,
} from './investor.types';

export type InvestorDocument = HydratedDocument<Investor>;

@Schema({ timestamps: true })
export class Investor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  companyName?: string;

  @Prop({ type: String, required: true })
  role: string;

  @Prop({
    type: {
      minAmount: { type: Number, required: true },
      maxAmount: { type: Number, required: true },
      ticketSize: { type: Number },
    },
    required: true,
  })
  investmentPreference: InvestmentPreference;

  @Prop({ type: String, required: true })
  preferredInvestmentStage: string;

  @Prop({ type: [String], required: true, default: [] })
  preferredIndustries: string[];

  @Prop({ type: String, enum: InvestmentTypeEnum, default: null })
  investmentType?: InvestmentTypeEnum;

  @Prop({ type: Boolean, default: false })
  leadInvestor: boolean;

  @Prop({ type: Number, required: true })
  totalCapitalAvailable: number;

  @Prop({ type: Number, default: null })
  currentFundSize?: number;

  @Prop({ type: Number, default: null })
  expectedROI?: number;

  @Prop({ type: String, enum: InvolvementLevelEnum, default: null })
  involvementLevel?: InvolvementLevelEnum;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isRejected: boolean; // Email verification

  @Prop({ type: String, default: null })
  accreditationFileId?: string;

  @Prop({ type: [String], default: [] })
  legalDocuments?: string[];

  @Prop({ type: String })
  country?: string;

  @Prop({ type: String })
  state?: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  stripeCustomerId?: string;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);
