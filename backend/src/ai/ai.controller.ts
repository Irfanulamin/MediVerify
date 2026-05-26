import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('api')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  async verify(@Body() body: { medicine_name?: string; image_base64?: string }) {
    if (!body.medicine_name && !body.image_base64) {
      throw new HttpException('medicine_name or image_base64 required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.verifyMedicine(body.medicine_name ?? '', body.image_base64);
  }

  @Post('interactions')
  @UseGuards(AuthGuard('jwt'))
  async interactions(@Body() body: { medicine1: string; medicine2: string }) {
    if (!body.medicine1 || !body.medicine2) {
      throw new HttpException('medicine1 and medicine2 are required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.checkInteractions(body.medicine1, body.medicine2);
  }

  @Post('chat')
  @UseGuards(AuthGuard('jwt'))
  async chat(@Body() body: { message: string; history?: unknown[] }) {
    return this.aiService.chat(body.message, body.history ?? []);
  }

  @Get('search')
  async search(@Query('q') q: string = '') {
    return this.aiService.searchMedicines(q);
  }
}
