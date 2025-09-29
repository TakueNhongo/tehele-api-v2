import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true })
export class Appointment {
  /** The startup or investor profile that is being requested for the appointment */
  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  targetInvestorProfileId?: Types.ObjectId; // The investor being requested for a meeting

  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  targetStartupProfileId?: Types.ObjectId; // The startup being requested for a meeting

  /** The user profile that initiated the appointment request */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedByUserId: Types.ObjectId; // The user who made the appointment request

  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  requestedByStartupId?: Types.ObjectId; // If a startup initiated the appointment

  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  requestedByInvestorId?: Types.ObjectId; // If an investor initiated the appointment

  /** Time & Meeting Information */
  @Prop({ required: true })
  timezone: string; // Timezone of the appointment requester

  @Prop({ required: true })
  scheduledDate: Date; // Single confirmed appointment date

  @Prop()
  virtualMeetingLink?: string; // Zoom, Google Meet, etc.

  @Prop()
  inPersonMeetingDetails?: string; // Alternative physical location or instructions

  /** Status Management */
  @Prop({ enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' })
  appointmentStatus: string; // Status of the appointment

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
