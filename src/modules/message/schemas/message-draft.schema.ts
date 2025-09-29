import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProfileTypeEnum } from '../enums/message.enums';

export type MessageDraftDocument = HydratedDocument<MessageDraft>;

@Schema({ timestamps: true })
export class MessageDraft {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'profileType' })
  profileId: Types.ObjectId;

  @Prop({ type: String, enum: ProfileTypeEnum, required: true })
  profileType: ProfileTypeEnum;

  @Prop({ type: Types.ObjectId, refPath: 'receiverProfileType' })
  receiverProfileId?: Types.ObjectId;

  @Prop({ type: String, enum: ProfileTypeEnum })
  receiverProfileType?: ProfileTypeEnum;

  @Prop({ type: String })
  subject?: string;

  @Prop({ type: String })
  content?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const MessageDraftSchema = SchemaFactory.createForClass(MessageDraft);
