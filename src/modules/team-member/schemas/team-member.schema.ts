import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeamMemberDocument = HydratedDocument<TeamMember>;

@Schema({ timestamps: true })
export class TeamMember {
  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true })
  startupId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String })
  bio?: string;

  @Prop({ type: String })
  email?: string; // For auto-linking to users

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Auto-populated if email matches existing user

  @Prop({ type: Boolean, default: false })
  isCreator: boolean; // true for the startup creator

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);
