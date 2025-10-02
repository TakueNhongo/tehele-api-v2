import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { KYCDocumentType } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @Length(6, 50)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is authorized to work in the country',
  })
  @IsOptional()
  isAuthorizedToWorkInCountry?: boolean;
}
