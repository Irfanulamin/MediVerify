import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationHistory, VerificationHistorySchema } from './verification-history.schema';
import { VerificationHistoryService } from './verification-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationHistory.name, schema: VerificationHistorySchema },
    ]),
  ],
  providers: [VerificationHistoryService],
  exports: [VerificationHistoryService],
})
export class VerificationHistoryModule {}
