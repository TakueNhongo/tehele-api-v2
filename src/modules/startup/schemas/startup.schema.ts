import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import {
  BusinessStructureEnum,
  PerformanceHistoryStatusEnum,
} from '../enums/startup.enums';
// TeamMember moved to separate collection

export type StartupDocument = HydratedDocument<Startup>;

export interface FinancialRecordType {
  stage?: string;
  burnRate?: number;
  tractionCustomers?: number;
  tractionRevenue?: number;
  fundingRaised?: number;
  month: string;
  year: string;
  date?: Date;
}

@Schema()
class FinancialRecord {
  @Prop({ type: String, default: null })
  stage?: string;

  @Prop({ type: Number, default: 0 })
  burnRate?: number;

  @Prop({ type: Number, default: 0 })
  tractionCustomers?: number;

  @Prop({ type: Number, default: 0 })
  tractionRevenue?: number;

  @Prop({ type: Number, default: 0 })
  fundingRaised?: number;

  @Prop({ type: String, required: true, min: 1, max: 12 })
  month: string;

  @Prop({ type: String, required: true })
  year: string;

  @Prop({ type: Date, default: Date.now })
  date?: Date;
}

export const FinancialRecordSchema =
  SchemaFactory.createForClass(FinancialRecord);

@Schema({ timestamps: true })
export class Startup {
  @Prop({ required: true, type: String })
  companyName: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String })
  state?: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ required: true, type: String })
  industry: string;

  @Prop({ required: true, type: String })
  foundingYear: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: String })
  productDescription?: string;

  @Prop({ type: String })
  tagline?: string;

  @Prop({ type: String })
  website?: string;

  @Prop({ type: String })
  fundingStage?: string;

  @Prop({
    type: [
      {
        stage: { type: String, default: null },
        burnRate: { type: Number, default: 0 },
        tractionCustomers: { type: Number, default: 0 },
        tractionRevenue: { type: Number, default: 0 },
        fundingRaised: { type: Number, default: 0 },
        // If month should be the full month name, you can adjust minlength/maxlength
        month: { type: String, required: true, minlength: 1, maxlength: 12 },
        year: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  financialHistory: FinancialRecord[];

  @Prop({
    type: [
      {
        stage: { type: String, default: null },
        burnRate: { type: Number, default: 0 },
        tractionCustomers: { type: Number, default: 0 },
        tractionRevenue: { type: Number, default: 0 },
        fundingRaised: { type: Number, default: 0 },
        month: { type: String, required: true, minlength: 1, maxlength: 12 },
        year: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  archivedFinancialHistory: FinancialRecord[];

  @Prop({ type: Boolean, default: false })
  businessVerified: boolean; // Legal entity + financial records verification

  @Prop({ type: Boolean, default: false })
  keyPersonVerified: boolean; // Key person (creator) KYC verification

  @Prop({ type: Boolean, default: false })
  isRejected: boolean; // Overall rejection

  @Prop({ type: String })
  useOfFunds?: string;

  @Prop({ required: true, type: String })
  revenueModel: string;

  @Prop({ type: Number, default: 0 })
  revenue?: number;

  @Prop({ type: Number, default: 0 })
  growthRate?: number;

  @Prop({ type: String })
  stripeCustomerId?: string;

  @Prop({ type: Number })
  fundingRequired?: number;

  @Prop({ type: Number })
  valuation?: number;

  @Prop({ type: Number })
  equityOffering?: number;

  @Prop({ type: String })
  investorBenefits?: string;

  @Prop({ type: String })
  marketOpportunity?: string;

  @Prop({ type: String })
  businessStructure?: string;

  @Prop({ type: String })
  pitchDeckFileId?: string;

  @Prop({ type: String })
  logoFileId?: string;

  @Prop({ type: [String], default: [] })
  dueDiligenceFileIds?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'TeamMember' }],
    default: [],
  })
  team: Types.ObjectId[];

  @Prop({
    enum: PerformanceHistoryStatusEnum,
    default: PerformanceHistoryStatusEnum.IN_REVIEW,
  })
  performanceHistoryStatus?: PerformanceHistoryStatusEnum;
}

export const StartupSchema = SchemaFactory.createForClass(Startup);
