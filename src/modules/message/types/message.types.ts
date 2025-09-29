import { Types } from 'mongoose';
import { MessageStatusEnum, ProfileTypeEnum } from '../enums/message.enums';

export interface MessageThread {
  threadId: string; // Composite of both profile IDs
  otherPartyId: Types.ObjectId;
  otherPartyType: ProfileTypeEnum;
  otherPartyName: string;
  latestMessage: MessageResponse;
  unreadCount: number;
  totalCount: number;
}

export interface MessageResponse {
  _id: Types.ObjectId;
  senderUserId: Types.ObjectId;
  receiverUserId: Types.ObjectId;
  senderProfileId: Types.ObjectId;
  receiverProfileId: Types.ObjectId;
  senderProfileType: ProfileTypeEnum;
  receiverProfileType: ProfileTypeEnum;
  subject: string;
  content: string;
  attachments: string[];
  status: MessageStatusEnum;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderStats {
  inbox: number;
  sent: number;
  drafts: number;
  requests: number;
  unreadCounts: {
    inbox: number;
    requests: number;
  };
}
