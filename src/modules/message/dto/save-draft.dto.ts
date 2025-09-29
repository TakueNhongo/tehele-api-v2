import { IsMongoId, IsString, IsArray, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class SaveDraftDto {
  @IsMongoId()
  @IsOptional()
  receiverProfileId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
