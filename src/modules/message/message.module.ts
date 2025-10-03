import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './schemas/message.schema';
import {
  MessageDraft,
  MessageDraftSchema,
} from './schemas/message-draft.schema';
import { ConnectionModule } from '../connection/connection.module';
import { LikeModule } from '../like/like.module';
import { StartupModule } from '../startup/startup.module';
import { InvestorModule } from '../investor/investor.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: MessageDraft.name, schema: MessageDraftSchema },
    ]),
    ConnectionModule,
    LikeModule,
    StartupModule,
    InvestorModule,
    WebSocketModule,
    NotificationModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService], // Export service for use in other modules
})
export class MessageModule {}
