const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const envText = fs.readFileSync('.env.local', 'utf8');
  const match = envText.match(/MONGODB_URI=(.*)/);
  if (!match) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }
  const uri = match[1].trim();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const hash = bcrypt.hashSync('admin123', 10);
  await mongoose.connection.db.collection('admins').updateOne(
    { email: 'admin@insertixmedia.com' },
    {
      $set: {
        id: 'admin-1',
        email: 'admin@insertixmedia.com',
        name: 'Insertix Director',
        passwordHash: hash,
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  console.log('SUCCESS: Admin seeded in Atlas database');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});
