import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class TeamMemberDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CTO' })
  @IsString()
  role: string;

  @ApiPropertyOptional({
    example: 'Technology expert with 10 years experience.',
  })
  @IsString()
  bio: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/johndoe' })
  @IsOptional()
  @IsString()
  linkedin?: string;
}
