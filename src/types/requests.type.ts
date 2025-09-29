import { Request } from 'express';
import { Types } from 'mongoose';
import { UserDocument } from 'src/modules/user/schemas/user.schema';
//  Custom type extending Express Request with optional user property
export interface RequestWithUser extends Request {
  user?: UserDocument;
  profileType?: 'startup' | 'investor';
  profileId?: Types.ObjectId;
  sessionId?: string;
}

export interface UploadedMessageFile {
  originalname: string;
  filename: string;
  path: string;
  mimetype: string;
}

export interface RequestWithAttachments extends RequestWithUser {
  attachments?: {
    generalAttachments?: UploadedMessageFile[];
  };
}
