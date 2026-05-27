import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from './alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';

const SEED_ALERTS = [
  {
    medicineName: 'Napa Extra',
    alertType: 'Fake',
    location: 'Dhaka',
    description: 'Counterfeit Napa Extra found without Beximco Pharmaceuticals hologram. Tablet color slightly off and blister print quality poor.',
    isVerified: true,
  },
  {
    medicineName: 'Ciprofloxacin 500mg',
    alertType: 'Mislabeled',
    location: 'Chattogram',
    description: 'Generic Ciprofloxacin strips found with incorrect dosage information — label says 250mg but tablets are 500mg strength.',
    isVerified: true,
  },
  {
    medicineName: 'Insulin Regular',
    alertType: 'Expired',
    location: 'Sylhet',
    description: 'Expired insulin vials sold at several pharmacies. Expiry date printed over with a sticker showing false future date.',
    isVerified: false,
  },
  {
    medicineName: 'Omeprazole 20mg',
    alertType: 'Fake',
    location: 'Rajshahi',
    description: 'Capsules with no enteric coating sold as branded Seclo. Contents dissolve immediately — ineffective and potentially harmful.',
    isVerified: false,
  },
  {
    medicineName: 'Azithromycin 250mg',
    alertType: 'Fake',
    location: 'Khulna',
    description: 'Substandard Azithromycin tablets found with uneven coating and spelling errors on packaging. Lab test showed only 60% active ingredient.',
    isVerified: true,
  },
  {
    medicineName: 'Metformin 500mg',
    alertType: 'Mislabeled',
    location: 'Rajshahi',
    description: 'Metformin strips with missing storage instructions and batch number printed in incorrect format. Possibly repackaged from bulk supply.',
    isVerified: true,
  },
  {
    medicineName: 'Amlodipine 5mg',
    alertType: 'Fake',
    location: 'Sylhet',
    description: 'Fake Amlodipine tablets with chalk-like texture and no embossed markings. Original packaging shows no DGDA registration number.',
    isVerified: false,
  },
  {
    medicineName: 'Amoxicillin 500mg',
    alertType: 'Expired',
    location: 'Dhaka',
    description: 'Expired Amoxicillin capsules with tampered expiry stickers found at a Mirpur wholesale market. Capsule contents show discoloration.',
    isVerified: true,
  },
];

@Injectable()
export class AlertsService implements OnModuleInit {
  constructor(@InjectModel(Alert.name) private alertModel: Model<AlertDocument>) {}

  async onModuleInit() {
    const count = await this.alertModel.countDocuments();
    if (count === 0) {
      await this.alertModel.insertMany(SEED_ALERTS);
    }
  }

  findAll() {
    return this.alertModel.find({ isVerified: true }).sort({ createdAt: -1 }).lean();
  }

  findAllAdmin() {
    return this.alertModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(dto: CreateAlertDto, reporterEmail: string) {
    const alert = new this.alertModel({
      ...dto,
      reportedBy: reporterEmail,
      isVerified: false,
    });
    return alert.save();
  }

  async countAll() {
    return { count: await this.alertModel.countDocuments() };
  }

  async countVerified() {
    return { count: await this.alertModel.countDocuments({ isVerified: true }) };
  }

  async approve(id: string) {
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { isVerified: true },
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
}
