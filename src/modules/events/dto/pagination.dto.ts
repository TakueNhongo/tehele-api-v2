import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventTypeEnum, EventCategoryEnum } from '../enums/event.enums';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'ID of the last event received' })
  @IsString()
  @IsOptional()
  lastEventId?: string;

  @IsBoolean()
  @IsOptional()
  isSnippet?: boolean;

  @ApiPropertyOptional({
    description: 'Number of events to return',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}

export class EventFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: EventTypeEnum,
    description: 'Filter by event type',
  })
  @IsEnum(EventTypeEnum)
  @IsOptional()
  type?: EventTypeEnum;

  @ApiPropertyOptional({
    enum: EventCategoryEnum,
    description: 'Filter by event category',
  })
  @IsEnum(EventCategoryEnum)
  @IsOptional()
  category?: EventCategoryEnum;

  @ApiPropertyOptional({
    enum: ['week', 'month'],
    description: 'Filter by time period',
  })
  @IsEnum(['week', 'month'])
  @IsOptional()
  timePeriod?: string;
}
