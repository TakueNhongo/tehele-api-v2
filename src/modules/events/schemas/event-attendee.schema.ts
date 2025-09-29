import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EventAttendeeDocument = HydratedDocument<EventAttendee>;

@Schema({ timestamps: true })
export class EventAttendee {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  attendeeStartupId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  attendeeInvestorId?: Types.ObjectId;
}

export const EventAttendeeSchema = SchemaFactory.createForClass(EventAttendee);
