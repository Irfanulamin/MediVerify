import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true }) medicineName: string;
  @Prop({ type: String, enum: ['Fake', 'Expired', 'Mislabeled'], required: true }) alertType: string;
  @Prop({ required: true }) location: string;
  @Prop({ required: true }) description: string;
  @Prop({ default: false }) isVerified: boolean;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
