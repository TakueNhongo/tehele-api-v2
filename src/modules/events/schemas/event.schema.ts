import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { EventCategoryEnum, EventTypeEnum } from '../enums/event.enums';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true })
  coverImage: string;

  @Prop({ required: true, enum: EventTypeEnum })
  type: EventTypeEnum;

  @Prop({
    required: true,
    enum: EventCategoryEnum,
    default: EventCategoryEnum.OTHER,
  })
  category: EventCategoryEnum;

  @Prop({ required: true })
  location: string; // If in-person, the physical location; If Zoom, a Zoom link or meeting ID

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  zoomMeetingId?: string; // Required if type is Zoom

  // New Fields for Better Context
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Startup' })
  createdByStartupId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Investor' })
  createdByInvestorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdByUserId: Types.ObjectId; // User who created the event

  @Prop({ default: 0 })
  attendeeCount: number; // Tracks total number of attendees
}

export const EventSchema = SchemaFactory.createForClass(Event);
