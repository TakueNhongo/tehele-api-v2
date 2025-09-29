import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    userId: Types.ObjectId,
    requestedByStartupId?: Types.ObjectId,
    requestedByInvestorId?: Types.ObjectId,
    targetStartupProfileId?: Types.ObjectId,
    targetInvestorProfileId?: Types.ObjectId,
  ) {
    // Ensure at least one valid target exists
    if (!targetStartupProfileId && !targetInvestorProfileId) {
      throw new BadRequestException(
        'You must specify a startup or investor as the appointment target.',
      );
    }

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      requestedByUserId: userId,
      requestedByStartupId: requestedByStartupId || null,
      requestedByInvestorId: requestedByInvestorId || null,
      targetStartupProfileId: targetStartupProfileId || null,
      targetInvestorProfileId: targetInvestorProfileId || null,
      appointmentStatus: 'Pending',
    });

    return await appointment.save();
  }

  async findAll(
    userId: Types.ObjectId,
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
  ) {
    const query: any = {
      $or: [
        { targetStartupProfileId: startupId },
        { targetInvestorProfileId: investorId },
        { requestedByStartupId: startupId },
        { requestedByInvestorId: investorId },
        { requestedByUserId: userId },
      ],
    };

    return await this.appointmentModel
      .find(query)
      .sort({ scheduledDate: 1 }) // Order by closest upcoming appointment
      .exec();
  }

  async findOne(id: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async updateStatus(
    id: string,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    userId: Types.ObjectId,
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
  ) {
    const appointment = await this.findOne(id);

    // Ensure only the appointment requester OR target profile can update status
    if (
      !appointment.requestedByUserId.equals(userId) &&
      (!appointment.requestedByStartupId ||
        !appointment.requestedByStartupId.equals(startupId)) &&
      (!appointment.requestedByInvestorId ||
        !appointment.requestedByInvestorId.equals(investorId)) &&
      (!appointment.targetStartupProfileId ||
        !appointment.targetStartupProfileId.equals(startupId)) &&
      (!appointment.targetInvestorProfileId ||
        !appointment.targetInvestorProfileId.equals(investorId))
    ) {
      throw new BadRequestException(
        'You are not allowed to update this appointment.',
      );
    }

    appointment.appointmentStatus = updateAppointmentStatusDto.status;
    return await appointment.save();
  }

  async cancel(
    id: string,
    userId: Types.ObjectId,
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
  ) {
    return this.updateStatus(
      id,
      { status: 'Cancelled' },
      userId,
      startupId,
      investorId,
    );
  }
}
