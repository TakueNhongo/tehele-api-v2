import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeStatusEnum } from './enums/like.enums';
import { StartupDocument } from '../startup/schemas/startup.schema';
import { InvestorDocument } from '../investor/schemas/investor.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationSeverityEnum } from '../notification/schemas/notification.schema';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async createLike(
    createLikeDto: CreateLikeDto,
    investorId: Types.ObjectId,
  ): Promise<LikeDocument> {
    const existingLike = await this.likeModel.findOne({
      investorId,
      startupId: createLikeDto.startupId,
    });

    if (existingLike) {
      if (existingLike.status === LikeStatusEnum.ACTIVE) {
        throw new ConflictException('Like already exists');
      }
      // If like exists but was removed, reactivate it
      existingLike.status = LikeStatusEnum.ACTIVE;
      return existingLike.save();
    }

    const newLike = await this.likeModel.create({
      investorId,
      startupId: createLikeDto.startupId,
      status: LikeStatusEnum.ACTIVE,
    });

    // Create notification for startup when investor likes
    await this.notificationService.createNotification(
      createLikeDto.startupId,
      null, // no investorId
      'An investor has shown interest in your startup!',
      NotificationSeverityEnum.SUCCESS,
    );

    return newLike;
  }

  async getLikesByInvestor(
    investorId: Types.ObjectId,
  ): Promise<StartupDocument & { like: LikeDocument }[]> {
    const results: any = await this.likeModel
      .find({
        investorId,
        status: LikeStatusEnum.ACTIVE,
      })
      .populate('startupId')
      .lean();

    return results.map((item) => {
      const { startupId, ...rest } = item;
      return {
        ...item.startupId,
        like: { ...rest, startupId: startupId?._id },
      };
    });
  }

  async getLikesByStartup(
    startupId: Types.ObjectId,
  ): Promise<InvestorDocument & { like: LikeDocument }[]> {
    const results: any = await this.likeModel
      .find({
        startupId,
        status: LikeStatusEnum.ACTIVE,
      })
      .populate('investorId', 'companyName logoFileId')
      .lean();

    return results.map((item) => {
      const { investorId, ...rest } = item;
      return {
        ...item.investorId,
        like: { ...rest, investorId: investorId?._id },
      };
    });
  }

  async checkIfLiked(
    investorId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<boolean> {
    const like = await this.likeModel.findOne({
      investorId,
      startupId,
      status: LikeStatusEnum.ACTIVE,
    });
    return !!like;
  }

  async removeLike(
    investorId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<void> {
    const like = await this.likeModel.findOne({ investorId, startupId });
    if (!like) {
      throw new NotFoundException('Like not found');
    }
    like.status = LikeStatusEnum.REMOVED;
    await like.save();
  }

  // This will be called from connection service when connection is established
  async deleteLikeOnConnection(
    investorId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<void> {
    await this.likeModel.deleteOne({ investorId, startupId });
  }
}
