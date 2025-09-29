import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StartupViewHistory,
  StartupViewHistoryDocument,
} from '../schemas/startup-view-history.schema';

@Injectable()
export class StartupViewHistoryService {
  constructor(
    @InjectModel(StartupViewHistory.name)
    private startupViewHistoryModel: Model<StartupViewHistoryDocument>,
  ) {}

  async recordView(
    startupId: string,
    investorId: string,
  ): Promise<StartupViewHistory> {
    const viewHistory = new this.startupViewHistoryModel({
      startupId,
      investorId,
      viewedAt: new Date(),
    });
    return viewHistory.save();
  }

  async getInvestorViewedStartups(
    investorId: string,
  ): Promise<StartupViewHistory[]> {
    return this.startupViewHistoryModel
      .find({ investorId })
      .sort({ viewedAt: -1 })
      .populate('startupId')
      .exec();
  }
}
