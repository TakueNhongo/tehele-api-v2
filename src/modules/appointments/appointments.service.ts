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
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationService } from '../notification/notification.service';
import { StartupService } from '../startup/startup.service';
import { UserService } from '../user/user.service';
import { NotificationSeverityEnum } from '../notification/schemas/notification.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly mailerService: MailerService,
    private readonly notificationService: NotificationService,
    private readonly startupService: StartupService,
    private readonly userService: UserService,
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

  async createExpertAccess(
    createAppointmentDto: {
      date: Date;
      timezone: string;
      consultationType: string;
      message: string;
    },
    userId: Types.ObjectId,
    requestedByStartupId?: Types.ObjectId,
    requestedByInvestorId?: Types.ObjectId,
  ) {
    // Get user and startup details for notifications
    const user = await this.userService.findById(userId.toString());
    let startupDetails = null;

    if (requestedByStartupId) {
      startupDetails = await this.startupService.getStartupById(
        requestedByStartupId.toString(),
      );
    }

    // Send email to admins
    await this.sendExpertAccessEmailToAdmins(
      user,
      startupDetails,
      createAppointmentDto,
    );

    // Create notification for the startup
    if (requestedByStartupId) {
      await this.notificationService.createNotification(
        requestedByStartupId,
        undefined,
        'We have received your request for expert access and we will be in touch soon!',
        NotificationSeverityEnum.SUCCESS,
      );
    }

    return { message: 'Expert access request submitted successfully' };
  }

  private async sendExpertAccessEmailToAdmins(
    user: any,
    startupDetails: any,
    appointmentData: CreateAppointmentDto,
  ) {
    const adminEmails = ['mctaruk@gmail.com', 'cindyfossouooo@gmail.com']; // Add your admin emails here

    const emailContent = this.getExpertAccessEmailTemplate(
      user,
      startupDetails,
      appointmentData,
    );

    for (const adminEmail of adminEmails) {
      try {
        await this.mailerService.sendMail({
          to: adminEmail,
          subject: 'New Expert Access Request - Tehele',
          html: emailContent,
        });
      } catch (error) {
        console.error(
          `Failed to send expert access email to ${adminEmail}:`,
          error,
        );
      }
    }
  }

  private getExpertAccessEmailTemplate(
    user: any,
    startupDetails: any,
    appointmentData: CreateAppointmentDto,
  ): string {
    const startupName = startupDetails?.companyName || 'N/A';
    const userName = `${user.firstName} ${user.lastName}`;
    const userEmail = user.email;
    // Format the date in a human-friendly way, e.g., "April 5, 2024"
    const appointmentDate = new Date(appointmentData.date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Expert Access Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #bb9375; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Expert Access Request</h1>
          </div>
          <div class="content">
            <h2>Request Details</h2>
            <div class="info-row">
              <span class="label">Startup Name:</span> ${startupName}
            </div>
            <div class="info-row">
              <span class="label">Contact Person:</span> ${userName}
            </div>
            <div class="info-row">
              <span class="label">Email Address:</span> ${userEmail}
            </div>
            <div class="info-row">
              <span class="label">Requested Date:</span> ${appointmentDate}
            </div>
            <div class="info-row">
              <span class="label">Timezone:</span> ${appointmentData.timezone}
            </div>
            ${
              appointmentData.meetingDetails
                ? `
            <div class="info-row">
              <span class="label">Additional Details:</span> ${appointmentData.meetingDetails}
            </div>
            `
                : ''
            }
          </div>
          <div class="footer">
            <p>Please review and respond to this expert access request.</p>
            <p>© 2025 Tehele. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
