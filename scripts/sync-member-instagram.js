const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/^MONGODB_URI=(.*)$/m);
const uri = match ? match[1].trim() : '';

const handles = {
  'Kavita Goswami': 'https://www.instagram.com/kavitaa_19/',
  'Rudransh Singh': 'https://www.instagram.com/someonewhofilms/',
  'Advik Bajpai': 'https://www.instagram.com/khichkyaun/',
  'Pratyush Rohilla': 'https://www.instagram.com/pratyush__rohilla/'
};

async function run() {
  const conn = await mongoose.connect(uri);
  const teamCol = conn.connection.db.collection('teammembers');
  for (const [name, insta] of Object.entries(handles)) {
    const updateObj = {
      $set: {
        instagram: insta,
        'socials.instagram': insta
      }
    };
    await teamCol.updateOne({ name }, updateObj);
    console.log('Updated instagram for', name, '->', insta);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
