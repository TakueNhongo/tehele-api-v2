import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { FundingStageEnum } from 'src/modules/startup/enums/startup.enums';
import {
  ExternalInvestorDto,
  PlatformInvestmentDto,
} from './funding-history-types';

export class CreateFundingHistoryDto {
  @ApiProperty({ example: '60c72b2f9fd3c33a5dce8d1b' }) // Example Startup ID
  @IsString()
  startupId: string;

  @ApiProperty({ enum: FundingStageEnum })
  @IsEnum(FundingStageEnum)
  stage: FundingStageEnum;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  amountRaised: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  valuation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  externalInvestors?: ExternalInvestorDto[];

  @ApiProperty({ example: '2024-03-01T00:00:00.000Z' })
  @IsString()
  fundingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  platformInvestments?: PlatformInvestmentDto[];
}
