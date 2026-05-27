import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      ...data,
      email: data.email.toLowerCase(),
    });
    return user.save();
  }

  async updateProfile(
    userId: string,
    profile: { displayName?: string; medications?: string[]; allergies?: string[] },
  ) {
    const update: Record<string, any> = {};
    if (profile.displayName !== undefined) update['profile.displayName'] = profile.displayName;
    if (profile.medications !== undefined) update['profile.medications'] = profile.medications;
    if (profile.allergies !== undefined) update['profile.allergies'] = profile.allergies;
    return this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-password')
      .lean();
  }
}
