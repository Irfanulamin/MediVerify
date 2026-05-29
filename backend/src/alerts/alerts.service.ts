import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument, AlertType, AlertStatus } from './alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';

const SEED_ALERTS: Array<Partial<Alert>> = [
  {
    medicineName: 'Napa Extra',
    alertType: 'Fake',
    location: 'Mirpur, Dhaka',
    pharmacyName: 'Al-Madina Pharmacy',
    description: 'Counterfeit Napa Extra blister without Beximco hologram. Tablet colour slightly off, blister foil tears unusually easily.',
    batchNumber: 'BX2024XXX',
    status: 'verified',
  },
  {
    medicineName: 'Ciprofloxacin 500mg',
    alertType: 'Mislabeled',
    location: 'New Market, Chittagong',
    pharmacyName: 'City Care Pharmacy',
    description: 'Generic Ciprofloxacin strips with incorrect dosage information — label says 250mg but tablet markings indicate 500mg strength.',
    status: 'verified',
  },
  {
    medicineName: 'Insulin Regular',
    alertType: 'Expired',
    location: 'Zindabazar, Sylhet',
    pharmacyName: 'Healthline Pharma',
    description: 'Expired insulin vials sold with a sticker over the original expiry date showing a false future date.',
    status: 'pending',
  },
  {
    medicineName: 'Omeprazole 20mg',
    alertType: 'Fake',
    location: 'Boalia, Rajshahi',
    pharmacyName: 'Popular Drug House',
    description: 'Capsules sold as branded Seclo but contents dissolve immediately on touch — no enteric coating, likely sugar pellets.',
    status: 'verified',
  },
  {
    medicineName: 'Azithromycin 250mg',
    alertType: 'Fake',
    location: 'Khulna Sadar',
    pharmacyName: 'Sebak Pharmacy',
    description: 'Substandard Azithromycin tablets with uneven coating and spelling errors on packaging. Independent lab test reported only 60% active ingredient.',
    status: 'verified',
  },
  {
    medicineName: 'Metformin 500mg',
    alertType: 'Mislabeled',
    location: 'Rajshahi City',
    pharmacyName: 'Padma Pharmacy',
    description: 'Metformin strips with missing storage instructions and batch number printed in non-standard format. Possibly repackaged from bulk supply.',
    status: 'verified',
  },
  {
    medicineName: 'Amlodipine 5mg',
    alertType: 'Suspicious',
    location: 'Ambarkhana, Sylhet',
    pharmacyName: 'Sylhet Medicine Mart',
    description: 'Tablets feel chalky with no embossed markings; outer pack shows no DGDA registration number. Reviewed against the manufacturer batch record and confirmed genuine — marked as a false alert.',
    status: 'rejected',
  },
  {
    medicineName: 'Amoxicillin 500mg',
    alertType: 'Expired',
    location: 'Gulshan, Dhaka',
    pharmacyName: 'Lazz Pharma',
    description: 'Expired Amoxicillin capsules with tampered expiry stickers spotted at a Mirpur wholesale market. Capsule contents show discolouration.',
    status: 'verified',
  },
  {
    medicineName: 'Napa Syrup',
    alertType: 'WrongDosage',
    location: 'Agrabad, Chittagong',
    pharmacyName: 'Chattogram Health Store',
    description: 'Paediatric paracetamol syrup with measuring spoon marked 5ml but actual capacity is closer to 7ml. Risk of accidental overdose in children.',
    status: 'verified',
  },
  {
    medicineName: 'Diazepam 5mg',
    alertType: 'Suspicious',
    location: 'Banani, Dhaka',
    pharmacyName: 'Care Plus Pharmacy',
    description: 'Diazepam sold without prescription requirement enforcement. Packaging looks legitimate but the pharmacy did not check any documentation.',
    status: 'pending',
  },
];

interface FindAllOptions {
  page?: number;
  limit?: number;
  alertType?: string;
  sort?: 'latest' | 'upvotes';
}

@Injectable()
export class AlertsService implements OnModuleInit {
  constructor(@InjectModel(Alert.name) private alertModel: Model<AlertDocument>) {}

  async onModuleInit() {
    // Backfill legacy docs created before the `status` enum (idempotent).
    await this.alertModel.updateMany(
      { status: { $exists: false }, isVerified: true },
      { $set: { status: 'verified' }, $unset: { isVerified: '' } },
    );
    await this.alertModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' }, $unset: { isVerified: '' } },
    );

    for (const alert of SEED_ALERTS) {
      await this.alertModel.updateOne(
        {
          medicineName: alert.medicineName,
          alertType: alert.alertType,
          location: alert.location,
        },
        { $setOnInsert: alert },
        { upsert: true },
      );
    }
  }

  async findAll(opts: FindAllOptions = {}) {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
    const skip = (page - 1) * limit;

    // Public feed shows all statuses; each card surfaces its status badge.
    const query: Record<string, unknown> = {};
    if (opts.alertType) query.alertType = opts.alertType;

    let cursor;
    if (opts.sort === 'upvotes') {
      // Sort by upvote-count desc, then createdAt desc — needs an aggregation
      const items = await this.alertModel
        .aggregate([
          { $match: query },
          { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
          { $sort: { upvoteCount: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
        .exec();
      const total = await this.alertModel.countDocuments(query);
      return { items, page, limit, total };
    }

    cursor = this.alertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const [items, total] = await Promise.all([
      cursor.lean(),
      this.alertModel.countDocuments(query),
    ]);
    return { items, page, limit, total };
  }

  findAllAdmin() {
    return this.alertModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(dto: CreateAlertDto, reporterEmail: string) {
    const alert = new this.alertModel({
      medicineName: dto.medicineName,
      alertType: dto.alertType as AlertType,
      location: dto.location,
      description: dto.description,
      pharmacyName: dto.pharmacyName ?? '',
      batchNumber: dto.batchNumber ?? '',
      photoUrl: dto.photoUrl ?? '',
      reportedBy: reporterEmail,
      status: 'pending' as AlertStatus,
      upvotes: [],
    });
    return alert.save();
  }

  async countAll() {
    return { count: await this.alertModel.countDocuments() };
  }

  async countVerified() {
    return { count: await this.alertModel.countDocuments({ status: 'verified' }) };
  }

  async approve(id: string) {
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { status: 'verified' },
      { new: true },
    );
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async reject(id: string) {
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true },
    );
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async remove(id: string) {
    const alert = await this.alertModel.findByIdAndDelete(id);
    if (!alert) throw new NotFoundException('Alert not found');
    return { deleted: true };
  }

  async upvote(id: string, userId: string) {
    const alert = await this.alertModel.findById(id);
    if (!alert) throw new NotFoundException('Alert not found');
    const uid = new Types.ObjectId(userId);
    const existing = (alert.upvotes ?? []).map((u) => u.toString());
    if (existing.includes(userId)) {
      alert.upvotes = (alert.upvotes ?? []).filter((u) => u.toString() !== userId);
    } else {
      alert.upvotes = [...(alert.upvotes ?? []), uid];
    }
    await alert.save();
    return alert;
  }
}
