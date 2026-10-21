import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function reset() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ecoloop');
  console.log('Connected to MongoDB');
  const hash = await bcrypt.hash('ecoloop2026', 10);
  const users = mongoose.connection.collection('users');

  // Ensure default accounts exist with exact roles and password 'ecoloop2026'
  const accounts = [
    { email: 'superadmin@ecoloop.org', fullName: 'System SuperAdmin', role: 'superadmin' },
    { email: 'admin@ecoloop.org', fullName: 'Central Admin', role: 'admin' },
    { email: 'user@ecoloop.org', fullName: 'Eco User', role: 'user' }
  ];

  for (const acc of accounts) {
    const res = await users.updateOne(
      { email: acc.email },
      {
        $set: {
          fullName: acc.fullName,
          password: hash,
          role: acc.role,
          isEmailVerified: true,
          loginAttempts: 0,
          lockUntil: null,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          metadata: {}
        }
      },
      { upsert: true }
    );
    console.log(`Account ${acc.email} (${acc.role}): upserted=${res.upsertedCount}, modified=${res.modifiedCount}`);
  }

  const allUsers = await users.find({}).project({ email: 1, role: 1, isEmailVerified: 1, loginAttempts: 1 }).toArray();
  console.log('Current users in DB:', allUsers);

  await mongoose.disconnect();
}

reset().catch(console.error);
