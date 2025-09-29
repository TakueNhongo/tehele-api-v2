import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminRequestDocument = HydratedDocument<AdminRequest>;

@Schema({ timestamps: true })
export class AdminRequest {
  @Prop({ type: Types.ObjectId, ref: 'AdminService', required: true })
  serviceId: Types.ObjectId; // The service being requested

  @Prop({ type: Types.ObjectId, ref: 'Startup' })
  requestedByStartupId?: Types.ObjectId; // If requested by a startup

  @Prop({ type: Types.ObjectId, ref: 'Investor' })
  requestedByInvestorId?: Types.ObjectId; // If requested by an investor

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedByUserId: Types.ObjectId; // The user who submitted the request

  @Prop({ required: true })
  details: string; // Additional information about the request

  @Prop({ enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' })
  status: string; // Status of the request
}

export const AdminRequestSchema = SchemaFactory.createForClass(AdminRequest);
