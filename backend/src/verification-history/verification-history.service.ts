import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationHistory, VerificationHistoryDocument } from './verification-history.schema';

@Injectable()
export class VerificationHistoryService {
  constructor(
    @InjectModel(VerificationHistory.name)
    private historyModel: Model<VerificationHistoryDocument>,
  ) {}

  async logVerification(
    userId: string,
    data: {
      query: string;
      result: string;
      trustScore?: number;
      medicineName?: string;
      source?: string;
    },
  ): Promise<void> {
    await this.historyModel.create({
      userId,
      query: data.query,
      result: data.result,
      trustScore: data.trustScore ?? 0,
      medicineName: data.medicineName,
      source: data.source,
    });
  }

  async getUserHistory(userId: string, limit = 50) {
    return this.historyModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getUserCount(userId: string): Promise<number> {
    return this.historyModel.countDocuments({ userId });
  }
}
