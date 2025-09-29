import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { LikeStatusEnum } from '../enums/like.enums';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: true })
export class Like {
  @Prop({
    type: Types.ObjectId,
    ref: 'Investor',
    required: true,
  })
  investorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Startup',
    required: true,
  })
  startupId: Types.ObjectId;

  @Prop({
    type: String,
    enum: LikeStatusEnum,
    default: LikeStatusEnum.ACTIVE,
  })
  status: LikeStatusEnum;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Compound index to ensure unique likes
LikeSchema.index({ investorId: 1, startupId: 1 }, { unique: true });
