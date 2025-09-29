import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Put,
  Delete,
} from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('investment')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post('create')
  async createInvestment(
    @Req() req: RequestWithUser,
    @Body() investmentData: any,
  ) {
    return this.investmentService.createInvestment({
      ...investmentData,
      investorId: req.profileId,
    });
  }

  @Get('investor')
  async getInvestorInvestments(@Req() req: RequestWithUser) {
    return this.investmentService.getInvestmentsByInvestor(req.profileId);
  }

  @Get('startup/:startupId')
  async getStartupInvestments(@Param('startupId') startupId: string) {
    return this.investmentService.getInvestmentsByStartup(startupId);
  }

  @Get(':id')
  async getInvestment(@Param('id') id: string) {
    return this.investmentService.getInvestmentById(id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.investmentService.updateInvestmentStatus(id, status);
  }

  @Put(':id/verify')
  async verifyInvestment(@Param('id') id: string) {
    return this.investmentService.verifyInvestment(id);
  }

  @Delete(':id')
  async deleteInvestment(@Param('id') id: string) {
    return this.investmentService.deleteInvestment(id);
  }
}
