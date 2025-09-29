import {
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { EventTypeEnum, EventCategoryEnum } from '../enums/event.enums';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  coverImage: string;

  @IsEnum(EventTypeEnum)
  type: EventTypeEnum;

  @IsEnum(EventCategoryEnum)
  category: EventCategoryEnum;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsOptional()
  @IsString()
  zoomMeetingId?: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
