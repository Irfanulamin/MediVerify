import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MedicinesModule } from '../medicines/medicines.module';
import { VerificationHistoryModule } from '../verification-history/verification-history.module';
import { VerificationController } from './verification.controller';
import { InvestigationController } from './investigation.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [HttpModule, MedicinesModule, VerificationHistoryModule],
  controllers: [VerificationController, InvestigationController],
  providers: [VerificationService],
})
export class VerificationModule {}
