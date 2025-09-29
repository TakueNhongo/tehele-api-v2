import { IsEnum } from 'class-validator';
import { MessageStatusEnum } from '../enums/message.enums';

export class UpdateMessageDto {
  @IsEnum(MessageStatusEnum)
  status: MessageStatusEnum;
}
