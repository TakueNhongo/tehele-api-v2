import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import {
  MessageFolderEnum,
  MessageStatusEnum,
  ProfileTypeEnum,
} from './enums/message.enums';
import { ConnectionService } from '../connection/connection.service';
import { LikeService } from '../like/like.service';
import { FolderStats } from './types/message.types';
import { SaveDraftDto } from './dto/save-draft.dto';
import {
  MessageDraft,
  MessageDraftDocument,
} from './schemas/message-draft.schema';
import { StartupService } from '../startup/startup.service';
import { InvestorService } from '../investor/investor.service';
import { ConnectionInitiationMethodEnum } from '../connection/enums/connection.enums';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(MessageDraft.name)
    private draftModel: Model<MessageDraftDocument>,
    private readonly startupService: StartupService,
    private readonly websocketService: WebSocketService,
    private readonly investorService: InvestorService,
    private readonly connectionService: ConnectionService,
    private readonly likeService: LikeService,
  ) {}

  private generateThreadId(
    profileId1: Types.ObjectId,
    profileId2: Types.ObjectId,
  ): string {
    const sorted = [profileId1.toString(), profileId2.toString()].sort();
    return sorted.join('_');
  }

  async getAvailableRecipients(
    profileId: Types.ObjectId,
    profileType: 'startup' | 'investor',
    search?: string,
  ): Promise<any[]> {
    const query: any = {};
    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }

    if (profileType === 'startup') {
      // Get all possible investor IDs that startup can message
      const [
        likingInvestors, // Investors who liked the startup
        connectedInvestors, // Investors with active connections
        messagingInvestors, // Investors who sent messages
      ] = await Promise.all([
        this.likeService.getLikesByStartup(profileId),
        this.connectionService.getConnectionsByStartup(profileId),
        this.messageModel.distinct('senderProfileId', {
          receiverStartupProfileId: profileId,
          senderProfileType: ProfileTypeEnum.INVESTOR,
        }),
      ]);

      // Combine all unique investor IDs
      const investorIds = new Set([
        ...likingInvestors.map((like) => like.like.investorId.toString()),
        ...connectedInvestors.map((conn) =>
          conn.connection.investorId.toString(),
        ),
        ...messagingInvestors.map((id) => id.toString()),
      ]);

      query._id = {
        $in: Array.from(investorIds).map((id) => new Types.ObjectId(id)),
      };

      return this.investorService.findByIds(
        Array.from(investorIds).map((id) => new Types.ObjectId(id)),
      );
    } else {
      // For investors, get startups that:
      const [
        likedStartups, // Startups they've liked
        connectedStartups, // Startups they're connected with
        pendingStartups, // Startups they've sent connection requests to
      ] = await Promise.all([
        this.likeService.getLikesByInvestor(profileId),
        this.connectionService.getConnectionsByInvestor(profileId),
        this.connectionService.getPendingConnectionsByInvestor(profileId),
      ]);

      // Get verified startups that match any of these conditions
      const startupIds = new Set([
        ...likedStartups.map((like) => like.like?.startupId.toString()),
        ...connectedStartups.map((conn) =>
          conn.connection?.startupId?.toString(),
        ),
        ...pendingStartups.map((conn) => conn.startupId.toString()),
      ]);

      query.$or = [
        {
          _id: {
            $in: Array.from(startupIds).map((id) => new Types.ObjectId(id)),
          },
        },
        { isVerified: true },
      ];

      return this.startupService.findStartups(query);
    }
  }

  async getMessagesByFolder(
    profileId: Types.ObjectId,
    folder: MessageFolderEnum,
  ): Promise<any[]> {
    try {
      let matchCriteria: any = {};
      let sortField = 'createdAt';

      switch (folder) {
        case MessageFolderEnum.INBOX:
          matchCriteria = {
            $or: [
              { receiverStartupProfileId: profileId },
              { receiverInvestorProfileId: profileId },
            ],
            status: {
              $in: [MessageStatusEnum.ACCEPTED, MessageStatusEnum.SENT],
            },
            deletedForReceiver: { $ne: true },
          };
          break;

        case MessageFolderEnum.SENT:
          matchCriteria = {
            $or: [
              { senderStartupProfileId: profileId },
              { senderInvestorProfileId: profileId },
            ],
            deletedForSender: { $ne: true },
          };
          break;

        case MessageFolderEnum.REQUESTS:
          matchCriteria = {
            $or: [
              { receiverStartupProfileId: profileId },
              { receiverInvestorProfileId: profileId },
            ],
            status: MessageStatusEnum.PENDING,
            deletedForReceiver: { $ne: true },
            deletedForSender: { $ne: true },
          };
          break;

        case MessageFolderEnum.DRAFTS:
          matchCriteria = {
            senderUserId: profileId,
            deletedForSender: { $ne: true },
          };
          sortField = 'updatedAt';
          break;
      }

      return await this.messageModel
        .find(matchCriteria)
        .sort({ [sortField]: -1 })
        .populate([
          {
            path: 'senderStartupProfileId',
            select: 'companyName logoFileId',
            populate: { path: 'createdBy' },
          },
          {
            path: 'senderInvestorProfileId',
            select: 'companyName logoFileId',
            populate: { path: 'createdBy' },
          },
          {
            path: 'receiverStartupProfileId',
            select: 'companyName logoFileId',
            populate: { path: 'createdBy' },
          },
          {
            path: 'receiverInvestorProfileId',
            select: 'companyName logoFileId',
            populate: { path: 'createdBy' },
          },
        ])
        .lean()
        .exec();
    } catch (error) {
      console.error(
        `Error fetching messages for folder ${folder}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  // For viewing a specific message and its thread
  async getMessageWithThread(
    messageId: Types.ObjectId,
    profileId: Types.ObjectId,
  ): Promise<{
    message: MessageDocument;
    thread: MessageDocument[];
  }> {
    // Get the main message
    const message = await this.messageModel
      .findById(messageId)
      .populate('senderStartupProfileId', 'companyName logoFileId')
      .populate('senderInvestorProfileId', 'companyName logoFileId')
      .populate('receiverStartupProfileId', 'companyName logoFileId')
      .populate('receiverInvestorProfileId', 'companyName logoFileId')
      .lean()
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify access: Check if the user is either the sender or receiver
    const isAuthorized =
      (message.senderStartupProfileId &&
        message.senderStartupProfileId.equals(profileId)) ||
      (message.senderInvestorProfileId &&
        message.senderInvestorProfileId.equals(profileId)) ||
      (message.receiverStartupProfileId &&
        message.receiverStartupProfileId.equals(profileId)) ||
      (message.receiverInvestorProfileId &&
        message.receiverInvestorProfileId.equals(profileId));

    if (!isAuthorized) {
      throw new UnauthorizedException('Not authorized to view this message');
    }

    // Determine if user is sender or receiver for deletion filter
    const isSender =
      (message.senderStartupProfileId &&
        message.senderStartupProfileId.equals(profileId)) ||
      (message.senderInvestorProfileId &&
        message.senderInvestorProfileId.equals(profileId));

    // Add deletion filter based on user role
    const deletionFilter = isSender
      ? { deletedForSender: { $ne: true } }
      : { deletedForReceiver: { $ne: true } };

    // Get thread messages (excluding the current message)
    const thread = await this.messageModel
      .find({
        threadId: message.threadId,
        _id: { $ne: messageId },
        status: MessageStatusEnum.SENT, // Only show sent messages in thread
        ...deletionFilter, // Add deletion filter
      })
      .sort({ createdAt: -1 })
      .limit(10) // Show last 10 messages in thread
      .populate('senderStartupProfileId', 'companyName logoFileId')
      .populate('senderInvestorProfileId', 'companyName logoFileId')
      .populate('receiverStartupProfileId', 'companyName logoFileId')
      .populate('receiverInvestorProfileId', 'companyName logoFileId')
      .lean()
      .exec();

    return {
      message,
      thread,
    };
  }

  async getMessageThread(
    messageId: Types.ObjectId,
    profileId: Types.ObjectId,
  ): Promise<MessageDocument[]> {
    const initialMessage = await this.messageModel.findById(messageId);

    if (!initialMessage) {
      throw new NotFoundException('Message not found');
    }

    // Verify access: Check if the user is either the sender or receiver
    const isAuthorized =
      (initialMessage.senderStartupProfileId &&
        initialMessage.senderStartupProfileId.equals(profileId)) ||
      (initialMessage.senderInvestorProfileId &&
        initialMessage.senderInvestorProfileId.equals(profileId)) ||
      (initialMessage.receiverStartupProfileId &&
        initialMessage.receiverStartupProfileId.equals(profileId)) ||
      (initialMessage.receiverInvestorProfileId &&
        initialMessage.receiverInvestorProfileId.equals(profileId));

    if (!isAuthorized) {
      throw new UnauthorizedException('Not authorized to view this message');
    }

    // Determine if user is sender or receiver for deletion filter
    const isSender =
      (initialMessage.senderStartupProfileId &&
        initialMessage.senderStartupProfileId.equals(profileId)) ||
      (initialMessage.senderInvestorProfileId &&
        initialMessage.senderInvestorProfileId.equals(profileId));

    // Add deletion filter based on user role
    const deletionFilter = isSender
      ? { deletedForSender: { $ne: true } }
      : { deletedForReceiver: { $ne: true } };

    return this.messageModel
      .find({
        threadId: initialMessage.threadId,
        ...deletionFilter, // Add deletion filter
      })
      .sort({ createdAt: -1 })
      .populate('senderStartupProfileId', 'companyName logoFileId')
      .populate('senderInvestorProfileId', 'companyName logoFileId')
      .populate('receiverStartupProfileId', 'companyName logoFileId')
      .populate('receiverInvestorProfileId', 'companyName logoFileId')
      .exec();
  }

  async createMessage(
    createMessageDto: CreateMessageDto,
    senderUserId: Types.ObjectId,
    senderProfileId: Types.ObjectId,
    senderProfileType: 'startup' | 'investor',
  ): Promise<MessageDocument> {
    try {
      // Get receiver profile type from DTO
      const receiverProfileType = createMessageDto.receiverProfileType;

      // Ensure receiver profile ID matches the type
      if (
        (receiverProfileType === 'startup' &&
          !createMessageDto.receiverStartupProfileId) ||
        (receiverProfileType === 'investor' &&
          !createMessageDto.receiverInvestorProfileId)
      ) {
        throw new BadRequestException(
          'Receiver profile ID is missing or incorrect',
        );
      }

      let canMessage = false;
      let shouldBePending = false;

      // RULE: If sender is a startup, allow messaging if:
      // 1️⃣ The investor has liked them, OR
      // 2️⃣ A connection exists
      if (senderProfileType === 'startup') {
        const [wasLiked, hasConnection, hasInvestorMessagedBefore] =
          await Promise.all([
            this.likeService.checkIfLiked(
              new Types.ObjectId(createMessageDto.receiverInvestorProfileId), // Investor
              senderProfileId, // Startup
            ),
            this.connectionService.checkExistingConnection(
              senderProfileId, // Startup
              new Types.ObjectId(createMessageDto.receiverInvestorProfileId), // Investor
            ),
            this.messageModel.exists({
              senderInvestorProfileId: new Types.ObjectId(
                createMessageDto.receiverInvestorProfileId,
              ),
              receiverStartupProfileId: senderProfileId,
            }),
          ]);

        canMessage =
          !!wasLiked || !!hasConnection || !!hasInvestorMessagedBefore;
        shouldBePending = !hasInvestorMessagedBefore;

        if (!canMessage) {
          throw new UnauthorizedException(
            'Cannot message this investor without an existing connection, being liked first, or having received a message from them',
          );
        }
      } else {
        // NEW RULE: If sender is an investor, allow messaging anyhow
        canMessage = true;
        shouldBePending = false; // Always SENT for investors
      }

      // Get receiver profile (ensures receiver exists)
      const receiverProfile =
        receiverProfileType === 'investor'
          ? await this.investorService.getInvestorById(
              new Types.ObjectId(createMessageDto.receiverInvestorProfileId),
            )
          : await this.startupService.getStartupById(
              createMessageDto.receiverStartupProfileId,
            );

      if (!receiverProfile) {
        throw new NotFoundException('Receiver profile not found');
      }

      // Generate thread ID
      const threadId = this.generateThreadId(
        senderProfileId,
        receiverProfileType === 'startup'
          ? new Types.ObjectId(createMessageDto.receiverStartupProfileId)
          : new Types.ObjectId(createMessageDto.receiverInvestorProfileId),
      );

      // Construct message object with correct profile fields
      const messageData: Partial<MessageDocument> = {
        senderUserId,
        receiverUserId: receiverProfile.createdBy,
        senderProfileType:
          senderProfileType === 'startup'
            ? ProfileTypeEnum.STARTUP
            : ProfileTypeEnum.INVESTOR,
        receiverProfileType:
          receiverProfileType === 'startup'
            ? ProfileTypeEnum.STARTUP
            : ProfileTypeEnum.INVESTOR,
        status: shouldBePending
          ? MessageStatusEnum.PENDING
          : MessageStatusEnum.SENT,
        threadId,
        subject: createMessageDto.subject,
        content: createMessageDto.content,
        attachments: createMessageDto.attachments || [],
      };

      // Assign correct sender profile field
      if (senderProfileType === 'startup') {
        messageData.senderStartupProfileId = senderProfileId;
      } else {
        messageData.senderInvestorProfileId = senderProfileId;
      }

      // Assign correct receiver profile field
      if (receiverProfileType === 'startup') {
        messageData.receiverStartupProfileId = new Types.ObjectId(
          createMessageDto.receiverStartupProfileId,
        );
      } else {
        messageData.receiverInvestorProfileId = new Types.ObjectId(
          createMessageDto.receiverInvestorProfileId,
        );
      }
      console.log(receiverProfileType, {
        senderStartupProfileId: createMessageDto.receiverStartupProfileId,
      });

      if (receiverProfileType === 'startup') {
        await this.messageModel.updateMany(
          {
            senderStartupProfileId: new Types.ObjectId(
              createMessageDto.receiverStartupProfileId,
            ),
          },
          {
            status: MessageStatusEnum.ACCEPTED,
          },
        );
      }
      this.websocketService.sendRefetchCommand(
        createMessageDto.receiverInvestorProfileId ||
          createMessageDto.receiverStartupProfileId,
      );
      // Create and return message
      const result = await this.messageModel.create(messageData);
      return result;
    } catch (e) {
      console.log('Error', e.message);
      throw new InternalServerErrorException(e.message);
    }
  }

  async markAsRead(
    messageId: Types.ObjectId,
    profileId: Types.ObjectId,
  ): Promise<void> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Ensure the profile trying to mark the message as read is the receiver
    const isReceiver =
      (message.receiverStartupProfileId &&
        message.receiverStartupProfileId.equals(profileId)) ||
      (message.receiverInvestorProfileId &&
        message.receiverInvestorProfileId.equals(profileId));

    if (!isReceiver) {
      throw new UnauthorizedException(
        'Can only mark received messages as read',
      );
    }

    // Mark as read and save
    message.read = true;
    await message.save();
  }

  async updateMessageStatus(
    messageId: Types.ObjectId,
    updateMessageDto: UpdateMessageDto,
    profileId: Types.ObjectId,
    profileType: 'startup' | 'investor',
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify that the current profile is the receiver.
    const isReceiver =
      (message.receiverStartupProfileId &&
        message.receiverStartupProfileId.equals(profileId)) ||
      (message.receiverInvestorProfileId &&
        message.receiverInvestorProfileId.equals(profileId));

    if (!isReceiver) {
      throw new UnauthorizedException(
        'Only message receiver can update status',
      );
    }

    // Update message status
    message.status = updateMessageDto.status;

    // If message is accepted, create or update connection
    if (updateMessageDto.status === MessageStatusEnum.ACCEPTED) {
      // Determine the initiating startup ID:
      // If the current profile is a startup, use profileId, else use sender's startup profile ID.
      const startupId =
        profileType === 'startup' ? profileId : message.senderStartupProfileId; // assuming sender's startup profile is stored if sender is startup

      // Determine the type of sender profile to be used in connection creation.
      // If sender's profile type is investor, pass 'investor'; otherwise, 'startup'
      const senderType =
        message.senderProfileType === ProfileTypeEnum.INVESTOR
          ? 'investor'
          : 'startup';

      await this.connectionService.createConnection(
        {
          startupId: startupId,
          initiationMethod: ConnectionInitiationMethodEnum.DIRECT_MESSAGE,
        },
        // The connection partner is the sender's profile ID.
        message.senderProfileType === ProfileTypeEnum.INVESTOR
          ? message.senderInvestorProfileId
          : message.senderStartupProfileId,
        senderType,
      );

      // Mark all pending messages in the thread as SENT.
      await this.messageModel.updateMany(
        {
          threadId: message.threadId,
          status: MessageStatusEnum.PENDING,
        },
        {
          status: MessageStatusEnum.SENT,
        },
      );
    }

    return message.save();
  }

  async getFolderStats(profileId: Types.ObjectId): Promise<FolderStats> {
    const [inbox, unreadInbox, sent, requests, unreadRequests, drafts] =
      await Promise.all([
        // Inbox count - exclude messages deleted by receiver
        this.messageModel.countDocuments({
          $or: [
            {
              receiverStartupProfileId: profileId,
            },
            {
              receiverInvestorProfileId: profileId,
            },
          ],
          status: { $in: [MessageStatusEnum.ACCEPTED, MessageStatusEnum.SENT] },
          deletedForReceiver: { $ne: true },
        }),

        // Unread inbox count - exclude messages deleted by receiver
        this.messageModel.countDocuments({
          $or: [
            {
              receiverStartupProfileId: profileId,
            },
            {
              receiverInvestorProfileId: profileId,
            },
          ],
          read: false,
          deletedForReceiver: { $ne: true },
        }),

        // Sent count - exclude messages deleted by sender
        this.messageModel.countDocuments({
          $or: [
            {
              senderInvestorProfileId: profileId,
            },
            {
              senderStartupProfileId: profileId,
            },
          ],
          deletedForSender: { $ne: true },
        }),

        // Requests count - exclude messages deleted by receiver
        this.messageModel.countDocuments({
          $or: [
            {
              receiverStartupProfileId: profileId,
            },
            {
              receiverInvestorProfileId: profileId,
            },
          ],
          status: MessageStatusEnum.PENDING,
          deletedForReceiver: { $ne: true },
          deletedForSender: { $ne: true },
        }),

        // Unread requests count - exclude messages deleted by receiver
        this.messageModel.countDocuments({
          $or: [
            {
              receiverStartupProfileId: profileId,
            },
            {
              receiverInvestorProfileId: profileId,
            },
          ],
          status: MessageStatusEnum.PENDING,
          read: false,
          deletedForReceiver: { $ne: true },
          deletedForSender: { $ne: true },
        }),

        this.draftModel.countDocuments({
          profileId,
        }),
      ]);

    return {
      inbox,
      sent,
      drafts,
      requests,
      unreadCounts: {
        inbox: unreadInbox,
        requests: unreadRequests,
      },
    };
  }

  async saveDraft(
    userId: Types.ObjectId,
    profileId: Types.ObjectId,
    profileType: 'startup' | 'investor',
    draft: SaveDraftDto,
  ): Promise<MessageDraftDocument> {
    return this.draftModel.findOneAndUpdate(
      {
        userId,
        profileId,
        receiverProfileId: draft.receiverProfileId,
      },
      {
        ...draft,
        profileType:
          profileType === 'startup'
            ? ProfileTypeEnum.STARTUP
            : ProfileTypeEnum.INVESTOR,
        receiverProfileType:
          profileType === 'startup'
            ? ProfileTypeEnum.INVESTOR
            : ProfileTypeEnum.STARTUP,
      },
      { upsert: true, new: true },
    );
  }

  async deleteDraft(
    draftId: Types.ObjectId,
    userId: Types.ObjectId,
    profileId: Types.ObjectId,
  ): Promise<void> {
    const result = await this.draftModel.deleteOne({
      _id: draftId,
      userId,
      profileId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Draft not found or unauthorized');
    }
  }

  async deleteMessage(
    messageId: Types.ObjectId,
    profileId: Types.ObjectId,
  ): Promise<{ success: boolean }> {
    // Find the message first
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Determine if this profile is the sender or receiver
    const isSender = this.isProfileSender(message, profileId);
    const isReceiver = this.isProfileReceiver(message, profileId);

    if (!isSender && !isReceiver) {
      throw new UnauthorizedException(
        'You do not have permission to delete this message',
      );
    }

    const updateData: any = {};

    if (isSender) {
      updateData.deletedForSender = true;
    }

    if (isReceiver) {
      updateData.deletedForReceiver = true;
    }

    await this.messageModel.updateOne({ _id: messageId }, { $set: updateData });

    // If deleted for both parties, physically remove the message
    if (
      (isSender && message.deletedForReceiver) ||
      (isReceiver && message.deletedForSender) ||
      (updateData.deletedForSender && updateData.deletedForReceiver)
    ) {
      await this.messageModel.deleteOne({ _id: messageId });
    }

    return { success: true };
  }

  // Helper methods to determine if a profile is sender or receiver
  private isProfileSender(
    message: MessageDocument,
    profileId: Types.ObjectId,
  ): boolean {
    if (
      message.senderProfileType === ProfileTypeEnum.STARTUP &&
      message.senderStartupProfileId?.toString() === profileId.toString()
    ) {
      return true;
    }

    if (
      message.senderProfileType === ProfileTypeEnum.INVESTOR &&
      message.senderInvestorProfileId?.toString() === profileId.toString()
    ) {
      return true;
    }

    return false;
  }

  private isProfileReceiver(
    message: MessageDocument,
    profileId: Types.ObjectId,
  ): boolean {
    if (
      message.receiverProfileType === ProfileTypeEnum.STARTUP &&
      message.receiverStartupProfileId?.toString() === profileId.toString()
    ) {
      return true;
    }

    if (
      message.receiverProfileType === ProfileTypeEnum.INVESTOR &&
      message.receiverInvestorProfileId?.toString() === profileId.toString()
    ) {
      return true;
    }

    return false;
  }
}
