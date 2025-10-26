import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StartupDDCacheDocument = HydratedDocument<StartupDDCache>;

@Schema({ timestamps: true })
export class StartupDDCache {
  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true, unique: true })
  startupId: Types.ObjectId;

  @Prop({ type: String, required: true })
  startupName: string;

  @Prop({ type: Object, required: true })
  analysis: any;

  @Prop({ type: Object })
  documentAnalyses: any;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const StartupDDCacheSchema =
  SchemaFactory.createForClass(StartupDDCache);

// Create TTL index for automatic deletion
StartupDDCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
