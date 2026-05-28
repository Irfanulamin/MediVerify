import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UnverifiedReport, UnverifiedReportSchema } from './unverified-report.schema';
import { UnverifiedReportsService } from './unverified-reports.service';
import { UnverifiedReportsController } from './unverified-reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UnverifiedReport.name, schema: UnverifiedReportSchema },
    ]),
  ],
  providers: [UnverifiedReportsService],
  controllers: [UnverifiedReportsController],
  exports: [UnverifiedReportsService],
})
export class UnverifiedReportsModule {}
