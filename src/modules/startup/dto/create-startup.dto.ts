import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import {
  FundingStageEnum,
  BusinessStructureEnum,
} from '../enums/startup.enums';
import { TeamMember } from '../types/startup.types';
import { FinancialRecordType } from '../schemas/startup.schema';

export class CreateStartupDto {
  @ApiProperty({ example: 'TechCorp' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'High demand for SaaS platforms' })
  @IsString()
  marketOpportunity: string;

  @ApiProperty({ example: '50% of profits' })
  @IsString()
  investorBenefits: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  industry: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'California', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  city: string;

  @ApiProperty({ example: '2021' })
  @IsString()
  foundingYear: string;

  @ApiProperty({ example: 'We build AI-powered financial tools.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Fast AI powered tools' })
  @IsString()
  tagline: string;

  @IsString()
  productDescription: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsArray()
  team?: TeamMember[];

  @ApiProperty({ enum: FundingStageEnum, required: false })
  @IsOptional()
  @IsEnum(FundingStageEnum)
  fundingStage?: FundingStageEnum;

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  financialHistory?: FinancialRecordType[];

  @ApiProperty({ required: false, example: 500000 })
  @IsOptional()
  @IsNumber()
  fundingRaised?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  useOfFunds?: string;

  @ApiProperty({ example: 'Subscription-based revenue model' })
  @IsString()
  revenueModel: string;

  @ApiProperty({ required: false, example: 1000000 })
  @IsOptional()
  @IsNumber()
  revenue?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  growthRate?: number;

  @ApiProperty({ required: false, example: 1000000 })
  @IsOptional()
  @IsNumber()
  fundingRequired?: number;

  @ApiProperty({ required: false, example: 5000000 })
  @IsOptional()
  @IsNumber()
  valuation?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  equityOffering?: number;

  @ApiProperty({ enum: BusinessStructureEnum, required: false })
  @IsOptional()
  @IsEnum(BusinessStructureEnum)
  businessStructure?: BusinessStructureEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pitchDeckFileId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoFileId?: string;
}
