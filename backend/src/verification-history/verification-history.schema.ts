import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VerificationHistoryDocument = VerificationHistory & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class VerificationHistory {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) query: string;
  @Prop({ required: true, enum: ['VERIFIED', 'SUSPICIOUS', 'UNKNOWN'] }) result: string;
  @Prop({ default: 0 }) trustScore: number;
  @Prop() medicineName?: string;
  @Prop() source?: string;
}

export const VerificationHistorySchema = SchemaFactory.createForClass(VerificationHistory);
VerificationHistorySchema.index({ userId: 1, createdAt: -1 });
