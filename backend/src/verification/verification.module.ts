import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [HttpModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
