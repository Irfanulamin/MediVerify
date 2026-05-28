import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';

@Controller()
export class InvestigationController {
  constructor(private verificationService: VerificationService) {}

  @Post('investigate')
  @UseGuards(AuthGuard('jwt'))
  async investigate(
    @Body()
    body: {
      medicine_name: string;
      manufacturer?: string;
      batch_number?: string;
      expiry_date?: string;
      purchase_location?: string;
      price_paid?: number;
    },
  ) {
    if (!body.medicine_name) {
      throw new HttpException('medicine_name is required', HttpStatus.BAD_REQUEST);
    }
    return this.verificationService.investigate(body);
  }

  @Post('extract-from-speech')
  @UseGuards(AuthGuard('jwt'))
  async extractFromSpeech(@Body() body: { transcript: string }) {
    if (!body.transcript) {
      throw new HttpException('transcript is required', HttpStatus.BAD_REQUEST);
    }
    return this.verificationService.extractFromSpeech(body.transcript);
  }

  @Post('compare')
  @UseGuards(AuthGuard('jwt'))
  async compare(@Body() body: { name: string }) {
    if (!body.name) {
      throw new HttpException('name is required', HttpStatus.BAD_REQUEST);
    }
    return this.verificationService.compare(body.name);
  }
}
