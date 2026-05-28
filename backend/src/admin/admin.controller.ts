import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsersWithVerificationCount();
  }

  @Get('analytics/verifications')
  getVerificationsLast7Days() {
    return this.adminService.getVerificationsLast7Days();
  }

  @Get('analytics/verifications-detail')
  getVerificationsDetail() {
    return this.adminService.getVerificationsDetail();
  }

  @Get('analytics/top-medicines')
  getTopMedicines() {
    return this.adminService.getTopMedicines();
  }

  @Get('analytics/alert-types')
  getAlertTypeBreakdown() {
    return this.adminService.getAlertTypeBreakdown();
  }

  @Get('analytics/verdicts')
  getVerdictBreakdown() {
    return this.adminService.getVerdictBreakdown();
  }

  @Get('analytics/unfound-medicines')
  getUnfoundMedicines() {
    return this.adminService.getUnfoundMedicines();
  }

  @Get('activity/recent')
  getRecentActivity() {
    return this.adminService.getRecentActivity();
  }
}
