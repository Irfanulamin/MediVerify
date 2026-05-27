import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Medicine, MedicineDocument } from '../medicines/medicine.schema';
import { VerificationHistoryService } from '../verification-history/verification-history.service';

@Injectable()
export class VerificationService {
  private readonly pythonServiceUrl: string;
  private readonly aiServiceUrl: string;
  private readonly internalHeaders: Record<string, string>;

  constructor(
    private httpService: HttpService,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    private historyService: VerificationHistoryService,
  ) {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000';
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
    this.internalHeaders = { 'x-internal-token': process.env.INTERNAL_SECRET ?? '' };
  }

  private async dbFallbackVerify(query: string) {
    const medicine = await this.medicineModel
      .findOne({ name: { $regex: query.trim(), $options: 'i' } })
      .lean();
    if (!medicine) {
      return { result: 'UNKNOWN', trustScore: 30, source: 'database', medicine: null };
    }
    return {
      result: 'VERIFIED',
      trustScore: 90,
      source: 'database',
      medicine: {
        id: (medicine as any)._id?.toString(),
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        uses: medicine.uses,
        sideEffects: medicine.sideEffects,
        fakeIndicators: medicine.fakeIndicators,
        safeAlternatives: medicine.safeAlternatives,
        price: medicine.price,
        requiresPrescription: medicine.requiresPrescription,
      },
    };
  }

  async verify(query: string, image?: string, userId?: string) {
    let result: any;
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/verify`,
          { query, image },
          { headers: this.internalHeaders },
        ),
      );
      result = response.data;
    } catch {
      result = await this.dbFallbackVerify(query);
    }

    if (userId) {
      this.historyService
        .logVerification(userId, {
          query,
          result: result.result,
          trustScore: result.trustScore,
          medicineName: result.medicine?.name ?? result.medicineName,
          source: result.source ?? 'python',
        })
        .catch(() => {});
    }

    return result;
  }

  async checkInteractions(medicine1: string, medicine2: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/interactions`,
          { medicine1, medicine2 },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Verification service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async explain(medicineName: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/explain`,
          { medicine_name: medicineName },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException('Explain service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async symptoms(symptoms: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/symptoms`,
          { symptoms },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException('Symptoms service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
