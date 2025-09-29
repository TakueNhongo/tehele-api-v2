import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Connection, ConnectionDocument } from './schemas/connection.schema';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import {
  ConnectionInitiatorTypeEnum,
  ConnectionInitiationMethodEnum,
  ConnectionStatusEnum,
} from './enums/connection.enums';
import { LikeService } from '../like/like.service';
import { StartupDocument } from '../startup/schemas/startup.schema';
import { InvestorDocument } from '../investor/schemas/investor.schema';

@Injectable()
export class ConnectionService {
  constructor(
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>,
    private readonly likeService: LikeService,
  ) {}

  async getPendingConnectionsByInvestor(
    investorId: Types.ObjectId,
  ): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({
        investorId,
        status: ConnectionStatusEnum.PENDING,
        initiatorType: ConnectionInitiatorTypeEnum.INVESTOR,
      })
      .populate(
        'startupId',
        'companyName industry description tagline logoFileId',
      )
      .lean()
      .exec();
  }

  async createConnection(
    createConnectionDto: CreateConnectionDto,
    initiatorId: Types.ObjectId,
    initiatorType: 'investor' | 'startup',
  ): Promise<ConnectionDocument> {
    // Check if connection exists
    const existingConnection = await this.connectionModel.findOne({
      investorId:
        initiatorType === 'investor'
          ? initiatorId
          : createConnectionDto.startupId,
      startupId:
        initiatorType === 'startup'
          ? initiatorId
          : createConnectionDto.startupId,
    });

    if (existingConnection) {
      throw new ConflictException('Connection already exists');
    }

    // For like_message method, verify like exists
    if (
      createConnectionDto.initiationMethod ===
      ConnectionInitiationMethodEnum.LIKE_INITIATED
    ) {
      const isLiked = await this.likeService.checkIfLiked(
        initiatorType === 'investor'
          ? initiatorId
          : createConnectionDto.startupId,
        initiatorType === 'startup'
          ? initiatorId
          : createConnectionDto.startupId,
      );
      if (!isLiked) {
        throw new UnauthorizedException(
          'Like must exist for this connection method',
        );
      }
    }

    const connection = await this.connectionModel.create({
      investorId:
        initiatorType === 'investor'
          ? initiatorId
          : createConnectionDto.startupId,
      startupId:
        initiatorType === 'startup'
          ? initiatorId
          : createConnectionDto.startupId,
      initiatorType:
        initiatorType === 'investor'
          ? ConnectionInitiatorTypeEnum.INVESTOR
          : ConnectionInitiatorTypeEnum.STARTUP,
      initiationMethod: createConnectionDto.initiationMethod,
    });

    // If connection is created and it was through like, remove the like
    if (
      connection &&
      createConnectionDto.initiationMethod ===
        ConnectionInitiationMethodEnum.LIKE_INITIATED
    ) {
      await this.likeService.deleteLikeOnConnection(
        initiatorType === 'investor'
          ? initiatorId
          : createConnectionDto.startupId,
        initiatorType === 'startup'
          ? initiatorId
          : createConnectionDto.startupId,
      );
    }

    return connection;
  }

  async getConnectionsByInvestor(
    investorId: Types.ObjectId,
  ): Promise<StartupDocument & { connection: ConnectionDocument }[]> {
    const result: any = await this.connectionModel
      .find({ investorId })
      .populate('startupId')
      .lean();

    return result.map((item: any) => {
      const { startupId, ...rest } = item;
      return {
        ...item.startupId,
        connection: { ...rest, startupId: startupId._id },
      } as any;
    });
  }

  async getConnectionsByStartup(
    startupId: Types.ObjectId,
  ): Promise<InvestorDocument & { connection: ConnectionDocument }[]> {
    const result: any = await this.connectionModel
      .find({ startupId })
      .populate({
        path: 'investorId',
        populate: {
          path: 'createdBy',
        },
      })
      .lean();

    return result.map((item: any) => {
      const { investorId, ...rest } = item;
      return {
        ...item.investorId,
        connection: { ...rest, investorId: investorId._id },
      } as any;
    });
  }

  async updateConnection(
    connectionId: Types.ObjectId,
    updateConnectionDto: UpdateConnectionDto,
    profileId: Types.ObjectId,
    profileType: 'investor' | 'startup',
  ): Promise<ConnectionDocument> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Verify the user has permission to update this connection
    const hasPermission =
      profileType === 'investor'
        ? connection.investorId.equals(profileId)
        : connection.startupId.equals(profileId);

    if (!hasPermission) {
      throw new UnauthorizedException(
        'Not authorized to update this connection',
      );
    }

    connection.status = updateConnectionDto.status;
    return connection.save();
  }

  async getConnectionById(
    connectionId: Types.ObjectId,
  ): Promise<ConnectionDocument> {
    const connection = await this.connectionModel.findById(connectionId);
    if (!connection) {
      throw new NotFoundException('Connection not found');
    }
    return connection;
  }

  async checkExistingConnection(
    investorId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<ConnectionDocument | null> {
    return this.connectionModel.findOne({
      investorId,
      startupId,
    });
  }
}
