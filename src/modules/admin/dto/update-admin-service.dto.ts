import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminServiceDto } from './create-admin-service.dto';

export class UpdateAdminServiceDto extends PartialType(CreateAdminServiceDto) {}
