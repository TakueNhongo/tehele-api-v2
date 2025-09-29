import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(userId: string, sessionId: string, expiresAt: Date) {
    return this.sessionModel.create({ userId, sessionId, expiresAt });
  }

  async removeSession(sessionId: string) {
    return this.sessionModel.deleteOne({ sessionId });
  }

  async isSessionActive(sessionId: string) {
    return this.sessionModel.findOne({ sessionId });
  }
}
