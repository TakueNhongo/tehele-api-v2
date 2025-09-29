import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestorService } from './investor.service';
import { InvestorController } from './investor.controller';
import { Investor, InvestorSchema } from './schemas/investor.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investor.name, schema: InvestorSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  providers: [InvestorService],
  controllers: [InvestorController],
  exports: [InvestorService], // If needed in other modules
})
export class InvestorModule {}
