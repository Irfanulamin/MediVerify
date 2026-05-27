import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedMedicine, SavedMedicineDocument } from './saved-medicine.schema';

@Injectable()
export class SavedMedicinesService {
  constructor(
    @InjectModel(SavedMedicine.name)
    private savedModel: Model<SavedMedicineDocument>,
  ) {}

  async save(userId: string, data: { medicineId: string; medicineName: string; genericName?: string }) {
    return this.savedModel.findOneAndUpdate(
      { userId, medicineId: data.medicineId },
      { $setOnInsert: { userId, ...data } },
      { upsert: true, new: true },
    );
  }

  async findByUser(userId: string) {
    return this.savedModel.find({ userId }).sort({ savedAt: -1 }).lean();
  }

  async remove(userId: string, id: string) {
    return this.savedModel.findOneAndDelete({ _id: id, userId });
  }

  async getUserCount(userId: string): Promise<number> {
    return this.savedModel.countDocuments({ userId });
  }
}
