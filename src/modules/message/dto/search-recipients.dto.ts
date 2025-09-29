// dto/search-recipients.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class SearchRecipientsDto {
  @IsOptional()
  @IsString()
  search?: string;
}
