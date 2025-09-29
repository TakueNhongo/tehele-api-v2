import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PerformanceEntry {
  @IsString()
  @IsOptional()
  month: string;

  @IsString()
  @IsOptional()
  date: string;

  @IsString()
  @IsOptional()
  investor?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  year?: string;

  @IsNumber()
  @IsOptional()
  burnRate?: number;

  @IsNumber()
  @IsOptional()
  tractionCustomers?: number;

  @IsNumber()
  @IsOptional()
  tractionRevenue?: number;

  @IsNumber()
  @IsOptional()
  fundingRaised?: number;
}

export class UpdatePerformanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceEntry)
  data: PerformanceEntry[];

  @IsOptional()
  @IsBoolean()
  skipStatusChange?: boolean;
}
