import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

export type DocumentDocument = Document & MongoDocument;

export enum DocumentCategoryEnum {
  PITCH_DECKS = 'pitch_decks',
  LEGAL_DOCUMENTS = 'legal_documents',
  FINANCIAL_MODELS = 'financial_models',
  BUSINESS_PLANS = 'business_plans',
  MARKET_RESEARCH = 'market_research',
  OPERATIONAL = 'operational',
  FUNDRAISING = 'fundraising',
  COMPLIANCE = 'compliance',
}

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: DocumentCategoryEnum })
  category: DocumentCategoryEnum;

  @Prop({ type: String })
  fileId?: string;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: Number, default: 0 })
  viewCount: number;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
