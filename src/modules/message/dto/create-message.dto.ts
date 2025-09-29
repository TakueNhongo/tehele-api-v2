import {
  IsMongoId,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { ProfileTypeEnum } from '../enums/message.enums';

export class CreateMessageDto {
  @IsEnum(ProfileTypeEnum)
  receiverProfileType: ProfileTypeEnum;

  @IsString()
  @IsOptional()
  receiverStartupProfileId?: string;

  @IsString()
  @IsOptional()
  receiverInvestorProfileId?: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
