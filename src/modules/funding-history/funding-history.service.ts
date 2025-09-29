import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FundingHistory,
  FundingHistoryDocument,
} from './schemas/funding-history.schema';
import { CreateFundingHistoryDto } from './dto/create-funding-history.dto';

@Injectable()
export class FundingHistoryService {
  constructor(
    @InjectModel(FundingHistory.name)
    private fundingModel: Model<FundingHistoryDocument>,
  ) {}

  async createFundingHistory(
    dto: CreateFundingHistoryDto,
    userId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<FundingHistory> {
    return this.fundingModel.create({ ...dto, recordedBy: userId, startupId });
  }

  async getFundingHistoryByStartup(
    startupId: string,
  ): Promise<FundingHistory[]> {
    return this.fundingModel.find({ startupId });
  }

  async verifyFunding(fundingId: string): Promise<FundingHistory> {
    const funding = await this.fundingModel.findById(fundingId);
    if (!funding) throw new NotFoundException('Funding history not found');

    funding.isVerified = true;
    return funding.save();
  }

  async deleteFundingHistory(
    fundingId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const funding = await this.fundingModel.findById(fundingId);

    if (!funding) {
      throw new NotFoundException('Funding history not found');
    }

    if (funding.isVerified) {
      throw new BadRequestException('Cannot delete a verified funding entry');
    }

    if (funding.recordedBy.toString() !== userId) {
      throw new UnauthorizedException(
        'You are not allowed to delete this funding entry',
      );
    }

    await this.fundingModel.deleteOne({ _id: fundingId });
    return { message: 'Funding history entry deleted successfully' };
  }
}
