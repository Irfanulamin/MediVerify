import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Alert, AlertDocument } from '../alerts/alert.schema';
import { Medicine, MedicineDocument } from '../medicines/medicine.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
  ) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalAlerts, totalMedicines] = await Promise.all([
      this.userModel.countDocuments(),
      this.alertModel.countDocuments(),
      this.medicineModel.countDocuments(),
    ]);

    return {
      totalUsers,
      totalAlerts,
      totalMedicines,
      verificationsToday: 0,
    };
  }

  getUsers() {
    return this.userModel.find().select('-password').lean();
  }
}
