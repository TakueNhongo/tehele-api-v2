import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationSeverityEnum } from './schemas/notification.schema';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly webSocketService: WebSocketService,
  ) {}

  async createNotification(
    startupId: Types.ObjectId,
    investorId: Types.ObjectId,
    message: string,
    severity: NotificationSeverityEnum = NotificationSeverityEnum.NEUTRAL,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      startupId,
      investorId,
      message,
      severity,
      isRead: false,
    });

    // Send refetch command to both startup and investor if they exist
    if (startupId) {
      this.webSocketService.sendRefetchCommand(startupId.toString());
    }
    if (investorId) {
      this.webSocketService.sendRefetchCommand(investorId.toString());
    }

    return notification;
  }

  async getNotifications(
    profileId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ notifications: NotificationDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({
          $or: [
            {
              investorId: profileId,
            },
            {
              startupId: profileId,
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({
        $or: [
          {
            investorId: profileId,
          },
          {
            startupId: profileId,
          },
        ],
      }),
    ]);

    return { notifications, total };
  }

  async getNotificationsByStartup(
    startupId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ notifications: NotificationDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ startupId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ startupId }),
    ]);

    return { notifications, total };
  }

  async markAsRead(
    notificationId: Types.ObjectId,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return notification.save();
  }

  async markAllAsRead(profileId: Types.ObjectId): Promise<void> {
    await this.notificationModel.updateMany(
      {
        $or: [
          {
            investorId: profileId,
          },
          {
            startupId: profileId,
          },
        ],
        isRead: false,
      },
      { $set: { isRead: true } },
    );
  }

  async getUnreadCount(profileId: Types.ObjectId): Promise<number> {
    return this.notificationModel.countDocuments({
      $or: [
        {
          investorId: profileId,
        },
        {
          startupId: profileId,
        },
      ],
      isRead: false,
    });
  }

  async deleteNotification(notificationId: Types.ObjectId): Promise<void> {
    const result =
      await this.notificationModel.findByIdAndDelete(notificationId);
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
  }
}
