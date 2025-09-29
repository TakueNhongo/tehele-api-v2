import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundingHistoryService } from './funding-history.service';
import { FundingHistoryController } from './funding-history.controller';
import {
  FundingHistory,
  FundingHistorySchema,
} from './schemas/funding-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundingHistory.name, schema: FundingHistorySchema },
    ]),
  ],
  providers: [FundingHistoryService],
  controllers: [FundingHistoryController],
  exports: [FundingHistoryService], // If needed in other modules
})
export class FundingHistoryModule {}
