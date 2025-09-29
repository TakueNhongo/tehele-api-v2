import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminServiceDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
