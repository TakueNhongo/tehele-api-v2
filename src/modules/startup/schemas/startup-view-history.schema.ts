import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StartupViewHistoryDocument = HydratedDocument<StartupViewHistory>;

@Schema({ timestamps: true })
export class StartupViewHistory {
  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true })
  startupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  investorId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  viewedAt: Date;
}

export const StartupViewHistorySchema =
  SchemaFactory.createForClass(StartupViewHistory);
