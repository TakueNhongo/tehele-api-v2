import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ConnectionStatusEnum,
  ConnectionInitiatorTypeEnum,
  ConnectionInitiationMethodEnum,
} from '../enums/connection.enums';

export type ConnectionDocument = HydratedDocument<Connection>;

@Schema({ timestamps: true })
export class Connection {
  @Prop({ type: Types.ObjectId, ref: 'Investor', required: true })
  investorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Startup', required: true })
  startupId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ConnectionStatusEnum,
    default: ConnectionStatusEnum.PENDING,
  })
  status: ConnectionStatusEnum;

  @Prop({
    type: String,
    enum: ConnectionInitiatorTypeEnum,
    required: true,
  })
  initiatorType: ConnectionInitiatorTypeEnum;

  @Prop({
    type: String,
    enum: ConnectionInitiationMethodEnum,
    required: true,
  })
  initiationMethod: ConnectionInitiationMethodEnum;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

// Compound index to ensure unique connections
ConnectionSchema.index({ investorId: 1, startupId: 1 }, { unique: true });
