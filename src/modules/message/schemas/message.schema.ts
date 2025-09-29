import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageStatusEnum, ProfileTypeEnum } from '../enums/message.enums';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverUserId: Types.ObjectId;

  @Prop({ type: String, enum: ProfileTypeEnum, required: true })
  senderProfileType: ProfileTypeEnum;

  @Prop({ type: String, enum: ProfileTypeEnum, required: true })
  receiverProfileType: ProfileTypeEnum;

  // New sender/receiver fields based on profile type
  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  senderStartupProfileId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  senderInvestorProfileId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  receiverStartupProfileId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  receiverInvestorProfileId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: String,
    enum: MessageStatusEnum,
    default: MessageStatusEnum.PENDING,
  })
  status: MessageStatusEnum;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Boolean, default: false })
  deletedForSender: boolean;

  @Prop({ type: Boolean, default: false })
  deletedForReceiver: boolean;

  @Prop({ type: String })
  threadId: string; // Composite of both profile IDs sorted and joined
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for optimized queries
MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ senderStartupProfileId: 1, status: 1 });
MessageSchema.index({ senderInvestorProfileId: 1, status: 1 });
MessageSchema.index({ receiverStartupProfileId: 1, status: 1 });
MessageSchema.index({ receiverInvestorProfileId: 1, status: 1 });
