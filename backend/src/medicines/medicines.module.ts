import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Medicine, MedicineSchema } from './medicine.schema';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Medicine.name, schema: MedicineSchema }]),
    HttpModule,
  ],
  providers: [MedicinesService],
  controllers: [MedicinesController],
  exports: [MedicinesService],
})
export class MedicinesModule {}
