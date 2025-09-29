import { IsEnum } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsEnum(['Confirmed', 'Cancelled'])
  status: 'Confirmed' | 'Cancelled';
}
