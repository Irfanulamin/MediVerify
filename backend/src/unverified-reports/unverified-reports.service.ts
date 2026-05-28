import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnverifiedReport, UnverifiedReportDocument } from './unverified-report.schema';
import { CreateUnverifiedReportDto } from './dto/create-unverified-report.dto';

@Injectable()
export class UnverifiedReportsService {
  constructor(
    @InjectModel(UnverifiedReport.name)
    private reportModel: Model<UnverifiedReportDocument>,
  ) {}

  create(dto: CreateUnverifiedReportDto, reporterEmail: string) {
    return this.reportModel.create({
      medicineName: dto.medicineName,
      manufacturer: dto.manufacturer ?? '',
      purchaseLocation: dto.purchaseLocation ?? '',
      notes: dto.notes ?? '',
      reportedBy: reporterEmail,
      status: 'pending',
    });
  }

  findPending() {
    return this.reportModel.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
  }

  findAll() {
    return this.reportModel.find().sort({ createdAt: -1 }).lean();
  }

  async countPending() {
    return { count: await this.reportModel.countDocuments({ status: 'pending' }) };
  }

  async markReviewed(id: string) {
    const report = await this.reportModel.findByIdAndUpdate(
      id,
      { status: 'reviewed' },
      { new: true },
    );
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
