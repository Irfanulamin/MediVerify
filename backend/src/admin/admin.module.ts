import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema, UserDocument } from '../users/user.schema';
import { Alert, AlertSchema } from '../alerts/alert.schema';
import { Medicine, MedicineSchema } from '../medicines/medicine.schema';
import { VerificationHistory, VerificationHistorySchema } from '../verification-history/verification-history.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: Medicine.name, schema: MedicineSchema },
      { name: VerificationHistory.name, schema: VerificationHistorySchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    const adminEmail = 'admin@mediverify.com';
    const existing = await this.userModel.findOne({ email: adminEmail });
    if (!existing) {
      const hashed = await bcrypt.hash('Admin@1234', 10);
      await this.userModel.create({
        name: 'Admin',
        email: adminEmail,
        password: hashed,
        role: 'admin',
      });
    }
  }
}
