import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { VerificationModule } from './verification/verification.module';
import { MedicinesModule } from './medicines/medicines.module';
import { AlertsModule } from './alerts/alerts.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { VerificationHistoryModule } from './verification-history/verification-history.module';
import { SavedMedicinesModule } from './saved-medicines/saved-medicines.module';
import { UsersModule } from './users/users.module';
import { UnverifiedReportsModule } from './unverified-reports/unverified-reports.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mediverify',
    ),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
    VerificationModule,
    MedicinesModule,
    AlertsModule,
    AdminModule,
    AiModule,
    VerificationHistoryModule,
    SavedMedicinesModule,
    UsersModule,
    UnverifiedReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
