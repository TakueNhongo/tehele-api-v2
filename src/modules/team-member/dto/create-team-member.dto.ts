import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsMongoId,
} from 'class-validator';

export class CreateTeamMemberDto {
  @IsMongoId()
  startupId: string;

  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isCreator?: boolean;
}
