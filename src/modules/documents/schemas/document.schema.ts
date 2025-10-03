import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

export type DocumentDocument = Document & MongoDocument;

export enum DocumentCategoryEnum {
  FINANCIALS = 'financials',
  LEGAL = 'legal',
  OPERATIONS = 'operations',
  PITCH_DECK = 'pitch_deck',
}

export enum CompanyStage {
  IDEA = 'idea',
  PRE_SEED = 'pre_seed',
  SEED = 'seed',
  SERIES_A = 'series_a',
  SERIES_B_PLUS = 'series_b_plus',
}

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: DocumentCategoryEnum })
  category: DocumentCategoryEnum;

  @Prop({ required: true, enum: CompanyStage })
  companyStage: CompanyStage;

  @Prop({ type: String })
  fileId?: string;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: String })
  coverImageId?: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
