import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';

@Controller('verify')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async verify(@Body() body: { query: string; image?: string }) {
    if (!body.query && !body.image) {
      throw new HttpException('query or image required', HttpStatus.BAD_REQUEST);
    }
    return this.verificationService.verify(body.query ?? '', body.image);
  }

  @Post('interactions')
  @UseGuards(AuthGuard('jwt'))
  async interactions(@Body() body: { medicine1: string; medicine2: string }) {
    return this.verificationService.checkInteractions(body.medicine1, body.medicine2);
  }
}
