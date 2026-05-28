import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

export const ALERT_TYPES = ['Fake', 'Expired', 'Mislabeled', 'WrongDosage', 'Suspicious'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true }) medicineName: string;
  @Prop({ type: String, enum: ALERT_TYPES, required: true }) alertType: AlertType;
  @Prop({ required: true }) location: string;
  @Prop({ required: true }) description: string;
  @Prop({ default: '' }) pharmacyName: string;
  @Prop({ default: '' }) batchNumber: string;
  @Prop({ default: '' }) photoUrl: string;
  @Prop({ default: false }) isVerified: boolean;
  @Prop({ default: '' }) reportedBy: string;
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) upvotes: Types.ObjectId[];
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
