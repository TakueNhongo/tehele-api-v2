import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamMember, TeamMemberSchema } from './schemas/team-member.schema';
import { TeamMemberService } from './team-member.service';
import { TeamMemberController } from './team-member.controller';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { Startup, StartupSchema } from '../startup/schemas/startup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeamMember.name, schema: TeamMemberSchema },
      { name: Startup.name, schema: StartupSchema },
    ]),
    forwardRef(() => UserModule),
    SessionModule,
  ],
  providers: [TeamMemberService],
  controllers: [TeamMemberController],
  exports: [TeamMemberService],
})
export class TeamMemberModule {}
