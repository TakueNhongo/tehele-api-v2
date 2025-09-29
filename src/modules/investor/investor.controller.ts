import { Controller, Post, Get, Put, Body, Param, Req } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { CreateInvestorDto, UpdateInvestorDto } from './dto/investor.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Types } from 'mongoose';
import { Public } from 'src/decorators/public.decorator';

@Controller('investor')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Post('create')
  async createInvestor(
    @Req() req: RequestWithUser,
    @Body() dto: CreateInvestorDto,
  ) {
    const investor = await this.investorService.createInvestorProfile(
      dto,
      req.user.id,
    );

    // Return in the same format as the register endpoint for consistency
    return {
      user: req.user,
      investor: investor,
      token: req.headers.authorization?.replace('Bearer ', ''), // Pass through the existing token
    };
  }

  //

  @Public()
  @Get('update')
  async upMany() {
    return this.investorService.patchMany();
  }

  @Get('me')
  async getInvestorProfile(@Req() req: RequestWithUser) {
    return this.investorService.getInvestorProfile(req.profileId);
  }

  @Put('update')
  async updateInvestor(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateInvestorDto,
  ) {
    return this.investorService.updateInvestorProfile(req.profileId, dto);
  }

  @Put('verify/:investorId')
  async verifyInvestor(@Param('investorId') investorId: string) {
    return this.investorService.verifyInvestor(investorId);
  }

  @Get(':profileId')
  async getPublicInvestorProfile(@Param('profileId') profileId: string) {
    return this.investorService.getPublicInvestorProfile(
      new Types.ObjectId(profileId),
    );
  }
}
