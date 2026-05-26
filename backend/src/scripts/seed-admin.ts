import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI must be set in .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const User = mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: ADMIN_EMAIL!.toLowerCase() });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD!, 10);
  await User.create({
    name: 'Admin',
    email: ADMIN_EMAIL!.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  console.log(`Admin created: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
