import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ChatMessage, ChatMessageSchema } from './chat-message.schema';

export type ChatConversationDocument = ChatConversation & MongoDocument;

@Schema({ timestamps: true })
export class ChatConversation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Startup' })
  startupId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  sessionId: string;
}

export const ChatConversationSchema =
  SchemaFactory.createForClass(ChatConversation);
