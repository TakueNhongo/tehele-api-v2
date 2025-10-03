import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { StartupService } from './startup.service';
import { CreateStartupDto } from './dto/create-startup.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { UpdateStartupDto } from './dto/update-startup.dto';
import { Public } from 'src/decorators/public.decorator';
import { UpdatePerformanceDto } from './dto/update-performance.dto';

@Controller('startup')
export class StartupController {
  constructor(private readonly startupService: StartupService) {}

  @Post('create')
  async create(
    @Req() req: RequestWithUser,
    @Body() createStartupDto: CreateStartupDto,
  ) {
    const startup = await this.startupService.createStartup(
      createStartupDto,
      req.user._id,
      req.user.email,
    );

    // Return in the same format as the register endpoint for consistency
    return {
      user: req.user,
      startup: startup,
      token: req.headers.authorization?.replace('Bearer ', ''), // Pass through the existing token
    };
  }

  @Public()
  @Get('verified')
  async getVerifiedStartups(@Query('limit') limit?: number) {
    return this.startupService.getVerifiedStartups(limit);
  }

  @Get('/linked-investors')
  async getLinkedInvestors(@Req() req: RequestWithUser) {
    return this.startupService.getLinkedInvestors(req.profileId);
  }

  @Get('/insights/investor')
  async getInvestorInsights(
    @Query('investorId') investorId?: string,
    @Query('startupId') startupId?: string,
  ) {
    return this.startupService.generateInvestorInsights(startupId, investorId);
  }

  @Get('/investor/viewed')
  async getInvestorViewedStartups(@Req() req: RequestWithUser) {
    return this.startupService.getInvestorViewedStartups(
      req.profileId.toString(),
    );
  }

  @Public()
  @Get(':id/insights/startup')
  async getStartupInsights(@Param('id') id: string) {
    return this.startupService.generateStartupInsights(id);
  }

  @Public()
  @Get(':id/insights/market-research')
  async getMarketResearch(@Param('id') id: string) {
    return this.startupService.generateMarketResearch(id);
  }

  @Public()
  @Get(':id/insights/readiness')
  async getFundingReadiness(@Param('id') id: string) {
    return this.startupService.generateFundingReadiness(id);
  }

  @Get(':id')
  @Public()
  async getStartup(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.startupService.getStartupById(
      id,
      req.profileType === 'investor' ? req.profileId : null,
    );
  }

  @Put('performance/pending')
  async submitPerformanceChange(
    @Body() updatePerformanceDto: UpdatePerformanceDto,
    @Req() req: RequestWithUser, // Optionally check that req.user owns the startup
  ) {
    return this.startupService.submitPerformanceChange(
      req.profileId.toString(),
      updatePerformanceDto,
    );
  }

  @Put('update')
  async updateStartup(
    @Req() req: RequestWithUser,
    @Body() updateDto: UpdateStartupDto,
  ) {
    return this.startupService.updateStartup(req.profileId, updateDto);
  }
}
