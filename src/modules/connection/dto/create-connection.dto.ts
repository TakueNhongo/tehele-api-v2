import { IsMongoId, IsEnum } from 'class-validator';
import { Types } from 'mongoose';
import { ConnectionInitiationMethodEnum } from '../enums/connection.enums';

export class CreateConnectionDto {
  @IsMongoId()
  startupId: Types.ObjectId;

  @IsEnum(ConnectionInitiationMethodEnum)
  initiationMethod: ConnectionInitiationMethodEnum;
}
