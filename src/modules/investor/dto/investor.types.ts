import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class InvestmentPreferenceDto {
  @ApiPropertyOptional({ example: 'Fintech' })
  @IsString()
  industry: string;

  @ApiPropertyOptional({ example: 'Series A' })
  @IsString()
  stage: string;

  @ApiPropertyOptional({ example: 'North America' })
  @IsOptional()
  @IsString()
  geography?: string;
}

export class InvestmentStrategyDto {
  @ApiPropertyOptional({ example: 100000 })
  @IsNumber()
  minInvestmentSize: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsNumber()
  maxInvestmentSize: number;

  @ApiPropertyOptional({ example: 'Equity' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  leadInvestor: boolean;

  @ApiPropertyOptional({ example: 'Hands-on' })
  @IsString()
  involvementLevel: string;
}

export class LegalComplianceDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  isAccredited: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  backgroundCheckCompleted: boolean;

  @ApiPropertyOptional({ example: '12345-XYZ' })
  @IsOptional()
  @IsString()
  taxId?: string;
}
