import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InvestmentPreference,
  InvestmentStageEnum,
  InvestmentTypeEnum,
  InvolvementLevelEnum,
} from '../schemas/investor.types';

// Investment Preference DTO
export class InvestmentPreferenceDto implements InvestmentPreference {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  minAmount: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  maxAmount: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @IsOptional()
  ticketSize?: number;
}

// Create Investor DTO
export class CreateInvestorDto {
  @ApiPropertyOptional({ example: 'XYZ Capital' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'Managing Partner' })
  @IsString()
  role: string;

  @ApiProperty({ type: InvestmentPreferenceDto })
  @ValidateNested()
  @Type(() => InvestmentPreferenceDto)
  investmentPreference: InvestmentPreferenceDto;

  @ApiProperty({ enum: InvestmentStageEnum, example: InvestmentStageEnum.SEED })
  @IsEnum(InvestmentStageEnum)
  preferredInvestmentStage: InvestmentStageEnum;

  @ApiProperty({ example: ['Fintech', 'AI'] })
  @IsArray()
  @IsString({ each: true })
  preferredIndustries: string[];

  @ApiPropertyOptional({
    enum: InvestmentTypeEnum,
    example: InvestmentTypeEnum.EQUITY,
  })
  @IsOptional()
  @IsEnum(InvestmentTypeEnum)
  investmentType?: InvestmentTypeEnum;

  @ApiProperty({ example: false })
  @IsBoolean()
  leadInvestor: boolean;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  totalCapitalAvailable: number;

  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @IsNumber()
  currentFundSize?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  expectedROI?: number;

  @ApiPropertyOptional({
    enum: InvolvementLevelEnum,
    example: InvolvementLevelEnum.BOARD_SEAT,
  })
  @IsOptional()
  @IsEnum(InvolvementLevelEnum)
  involvementLevel?: InvolvementLevelEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accreditationFileId?: string;

  @ApiPropertyOptional({ example: ['legalDoc1Id', 'legalDoc2Id'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  legalDocuments?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoFileId?: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'California' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  city: string;
}

// Update Investor DTO
export class UpdateInvestorDto extends PartialType(CreateInvestorDto) {}
