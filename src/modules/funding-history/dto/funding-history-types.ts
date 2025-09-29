import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ExternalInvestorDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'XYZ Ventures' })
  @IsOptional()
  @IsString()
  firm?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsNumber()
  amount: number;
}

export class PlatformInvestmentDto {
  @ApiPropertyOptional({ example: '60c72b2f9fd3c33a5dce8d1b' }) // Example ID
  @IsString()
  investorId: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsNumber()
  amount: number;
}
