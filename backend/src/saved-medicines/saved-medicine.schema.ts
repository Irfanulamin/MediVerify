import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SavedMedicineDocument = SavedMedicine & Document;

@Schema({ timestamps: { createdAt: 'savedAt', updatedAt: false } })
export class SavedMedicine {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) medicineId: string;
  @Prop({ required: true }) medicineName: string;
  @Prop() genericName?: string;
}

export const SavedMedicineSchema = SchemaFactory.createForClass(SavedMedicine);
SavedMedicineSchema.index({ userId: 1, medicineId: 1 }, { unique: true });
