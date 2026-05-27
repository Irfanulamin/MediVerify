import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;
  private readonly internalHeaders: Record<string, string>;

  constructor(private http: HttpService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
    this.internalHeaders = {
      'x-internal-token': process.env.INTERNAL_SECRET ?? '',
    };
  }

  async verifyMedicine(name: string, imageBase64?: string) {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.aiServiceUrl}/verify`,
          { medicine_name: name, image_base64: imageBase64 },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException('AI service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async checkInteractions(med1: string, med2: string) {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.aiServiceUrl}/interactions`,
          { medicine1: med1, medicine2: med2 },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException('AI service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async chat(message: string, history: unknown[]) {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.aiServiceUrl}/chat`,
          { message, history },
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException('AI service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async searchMedicines(q: string) {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.aiServiceUrl}/search`, {
          params: { q },
          headers: this.internalHeaders,
        }),
      );
      return response.data;
    } catch {
      return [];
    }
  }
}
