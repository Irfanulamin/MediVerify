import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { VerificationModule } from './verification/verification.module';
import { MedicinesModule } from './medicines/medicines.module';
import { AlertsModule } from './alerts/alerts.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mediverify',
    ),
    AuthModule,
    VerificationModule,
    MedicinesModule,
    AlertsModule,
    AdminModule,
    AiModule,
  ],
})
export class AppModule {}
