import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Session, SessionSchema } from '../session/schemas/session.schema';
import { StartupModule } from '../startup/startup.module';
import { InvestorModule } from '../investor/investor.module';

@Module({
  imports: [
    forwardRef(() => StartupModule),
    forwardRef(() => InvestorModule),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    MailerModule.forRoot({
      transport: {
        host: 'mail.mango.zw',
        port: 587,
        secure: false,
        auth: {
          user: 'info@themovement.co.zw',
          pass: '29,-,dWoRiAlA',
        },
      },
      defaults: {
        from: '"No Reply" <info@themovement.co.zw>',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
