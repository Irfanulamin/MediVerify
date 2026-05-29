import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertsService } from './alerts.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  /** Public — verified alerts, paginated with filter/sort */
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('alertType') alertType?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: 'latest' | 'upvotes',
  ) {
    return this.alertsService.findAll({
      page: Number(page),
      limit: Number(limit),
      alertType: alertType || undefined,
      status: status || undefined,
      sort: sort === 'upvotes' ? 'upvotes' : 'latest',
    });
  }

  /** Admin — all alerts including unverified */
  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  findAllAdmin() {
    return this.alertsService.findAllAdmin();
  }

  /** Admin — total count */
  @Get('count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  countAll() {
    return this.alertsService.countAll();
  }

  /** Admin — verified count */
  @Get('verified/count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  countVerified() {
    return this.alertsService.countVerified();
  }

  /** Authenticated users — report a new alert */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateAlertDto, @Request() req: any) {
    return this.alertsService.create(dto, req.user.email);
  }

  /** Authenticated users — toggle upvote on an alert */
  @Patch(':id/upvote')
  @UseGuards(AuthGuard('jwt'))
  upvote(@Param('id', ParseObjectIdPipe) id: string, @Request() req: any) {
    return this.alertsService.upvote(id, req.user.userId);
  }

  /** Admin — verify/approve an alert */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  approve(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.approve(id);
  }

  /** Admin — reject an alert (mark as false alert, keep the record) */
  @Patch(':id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  reject(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.reject(id);
  }

  /** Admin — delete an alert */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.remove(id);
  }
}
