import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UnverifiedReportDocument = UnverifiedReport & Document;

@Schema({ timestamps: true })
export class UnverifiedReport {
  @Prop({ required: true }) medicineName: string;
  @Prop({ default: '' }) manufacturer: string;
  @Prop({ default: '' }) purchaseLocation: string;
  @Prop({ default: '' }) notes: string;
  @Prop({ default: '' }) reportedBy: string;
  @Prop({ type: String, enum: ['pending', 'reviewed'], default: 'pending' }) status: string;
}

export const UnverifiedReportSchema = SchemaFactory.createForClass(UnverifiedReport);
