import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'profile_picture_file_id', required: false })
  @IsOptional()
  @IsString()
  profilePictureFileId?: string;

  @ApiProperty({ example: 'currentP@ssw0rd', required: false })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ example: 'newP@ssw0rd', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
