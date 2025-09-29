import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JWTSharedModule } from './modules/jwt/jwt.module';
import { FilesModule } from './modules/files/files.module';
import { MulterModule } from '@nestjs/platform-express';
import { SessionModule } from './modules/session/session.module';
import { StartupModule } from './modules/startup/startup.module';
import { FundingHistoryModule } from './modules/funding-history/funding-history.module';
import { InvestorModule } from './modules/investor/investor.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

import { EventsModule } from './modules/events/events.module';
import { AdminModule } from './modules/admin/admin.module';
import { BlogModule } from './modules/blog/blog.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Session,
  SessionSchema,
} from './modules/session/schemas/session.schema';
import { LikeModule } from './modules/like/like.module';
import { ConnectionModule } from './modules/connection/connection.module';
import { MessageModule } from './modules/message/message.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { InvestmentModule } from './modules/investment/investment.module';
import { TeamMemberModule } from './modules/team-member/team-member.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Session.name,
        useFactory: () => {
          const schema = SessionSchema;
          return schema;
        },
      },
    ]),
    MulterModule.register(),
    DatabaseModule,
    AuthModule,
    UserModule,
    JWTSharedModule,
    FilesModule,
    SessionModule,
    StartupModule,
    FundingHistoryModule,
    InvestorModule,
    AppointmentsModule,
    EventsModule,
    AdminModule,
    BlogModule,
    LikeModule,
    ConnectionModule,
    MessageModule,
    WebSocketModule,
    InvestmentModule,
    TeamMemberModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
