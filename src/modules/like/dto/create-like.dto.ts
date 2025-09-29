import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateLikeDto {
  @IsMongoId()
  startupId: Types.ObjectId;
}
