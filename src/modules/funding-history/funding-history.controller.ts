import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Req,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FundingHistoryService } from './funding-history.service';
import { CreateFundingHistoryDto } from './dto/create-funding-history.dto';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('funding-history')
export class FundingHistoryController {
  constructor(private readonly fundingService: FundingHistoryService) {}

  @Post('create')
  async createFunding(
    @Req() req: RequestWithUser,
    @Body() dto: CreateFundingHistoryDto,
  ) {
    return this.fundingService.createFundingHistory(
      dto,
      req.user._id,
      req.profileId,
    );
  }

  @Get('startup/:startupId')
  async getFundingHistory(@Param('startupId') startupId: string) {
    return this.fundingService.getFundingHistoryByStartup(startupId);
  }

  @Put('verify/:fundingId')
  async verifyFunding(@Param('fundingId') fundingId: string) {
    return this.fundingService.verifyFunding(fundingId);
  }

  @Delete(':fundingId')
  async deleteFunding(
    @Param('fundingId') fundingId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user) {
      throw new BadRequestException('User not found in request');
    }
    return this.fundingService.deleteFundingHistory(fundingId, req.user.id);
  }
}
