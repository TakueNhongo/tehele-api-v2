import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investor, InvestorDocument } from './schemas/investor.schema';
import { CreateInvestorDto, UpdateInvestorDto } from './dto/investor.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class InvestorService {
  constructor(
    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async createInvestorProfile(
    dto: CreateInvestorDto,
    userId: Types.ObjectId,
  ): Promise<InvestorDocument> {
    try {
      // Create the investor profile
      const investor = await this.investorModel.create({
        ...dto,
        createdBy: userId,
      });

      // Update user's investor profile association
      await this.userService.updateUserInvestorProfile(userId, investor._id);

      return investor;
    } catch (error) {
      console.error('Error creating investor profile:', error);
      throw new InternalServerErrorException(
        'Failed to create investor profile',
      );
    }
  }

  async findByIds(investorIds: Types.ObjectId[]): Promise<Investor[]> {
    if (!investorIds.length) return [];

    return this.investorModel
      .find({
        _id: { $in: investorIds },
        isActive: true,
      })
      .select(
        'companyName role preferredIndustries preferredInvestmentStage investmentPreference totalCapitalAvailable leadInvestor',
      )
      .populate('createdBy', 'firstName lastName profilePictureId')
      .lean()
      .exec();
  }

  async getInvestorById(investorId: Types.ObjectId): Promise<Investor> {
    const investor = await this.investorModel
      .findOne({
        _id: investorId,
        isRejected: false,
        isActive: true,
      })
      .populate('createdBy', 'firstName lastName profilePictureId')
      .lean()
      .exec();

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    return investor;
  }

  async getPublicInvestorProfile(
    profileId: Types.ObjectId,
  ): Promise<Partial<Investor>> {
    const investor = await this.investorModel
      .findById(profileId)
      .select(
        '-accreditationFileId -backgroundCheckFileId -legalDocuments -isVerified',
      )
      .lean()
      .exec();

    if (!investor) throw new NotFoundException('Investor profile not found');
    return investor;
  }

  async getInvestorProfile(profileId: Types.ObjectId): Promise<Investor> {
    const investor = await this.investorModel.findById(profileId);
    if (!investor) throw new NotFoundException('Investor profile not found');

    return investor;
  }

  async getInvestorProfileForAuth(
    profileId: Types.ObjectId,
  ): Promise<Investor> {
    const investor = await this.investorModel.findById(profileId);

    return investor;
  }

  async updateInvestorProfile(
    profileId: Types.ObjectId,
    dto: UpdateInvestorDto,
  ): Promise<Investor> {
    return this.investorModel.findOneAndUpdate({ _id: profileId }, dto, {
      new: true,
    });
  }

  async patchMany(): Promise<any> {
    return this.investorModel.updateMany(
      {},
      {
        city: 'Fairbanks',
        state: 'Alaska',
        country: 'United States',
      },
    );
  }

  async verifyInvestor(investorId: string): Promise<Investor> {
    const investor = await this.investorModel.findById(investorId);
    if (!investor) throw new NotFoundException('Investor profile not found');

    investor.isVerified = true;
    return investor.save();
  }
}
