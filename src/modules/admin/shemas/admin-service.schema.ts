import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminServiceDocument = HydratedDocument<AdminService>;

@Schema({ timestamps: true })
export class AdminService {
  @Prop({ required: true, unique: true })
  title: string; // Service title (e.g., "Legal Consultation")

  @Prop({ required: true })
  description: string; // Detailed service description

  @Prop({ default: true })
  isActive: boolean; // Whether the service is currently available
}

export const AdminServiceSchema = SchemaFactory.createForClass(AdminService);
