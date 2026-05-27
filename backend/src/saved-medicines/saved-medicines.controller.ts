import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SavedMedicinesService } from './saved-medicines.service';

@Controller('saved-medicines')
@UseGuards(AuthGuard('jwt'))
export class SavedMedicinesController {
  constructor(private service: SavedMedicinesService) {}

  @Post()
  save(
    @Body() body: { medicineId: string; medicineName: string; genericName?: string },
    @Request() req: any,
  ) {
    return this.service.save(req.user.userId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.service.findByUser(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(req.user.userId, id);
  }
}
