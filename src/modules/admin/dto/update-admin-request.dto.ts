import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminRequestDto } from './create-admin-request.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAdminRequestDto extends PartialType(CreateAdminRequestDto) {
  @IsNotEmpty()
  @IsString()
  status: 'Pending' | 'Approved' | 'Rejected';
}
