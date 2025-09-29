import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';
import { Investment, InvestmentSchema } from './schemas/investment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
    ]),
  ],
  providers: [InvestmentService],
  controllers: [InvestmentController],
  exports: [InvestmentService],
})
export class InvestmentModule {}
