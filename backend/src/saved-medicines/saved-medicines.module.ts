import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedMedicine, SavedMedicineSchema } from './saved-medicine.schema';
import { SavedMedicinesService } from './saved-medicines.service';
import { SavedMedicinesController } from './saved-medicines.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SavedMedicine.name, schema: SavedMedicineSchema }]),
  ],
  providers: [SavedMedicinesService],
  controllers: [SavedMedicinesController],
  exports: [SavedMedicinesService],
})
export class SavedMedicinesModule {}
