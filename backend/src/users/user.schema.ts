import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ _id: false })
class UserProfile {
  @Prop() displayName?: string;
  @Prop({ type: [String], default: [] }) medications: string[];
  @Prop({ type: [String], default: [] }) allergies: string[];
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role: 'user' | 'admin';

  @Prop({ type: UserProfile, default: () => ({ medications: [], allergies: [] }) })
  profile: UserProfile;
}

export const UserSchema = SchemaFactory.createForClass(User);
