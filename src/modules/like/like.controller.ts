import { Controller, Post, Get, Delete, Param, Req } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Types } from 'mongoose';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('startup/:startupId')
  async likeStartup(
    @Req() req: RequestWithUser,
    @Param('startupId') startupId: string,
  ) {
    const dto: CreateLikeDto = { startupId: new Types.ObjectId(startupId) };
    return this.likeService.createLike(dto, req.profileId);
  }

  @Get('investor/likes')
  async getInvestorLikes(@Req() req: RequestWithUser) {
    return this.likeService.getLikesByInvestor(req.profileId);
  }

  @Get('startup/:startupId/liked')
  async checkIfLiked(
    @Req() req: RequestWithUser,
    @Param('startupId') startupId: string,
  ) {
    return this.likeService.checkIfLiked(
      req.profileId,
      new Types.ObjectId(startupId),
    );
  }

  @Get('startup/likes')
  async getStartupLikes(@Req() req: RequestWithUser) {
    return this.likeService.getLikesByStartup(req.profileId);
  }

  @Delete('startup/:startupId')
  async removeLike(
    @Req() req: RequestWithUser,
    @Param('startupId') startupId: string,
  ) {
    return this.likeService.removeLike(
      req.profileId,
      new Types.ObjectId(startupId),
    );
  }
}
