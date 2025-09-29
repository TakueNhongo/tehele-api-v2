import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationModule } from '../notification/notification.module';

// Importing Models
import {
  AdminRequest,
  AdminRequestSchema,
} from './shemas/admin-request.schema';
import {
  AdminService as AdminServiceM,
  AdminServiceSchema,
} from './shemas/admin-service.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Startup, StartupSchema } from '../startup/schemas/startup.schema';
import { Investor, InvestorSchema } from '../investor/schemas/investor.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import {
  FundingHistory,
  FundingHistorySchema,
} from '../funding-history/schemas/funding-history.schema';

import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import {
  Investment,
  InvestmentSchema,
} from '../investment/schemas/investment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminServiceM.name, schema: AdminServiceSchema },
      { name: AdminRequest.name, schema: AdminRequestSchema },
      { name: User.name, schema: UserSchema }, // Admins are regular users with `isAdmin: true`
      { name: Startup.name, schema: StartupSchema },
      { name: Investor.name, schema: InvestorSchema },
      { name: Event.name, schema: EventSchema },
      { name: FundingHistory.name, schema: FundingHistorySchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Investment.name, schema: InvestmentSchema },
    ]),
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService], // Allow access from other modules if needed
})
export class AdminModule {}
