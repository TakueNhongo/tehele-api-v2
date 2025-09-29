import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsMongoId,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsMongoId()
  targetInvestorProfileId?: string; // The investor profile being targeted for the appointment

  @IsNotEmpty()
  @IsMongoId()
  targetStartupProfileId?: string; // The startup profile being targeted for the appointment

  @IsNotEmpty()
  @IsString()
  timezone: string;

  @IsNotEmpty()
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  meetingLink?: string; // Zoom, Google Meet, etc.

  @IsOptional()
  @IsString()
  meetingDetails?: string; // Alternative physical location or instructions
}
