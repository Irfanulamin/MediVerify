import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnverifiedReportsService } from './unverified-reports.service';
import { CreateUnverifiedReportDto } from './dto/create-unverified-report.dto';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';

@Controller('unverified-reports')
export class UnverifiedReportsController {
  constructor(private reportsService: UnverifiedReportsService) {}

  /** Authenticated users — submit a new report */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateUnverifiedReportDto, @Request() req: any) {
    return this.reportsService.create(dto, req.user.email);
  }

  /** Admin — list pending reports */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  findPending() {
    return this.reportsService.findPending();
  }

  /** Admin — count pending (for nav badge) */
  @Get('pending/count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  countPending() {
    return this.reportsService.countPending();
  }

  /** Admin — mark a report as reviewed */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  markReviewed(@Param('id', ParseObjectIdPipe) id: string) {
    return this.reportsService.markReviewed(id);
  }
}
