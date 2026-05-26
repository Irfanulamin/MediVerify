import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MedicineDocument = Medicine & Document;

@Schema({ timestamps: true })
export class Medicine {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop() genericName: string;
  @Prop() manufacturer: string;
  @Prop({ type: [String], default: [] }) uses: string[];
  @Prop({ type: [String], default: [] }) sideEffects: string[];
  @Prop({ type: [String], default: [] }) fakeIndicators: string[];
  @Prop({ type: [String], default: [] }) safeAlternatives: string[];
  @Prop({ default: 0 }) price: number;
  @Prop({ default: false }) requiresPrescription: boolean;
  @Prop({ default: true }) isVerified: boolean;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);
