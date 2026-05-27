import { Body, Controller, Get, HttpException, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import { VerificationHistoryService } from '../verification-history/verification-history.service';

@Controller('verify')
export class VerificationController {
  constructor(
    private verificationService: VerificationService,
    private historyService: VerificationHistoryService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async verify(@Body() body: { query: string; image?: string }, @Request() req: any) {
    if (!body.query && !body.image) {
      throw new HttpException('query or image required', HttpStatus.BAD_REQUEST);
    }
    return this.verificationService.verify(body.query ?? '', body.image, req.user?.userId);
  }

  @Post('interactions')
  @UseGuards(AuthGuard('jwt'))
  async interactions(@Body() body: { medicine1: string; medicine2: string }) {
    return this.verificationService.checkInteractions(body.medicine1, body.medicine2);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async history(@Request() req: any) {
    return this.historyService.getUserHistory(req.user.userId, 50);
  }

  @Post('explain')
  @UseGuards(AuthGuard('jwt'))
  async explain(@Body() body: { medicine_name: string }) {
    return this.verificationService.explain(body.medicine_name);
  }

  @Post('symptoms')
  @UseGuards(AuthGuard('jwt'))
  async symptoms(@Body() body: { symptoms: string }) {
    return this.verificationService.symptoms(body.symptoms);
  }
}
