import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvestorDDCacheDocument = HydratedDocument<InvestorDDCache>;

@Schema({ timestamps: true })
export class InvestorDDCache {
  @Prop({ type: Types.ObjectId, ref: 'Investor', required: true, unique: true })
  investorId: Types.ObjectId;

  @Prop({ type: String, required: true })
  investorName: string;

  @Prop({ type: Object, required: true })
  analysis: any;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const InvestorDDCacheSchema =
  SchemaFactory.createForClass(InvestorDDCache);

// Create TTL index for automatic deletion
InvestorDDCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
