import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VerificationService {
  private readonly pythonServiceUrl: string;

  constructor(private httpService: HttpService) {
    this.pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000';
  }

  async verify(query: string, image?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pythonServiceUrl}/verify`, { query, image }),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Verification service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async checkInteractions(medicine1: string, medicine2: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pythonServiceUrl}/interactions`, {
          medicine1,
          medicine2,
        }),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Verification service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
