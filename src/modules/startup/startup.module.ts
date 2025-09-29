import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StartupService } from './startup.service';
import { StartupController } from './startup.controller';
import { Startup, StartupSchema } from './schemas/startup.schema';
import { LikeModule } from '../like/like.module';
import { ConnectionModule } from '../connection/connection.module';
import { Message, MessageSchema } from '../message/schemas/message.schema';
import { Investor, InvestorSchema } from '../investor/schemas/investor.schema';
import { Like, LikeSchema } from '../like/schemas/like.schema';
import {
  Connection,
  ConnectionSchema,
} from '../connection/schemas/connection.schema';
import {
  StartupViewHistory,
  StartupViewHistorySchema,
} from './schemas/startup-view-history.schema';
import { StartupViewHistoryService } from './services/startup-view-history.service';
import { TeamMemberModule } from '../team-member/team-member.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => LikeModule),
    forwardRef(() => ConnectionModule),
    forwardRef(() => TeamMemberModule),
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: Startup.name, schema: StartupSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Investor.name, schema: InvestorSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Connection.name, schema: ConnectionSchema },
      { name: StartupViewHistory.name, schema: StartupViewHistorySchema },
    ]),
  ],
  providers: [StartupService, StartupViewHistoryService],
  controllers: [StartupController],
  exports: [StartupService], // If needed in other modules
})
export class StartupModule {}
