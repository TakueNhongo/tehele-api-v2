import { IsOptional, IsString, IsNumber } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsString()
  lastId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
