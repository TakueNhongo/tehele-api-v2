import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationSeverityEnum } from './schemas/notification.schema';
import { WebSocketService } from '../websocket/websocket.service';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class NotificationService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly webSocketService: WebSocketService,
  ) {}

  onModuleInit() {
    // Initialize Firebase with a unique name if it doesn't exist
    try {
      this.firebaseApp = admin.app('notification-service');
    } catch (error) {
      this.firebaseApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            type: 'service_account',
            project_id: 'tehele-mobile',
            private_key_id: 'a21b6f8e62917ff5a70af3ce2b86ae038c3dbd67',
            private_key:
              '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC5UdKKY1S+FLi9\n/jcf6Z9lsWZIVOrp3NEb+3dEsS/tI/WwpkLnE60XbbFkpahdRRLMh45VOpUt0Npy\n+GS3RjRF+8ExwgQCQfVFOlTLWa5TiNDnqODKv9SSOnSOStF2ZYau56kdUWwjsj7L\nS0SssF+N7wfsfE5uR5wLSwSCOSa1AfgtMGRQYjCCex0hfFhBRad3O61dyqZyYfzj\nkIKIa8mUeIpK1BXh4P5VF7r08iMa/ubxzHUaYsqO/1K2Yp4cwmulBvFkrrk4+jjp\nvfPItHK05gd81J3Fu+++VVoNPCyDUio1GNyuXPl/c5Zq/fQg9kHprEoI80GZ79vH\no2GS0n99AgMBAAECggEAWN+eFkMDwXLDlE4llpbeHBFjCX47+HKvD/ndXWKSJupv\nacuaWyJLCOjQwYFWiIBXPyIlRsdlAodeM/PerSwsZoGRSbEPZhvGqfAK+Uileycq\ndGa/g0xS/9uryQ+le1++IwQzTL2fHFFfnvQWV7Dv6mv/Q1Dr9iQ+eAX+gAszfmtF\nwxOGvNn/ATJrU46pm4+k+/IoNbFVE0lY+FtGZXyUgqxnAq4gKGQvBLHBQA6MXocG\n1rZZN1MEhlGqnI10gYZ4/j0wufMFtl7FnAuz355mFZQWFTWNzRm2T0h7xWqxMPo8\nLhJXSsaVKSHBXRcOXVVZFJcfGeVsLNib+sb1h5LyOwKBgQDjcaNrI0Ijyep2/BJc\n5Rg0mvM9kNkvL8Yjn0PThCuMFGVqyP8sF+B+dmHYG76nD00RQhau1FPGGLh7O0Gq\nvjG8Kw1/6Mzhx19cfNIsnNE5JXoJIv4GbMHRkIE9q2DH+1hEqSGKZwtgUGOlxrR/\nNbgV2TQyuYBZJV7tN8Rn6mN0CwKBgQDQlkBbXilbVToELcNPILDkRhFZcGjAFeiS\nCQVQMBnT0n0aX//bKxPxXtUdhiZrlFsdHBvur0r84EboTqShOZ5gnenk9R0QaYqS\nHkCCXsn07L6HFyLPWUYy8PLnRa7ZhxKYgslJJ63/ifaqWpgBZXCQLXsP//e5KoYZ\npJjUiS5HlwKBgQC3RnkS+kRvpmNjIdiCNrF8omfjcncwSOT3C32SUeztYfofRHwq\nwcrK3QYXKLRG1lOZ1pGEq+AdvwnZc3SE6+IT6PVl3uhJ/2helM6f2HXYANUHy8S6\n1KSSBEnAsfq461bDbS5z4nkOUXkaurXz1AvUv0QKo+RC8ZQ+vzNrMTqW5QKBgQCJ\nbJSWHeGNhQcmPahR963Tl75SeNbqxwRlQoA3ppk9j45Q1DLTiPwoqFwsiXfCpQmq\nkhxtExyKopDU+QtKFZYc/a1d5YfyijZ7sma5/g18yoV0p2+NwLmZUloWuThLpMxB\notlO00+17oWPEwTW1qhktTJBBlmFq1iSiHkQfhj5nQKBgQCHSbszQJXUOtzCjvRx\nJdJVpg/jcwSDgFvsKLhUkqH6v8i3Ce3nJDypbT1QszGDzI0n21kcT0N4f4OxZioM\n1HtFh19EmNk9gif9G2yxx9EdworZ9Wxg4yqcGhA5ae8g5WWq5gy78B42i+94Zbrs\n4ULoibLGPjyuiMbj4Safom9xhQ==\n-----END PRIVATE KEY-----\n',
            client_email:
              'firebase-adminsdk-fbsvc@tehele-mobile.iam.gserviceaccount.com',
            client_id: '115072761051923359966',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url:
              'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url:
              'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tehele-mobile.iam.gserviceaccount.com',
            universe_domain: 'googleapis.com',
          } as admin.ServiceAccount),
        },
        'notification-service',
      );
    }
  }

  async sendPushNotification(
    userId: Types.ObjectId,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        return;
      }

      // Send to all push tokens (max 2)
      const messages = user.pushTokens.map((token) => ({
        notification: { title, body },
        data,
        android: { ttl: 604800000 },
        apns: {
          headers: {
            'apns-expiration': `${Math.floor(Date.now() / 1000) + 604800}`,
          },
        },
        token,
      }));

      // Send all messages
      const responses = await Promise.allSettled(
        messages.map((message) => this.firebaseApp.messaging().send(message)),
      );

      console.log('Push notifications sent:', responses);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

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

    // Send push notifications
    if (startupId) {
      // Find the user who created the startup to send push notification
      const startupUser = await this.userModel.findOne({
        startupProfileIds: { $in: [startupId] },
      });
      if (startupUser) {
        await this.sendPushNotification(
          startupUser._id,
          'New Notification',
          message,
          {
            notificationId: notification._id.toString(),
            type: 'startup',
          },
        );
      }
    }

    if (investorId) {
      // Find the user who created the investor profile to send push notification
      const investorUser = await this.userModel.findOne({
        investorProfileIds: { $in: [investorId] },
      });
      if (investorUser) {
        await this.sendPushNotification(
          investorUser._id,
          'New Notification',
          message,
          {
            notificationId: notification._id.toString(),
            type: 'investor',
          },
        );
      }
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

  async createTestNotification(
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
    message: string = 'This is a test notification',
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

    // Send push notifications for test
    if (startupId) {
      // Find the user who created the startup to send push notification
      const startupUser = await this.userModel.findOne({
        startupProfileIds: { $in: [startupId] },
      });
      if (startupUser) {
        await this.sendPushNotification(
          startupUser._id,
          'Account Updates',
          message,
          {
            notificationId: notification._id.toString(),
            type: 'startup',
          },
        );
      }
    }

    if (investorId) {
      // Find the user who created the investor profile to send push notification
      const investorUser = await this.userModel.findOne({
        investorProfileIds: { $in: [investorId] },
      });
      if (investorUser) {
        await this.sendPushNotification(
          investorUser._id,
          'Test Notification',
          message,
          {
            notificationId: notification._id.toString(),
            type: 'investor',
          },
        );
      }
    }

    return notification;
  }
}
