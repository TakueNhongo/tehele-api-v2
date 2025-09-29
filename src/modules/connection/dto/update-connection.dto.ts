import { IsEnum } from 'class-validator';
import { ConnectionStatusEnum } from '../enums/connection.enums';

export class UpdateConnectionDto {
  @IsEnum(ConnectionStatusEnum)
  status: ConnectionStatusEnum;
}
