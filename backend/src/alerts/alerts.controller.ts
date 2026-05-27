import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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

  /** Public — verified alerts only */
  @Get()
  findAll() {
    return this.alertsService.findAll();
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

  /** Admin — verify/approve an alert */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  approve(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.approve(id);
  }

  /** Admin — delete an alert */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.remove(id);
  }
}
