import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Alert, AlertDocument } from '../alerts/alert.schema';
import { Medicine, MedicineDocument } from '../medicines/medicine.schema';
import { VerificationHistory, VerificationHistoryDocument } from '../verification-history/verification-history.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    @InjectModel(VerificationHistory.name) private historyModel: Model<VerificationHistoryDocument>,
  ) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalMedicines, pendingAlerts, verificationsToday] = await Promise.all([
      this.userModel.countDocuments(),
      this.medicineModel.countDocuments(),
      this.alertModel.countDocuments({ isVerified: false }),
      this.historyModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return { totalUsers, totalMedicines, pendingAlerts, verificationsToday };
  }

  async getVerificationsLast7Days() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const docs = await this.historyModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().split('T')[0];
      const found = docs.find((x: any) => x._id === label);
      result.push({ date: label, count: found?.count ?? 0 });
    }
    return result;
  }

  async getVerificationsDetail() {
    const BN_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const [totalDocs, suspiciousDocs] = await Promise.all([
      this.historyModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      this.historyModel.aggregate([
        { $match: { createdAt: { $gte: since }, result: { $in: ['SUSPICIOUS', 'UNKNOWN'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const result: { date: string; label: string; verified: number; suspicious: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = BN_DAYS[d.getDay()];
      const total = totalDocs.find((x: any) => x._id === dateStr)?.count ?? 0;
      const suspicious = suspiciousDocs.find((x: any) => x._id === dateStr)?.count ?? 0;
      result.push({ date: dateStr, label, verified: total - suspicious, suspicious });
    }
    return result;
  }

  async getTopMedicines(limit = 10) {
    return this.historyModel.aggregate([
      { $match: { medicineName: { $exists: true, $ne: null } } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);
  }

  async getAlertTypeBreakdown() {
    return this.alertModel.aggregate([
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id', count: 1 } },
    ]);
  }

  async getVerdictBreakdown() {
    return this.historyModel.aggregate([
      { $group: { _id: '$result', count: { $sum: 1 } } },
      { $project: { _id: 0, result: '$_id', count: 1 } },
    ]);
  }

  async getRecentActivity(limit = 20) {
    const half = Math.ceil(limit / 2);
    const [verifications, alerts] = await Promise.all([
      this.historyModel.find().sort({ createdAt: -1 }).limit(half).lean(),
      this.alertModel.find().sort({ createdAt: -1 }).limit(half).lean(),
    ]);

    const items = [
      ...verifications.map((v: any) => ({
        type: 'verification',
        description: `${v.medicineName ?? v.query} — ${v.result}`,
        createdAt: v.createdAt,
      })),
      ...alerts.map((a: any) => ({
        type: 'alert',
        description: `Alert: ${a.medicineName} (${a.alertType}) in ${a.location ?? 'Unknown'}`,
        createdAt: a.createdAt,
      })),
    ];

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getUnfoundMedicines() {
    return this.historyModel.aggregate([
      { $match: { foundInDatabase: { $ne: true } } },
      { $group: { _id: '$medicineName', count: { $sum: 1 }, lastSearched: { $max: '$createdAt' } } },
      { $match: { _id: { $exists: true, $ne: null } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1, lastSearched: 1 } },
    ]);
  }

  async getUsersWithVerificationCount() {
    const [users, counts] = await Promise.all([
      this.userModel.find().select('-password').lean(),
      this.historyModel.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id, c.count]));
    return users.map((u: any) => ({
      ...u,
      verificationsCount: countMap.get(String(u._id)) ?? 0,
    }));
  }

  getUsers() {
    return this.userModel.find().select('-password').lean();
  }
}
