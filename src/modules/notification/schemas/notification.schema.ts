import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationSeverityEnum {
  NEUTRAL = 'neutral',
  SUCCESS = 'success',
  ERROR = 'error',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId })
  startupId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  investorId?: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: NotificationSeverityEnum,
    default: NotificationSeverityEnum.NEUTRAL,
  })
  severity: NotificationSeverityEnum;

  @Prop({ default: false })
  isRead: boolean;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add validation to ensure either startupId or investorId is present
NotificationSchema.pre('save', function (next) {
  if (!this.startupId && !this.investorId) {
    next(new Error('Either startupId or investorId must be provided'));
  }
  if (this.startupId && this.investorId) {
    next(new Error('Cannot provide both startupId and investorId'));
  }
  next();
});
