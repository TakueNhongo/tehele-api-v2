import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import { Types } from 'mongoose';

@Injectable()
export class InvestmentService {
  constructor(
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
  ) {}

  async createInvestment(investmentData: Partial<Investment>) {
    const investment = new this.investmentModel(investmentData);
    return investment.save();
  }

  async getInvestmentsByInvestor(investorId: Types.ObjectId) {
    return this.investmentModel
      .find({ investorId: new Types.ObjectId(investorId) })
      .populate('startupId')
      .exec();
  }

  async getInvestmentsByStartup(startupId: string) {
    return this.investmentModel
      .find({ startupId: new Types.ObjectId(startupId) })
      .populate('investorId')
      .exec();
  }

  async getInvestmentById(id: string) {
    return this.investmentModel
      .findById(id)
      .populate('investorId')
      .populate('startupId')
      .exec();
  }

  async updateInvestmentStatus(id: string, status: string) {
    return this.investmentModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async verifyInvestment(id: string) {
    return this.investmentModel
      .findByIdAndUpdate(id, { isVerified: true }, { new: true })
      .exec();
  }

  async deleteInvestment(id: string) {
    return this.investmentModel.findByIdAndDelete(id).exec();
  }
}
