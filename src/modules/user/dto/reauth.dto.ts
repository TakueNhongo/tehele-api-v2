import { IsEmail, IsString, MinLength } from 'class-validator';

export class ReAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
