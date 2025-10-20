import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Investor,
  InvestorDocument,
} from '../investor/schemas/investor.schema';
import { Startup, StartupDocument } from '../startup/schemas/startup.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { PerformanceHistoryStatusEnum } from '../startup/enums/startup.enums';
import { NotificationService } from '../notification/notification.service';
import { NotificationSeverityEnum } from '../notification/schemas/notification.schema';
import {
  Investment,
  InvestmentDocument,
} from '../investment/schemas/investment.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    @InjectModel(Startup.name) private startupModel: Model<StartupDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async getDashboardStats() {
    const [
      totalInvestors,
      totalStartups,
      pendingInvestorVerifications,
      pendingStartupVerifications,
      upcomingEvents,
    ] = await Promise.all([
      this.investorModel.countDocuments(),
      this.startupModel.countDocuments(),
      this.investorModel.countDocuments({
        isVerified: false,
        isRejected: false,
      }),
      this.startupModel.countDocuments({
        isVerified: false,
        isRejected: false,
      }),
      this.eventModel.countDocuments({ startDate: { $gte: new Date() } }),
    ]);

    return {
      investors: totalInvestors,
      startups: totalStartups,
      pendingVerifications:
        pendingInvestorVerifications + pendingStartupVerifications,
      upcomingEvents,
    };
  }

  async getStartupsWithPendingPerformanceChanges(): Promise<StartupDocument[]> {
    const results = await this.startupModel
      .find({
        performanceHistoryStatus: PerformanceHistoryStatusEnum.IN_REVIEW,
      })
      .populate('createdBy');

    return results;
  }

  async getAllInvestors() {
    return this.investorModel.find().populate('createdBy');
  }

  async getInvestorById(id: string) {
    const investor = await this.investorModel
      .findById(id)
      .populate('createdBy');
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }

  async verifyInvestor(id: string) {
    const updatedInvestor = await this.investorModel
      .findByIdAndUpdate(
        id,
        { isVerified: true, isRejected: false },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedInvestor) throw new NotFoundException('Investor not found');

    // Create notification for investor verification
    await this.notificationService.createNotification(
      null, // no startupId
      updatedInvestor._id,
      'Your investor profile has been verified successfully!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedInvestor;
  }

  async rejectInvestor(id: string) {
    const updatedInvestor = await this.investorModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, isRejected: true },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedInvestor) throw new NotFoundException('Investor not found');

    // Create notification for investor rejection
    await this.notificationService.createNotification(
      null, // no startupId
      updatedInvestor._id,
      'Your investor profile verification has been rejected. Please update your information and try again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedInvestor;
  }

  async getAllStartups() {
    return this.startupModel.find().populate('createdBy');
  }

  async getStartupById(id: string) {
    const startup = await this.startupModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email');
    if (!startup) throw new NotFoundException('Startup not found');
    return startup;
  }

  async verifyStartup(id: string) {
    const updatedStartup = await this.startupModel
      .findByIdAndUpdate(
        id,
        { businessVerified: true, isRejected: false },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedStartup) throw new NotFoundException('Startup not found');

    // Create notification for startup verification
    await this.notificationService.createNotification(
      updatedStartup._id,
      null, // no investorId
      'Your startup profile has been verified successfully!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedStartup;
  }

  async approveStartupPerformanceChanges(
    startupId: string,
  ): Promise<StartupDocument> {
    const startup = await this.startupModel.findById(startupId);
    if (!startup) {
      throw new NotFoundException('Startup not found');
    }
    startup.performanceHistoryStatus = PerformanceHistoryStatusEnum.ACCEPTED;
    await startup.save();

    // Create notification for performance changes approval
    await this.notificationService.createNotification(
      startup._id,
      null, // no investorId
      'Your performance changes have been approved and updated successfully.',
      NotificationSeverityEnum.SUCCESS,
    );

    return startup;
  }

  async rejectAllPerformanceChanges(
    startupId: string,
  ): Promise<StartupDocument> {
    const startup = await this.startupModel.findById(startupId);
    if (!startup) {
      throw new NotFoundException('Startup not found');
    }

    startup.performanceHistoryStatus = PerformanceHistoryStatusEnum.REJECTED;
    await startup.save();

    // Create notification for performance changes rejection
    await this.notificationService.createNotification(
      startup._id,
      null, // no investorId
      'Your performance changes have been rejected. Please review and submit again.',
      NotificationSeverityEnum.ERROR,
    );

    return startup;
  }

  async rejectStartup(id: string) {
    const updatedStartup = await this.startupModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, isRejected: true },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedStartup) throw new NotFoundException('Startup not found');

    // Create notification for startup rejection
    await this.notificationService.createNotification(
      updatedStartup._id,
      null, // no investorId
      'Your startup profile verification has been rejected. Please update your information and try again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedStartup;
  }

  async createAdmin(createAdminDto: any): Promise<UserDocument> {
    const admin = new this.userModel({
      ...createAdminDto,
      isAdmin: true, // Ensure the user is marked as admin
    });
    return admin.save();
  }

  async getAllAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ isAdmin: true }).exec();
  }

  async getAdminById(id: string): Promise<UserDocument> {
    const admin = await this.userModel
      .findOne({ _id: id, isAdmin: true })
      .exec();
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found`);
    }
    return admin;
  }

  async deleteAdmin(id: string): Promise<{ message: string }> {
    const admin = await this.userModel
      .findOneAndDelete({ _id: id, isAdmin: true })
      .exec();
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found`);
    }
    return { message: 'Admin deleted successfully' };
  }

  // Investment Management Methods
  async getAllInvestments() {
    return this.investmentModel
      .find()
      .populate({
        path: 'investorId',
        populate: {
          path: 'createdBy',
        },
      })
      .populate('startupId')
      .exec();
  }

  async getInvestmentById(id: string) {
    const investment = await this.investmentModel
      .findById(id)
      .populate('investorId')
      .populate('startupId')
      .exec();
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  async verifyInvestment(id: string) {
    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        { isVerified: true, status: 'approved' },
        { new: true },
      )
      .populate('investorId')
      .populate('startupId')
      .exec();

    if (!updatedInvestment) throw new NotFoundException('Investment not found');

    // Create notification for investment verification
    await this.notificationService.createNotification(
      updatedInvestment.startupId,
      updatedInvestment.investorId,
      'Your investment has been verified and approved!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedInvestment;
  }

  async rejectInvestment(id: string) {
    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, status: 'rejected' },
        { new: true },
      )
      .populate('investorId')
      .populate('startupId')
      .exec();

    if (!updatedInvestment) throw new NotFoundException('Investment not found');

    // Create notification for investment rejection
    await this.notificationService.createNotification(
      updatedInvestment.startupId,
      updatedInvestment.investorId,
      'Your investment has been rejected. Please review and submit again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedInvestment;
  }

  async getPendingInvestments() {
    return this.investmentModel
      .find({ status: 'pending' })
      .populate('investorId')
      .populate('startupId')
      .exec();
  }

  async getVerifiedInvestments() {
    return this.investmentModel
      .find({ isVerified: true })
      .populate('investorId')
      .populate('startupId')
      .exec();
  }

  async createInvestment(createInvestmentDto: any) {
    try {
      const result = await this.investmentModel.create({
        ...createInvestmentDto,
        investorId: new Types.ObjectId(
          createInvestmentDto.investorId as string,
        ),
        startupId: new Types.ObjectId(createInvestmentDto.startupId as string),
      });
      return result;
    } catch (e) {
      console.log(e.message);
      throw new InternalServerErrorException(e);
    }
  }
}
