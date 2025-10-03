import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationSeverityEnum } from './schemas/notification.schema';
import { Public } from 'src/decorators/public.decorator';

import { Types } from 'mongoose';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req: RequestWithUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.notificationService.getNotifications(
      req.profileId,
      page,
      limit,
    );
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(new Types.ObjectId(id));
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.profileId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    return this.notificationService.getUnreadCount(req.profileId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(new Types.ObjectId(id));
  }

  @Public()
  @Post('test')
  async createTestNotification(
    @Body()
    body: {
      startupId?: string;
      investorId?: string;
      message?: string;
      severity?: NotificationSeverityEnum;
    },
  ) {
    return this.notificationService.createTestNotification(
      body.startupId ? new Types.ObjectId(body.startupId) : undefined,
      body.investorId ? new Types.ObjectId(body.investorId) : undefined,
      body.message || 'This is a test notification',
      body.severity || NotificationSeverityEnum.NEUTRAL,
    );
  }
}
