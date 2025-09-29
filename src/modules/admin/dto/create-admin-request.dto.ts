import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAdminRequestDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsOptional()
  startupId?: string; // Optional, if a startup is making the request

  @IsOptional()
  investorId?: string; // Optional, if an investor is making the request

  @IsNotEmpty()
  @IsString()
  details: string;
}
