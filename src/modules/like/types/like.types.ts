import { Types } from 'mongoose';

export interface LikeResponse {
  _id: Types.ObjectId;
  investorId: Types.ObjectId;
  startupId: Types.ObjectId;
  status: string;
  createdAt: Date;
}
