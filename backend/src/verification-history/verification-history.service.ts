import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationHistory, VerificationHistoryDocument } from './verification-history.schema';

const SAMPLE_MEDICINES = [
  'Napa Extra', 'Seclo 20mg', 'Ciprofloxacin 500mg', 'Amodis 400mg', 'Metformin 500mg',
  'Atenolol 50mg', 'Napa 500mg', 'Omeprazole 20mg', 'Azithromycin 250mg', 'Cetirizine 10mg',
  'Rifampicin 600mg', 'Paracetamol 500mg', 'Amoxicillin 500mg', 'Doxycycline 100mg',
  'Atorvastatin 10mg', 'Losartan 50mg', 'Amlodipine 5mg', 'Metronidazole 400mg',
  'Fluconazole 150mg', 'Prednisolone 5mg',
];
const VERDICTS = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'SUSPICIOUS', 'UNKNOWN'] as const;

@Injectable()
export class VerificationHistoryService implements OnModuleInit {
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
      foundInDatabase?: boolean;
      searchType?: string;
    },
  ): Promise<void> {
    await this.historyModel.create({
      userId,
      query: data.query,
      result: data.result,
      trustScore: data.trustScore ?? 0,
      medicineName: data.medicineName,
      source: data.source,
      foundInDatabase: data.foundInDatabase ?? false,
      searchType: data.searchType ?? 'verify',
    });
  }

  async onModuleInit() {
    const count = await this.historyModel.countDocuments();
    if (count < 20) {
      const now = Date.now();
      const docs = SAMPLE_MEDICINES.map((name, i) => {
        const daysAgo = i % 7;
        const createdAt = new Date(now - daysAgo * 86400000 - Math.random() * 3600000);
        const result = VERDICTS[i % VERDICTS.length];
        return {
          userId: 'seed-user',
          query: name,
          result,
          trustScore: result === 'VERIFIED' ? 80 + Math.floor(Math.random() * 18) : 20 + Math.floor(Math.random() * 30),
          medicineName: name,
          source: 'seed',
          foundInDatabase: result !== 'UNKNOWN',
          searchType: 'verify',
          createdAt,
        };
      });
      await this.historyModel.insertMany(docs);
    }
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
