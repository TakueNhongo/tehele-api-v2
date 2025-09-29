import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Types } from 'mongoose';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Create an appointment request
   */
  @Post('create')
  @ApiOperation({ summary: 'Request an appointment' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.appointmentsService.create(
      createAppointmentDto,
      req.user._id,
      req.profileType === 'startup' ? req.profileId : undefined,
      req.profileType === 'investor' ? req.profileId : undefined,
      new Types.ObjectId(createAppointmentDto.targetStartupProfileId),
      new Types.ObjectId(createAppointmentDto.targetInvestorProfileId),
    );
  }

  /**
   * Get all appointments for a user (either investor or startup)
   */
  @Get()
  @ApiOperation({ summary: 'View all booked appointments' })
  async findAll(@Req() req: RequestWithUser) {
    return this.appointmentsService.findAll(
      req.user._id,
      req.profileType === 'startup' ? req.profileId : undefined,
      req.profileType === 'investor' ? req.profileId : undefined,
    );
  }

  /**
   * Get appointment details by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'View appointment details' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  /**
   * Confirm an appointment (can be confirmed by the startup or investor)
   */
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm an appointment' })
  async confirm(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      updateDto,
      req.user._id,
      req.profileType === 'startup' ? req.profileId : undefined,
      req.profileType === 'investor' ? req.profileId : undefined,
    );
  }

  /**
   * Cancel an appointment (can be cancelled by the requester or target)
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancel(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.appointmentsService.cancel(
      id,
      req.user._id,
      req.profileType === 'startup' ? req.profileId : undefined,
      req.profileType === 'investor' ? req.profileId : undefined,
    );
  }
}
