import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicinesModule } from '../medicines/medicines.module';
import { Medicine, MedicineSchema } from '../medicines/medicine.schema';
import { VerificationHistoryModule } from '../verification-history/verification-history.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    HttpModule,
    MedicinesModule,
    MongooseModule.forFeature([{ name: Medicine.name, schema: MedicineSchema }]),
    VerificationHistoryModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
