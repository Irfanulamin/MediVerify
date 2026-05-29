import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Lightweight liveness probe — used by Render health checks and the keep-alive cron. */
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime(), ts: new Date().toISOString() };
  }
}
