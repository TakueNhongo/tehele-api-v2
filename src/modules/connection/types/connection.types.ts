import { Types } from 'mongoose';
import {
  ConnectionStatusEnum,
  ConnectionInitiatorTypeEnum,
  ConnectionInitiationMethodEnum,
} from '../enums/connection.enums';

export interface ConnectionResponse {
  _id: Types.ObjectId;
  investorId: Types.ObjectId;
  startupId: Types.ObjectId;
  status: ConnectionStatusEnum;
  initiatorType: ConnectionInitiatorTypeEnum;
  initiationMethod: ConnectionInitiationMethodEnum;
  createdAt: Date;
  updatedAt: Date;
}
