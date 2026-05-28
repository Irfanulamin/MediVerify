import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { VerificationHistoryService } from '../verification-history/verification-history.service';

@Injectable()
export class VerificationService {
  private readonly pythonServiceUrl: string;
  private readonly aiServiceUrl: string;
  private readonly internalHeaders: Record<string, string>;

  constructor(
    private httpService: HttpService,
    private historyService: VerificationHistoryService,
  ) {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000';
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
    this.internalHeaders = { 'x-internal-token': process.env.INTERNAL_SECRET ?? '' };
  }

  async verify(query: string, image?: string, userId?: string) {
    let result: any;
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/verify`,
          { medicine_name: query, image_base64: image ?? null },
          { headers: this.internalHeaders },
        ),
      );
      result = response.data;
    } catch {
      throw new HttpException('Verification service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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

  async investigate(body: Record<string, unknown>) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pythonServiceUrl}/investigate`, body, {
          headers: this.internalHeaders,
        }),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Investigation service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async compare(name: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/compare`,
          { name },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Compare service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async extractFromSpeech(transcript: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/extract-from-speech`,
          { transcript },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Extraction service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
