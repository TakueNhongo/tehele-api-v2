import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { Session, SessionSchema } from '../session/schemas/session.schema';

import { StartupModule } from '../startup/startup.module';
import { InvestorModule } from '../investor/investor.module';

@Module({
  imports: [
    forwardRef(() => StartupModule),
    forwardRef(() => InvestorModule),
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function (next) {
            if (this.isModified('password')) {
              const salt = await bcrypt.genSalt();
              this.password = await bcrypt.hash(this.password, salt);
            }
            next();
          });
          schema.set('toJSON', {
            transform: (doc, ret) => {
              delete ret.__v;
              delete ret.tokens;
              delete ret.password;
              return ret;
            },
          });
          schema.set('toObject', {
            transform: (doc, ret) => {
              delete ret.__v;
              delete ret.tokens;
              delete ret.password;
              return ret;
            },
          });
          return schema;
        },
      },
      {
        name: Session.name,
        useFactory: () => {
          const schema = SessionSchema;
          return schema;
        },
      },
    ]),
    MailerModule.forRoot({
      transport: {
        host: 'mail.mango.zw',
        port: 587, // Replace with your SMTP port
        secure: false, // true for 465, false for other ports
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
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
