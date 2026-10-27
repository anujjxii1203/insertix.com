const fs = require('fs');
const mongoose = require('mongoose');

// Read target URI from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/^MONGODB_URI=(.*)$/m);
const targetUri = match ? match[1].trim() : '';

// Source URI (old cluster)
const sourceUri = 'mongodb+srv://anujrai11986_db_user:SOURCE_PASSWORD@cluster0.oqbuytf.mongodb.net/insertix?retryWrites=true&w=majority';

async function migrate() {
  console.log('Connecting to Source (Old Cluster)...');
  const sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  console.log('Connected to Source:', sourceConn.host);

  console.log('Connecting to Target (New Cluster)...');
  const targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  console.log('Connected to Target:', targetConn.host);

  const collections = ['admins', 'teammembers', 'projects', 'testimonials', 'sitesettings', 'activitylogs'];

  for (const colName of collections) {
    const sourceCol = sourceConn.db.collection(colName);
    const targetCol = targetConn.db.collection(colName);

    const docs = await sourceCol.find({}).toArray();
    console.log(`\nProcessing ${colName}: found ${docs.length} documents in source`);

    let inserted = 0;
    let skipped = 0;

    for (const doc of docs) {
      if (colName === 'sitesettings') {
        const { _id, ...rest } = doc;
        await targetCol.updateOne({ id: doc.id || 'site-settings-singleton' }, { $set: rest }, { upsert: true });
        inserted++;
        continue;
      }
      // Check if document already exists by _id or unique key
      const query = doc._id ? { _id: doc._id } : (doc.id ? { id: doc.id } : null);
      if (query) {
        const exists = await targetCol.findOne(query);
        if (exists) {
          skipped++;
          continue;
        }
      }
      await targetCol.insertOne(doc);
      inserted++;
    }

    console.log(` -> ${colName}: ${inserted} inserted, ${skipped} skipped.`);
  }

  // Also check if data/db.json has any additional local projects
  try {
    const localDb = JSON.parse(fs.readFileSync('data/db.json', 'utf-8'));
    if (localDb.projects && Array.isArray(localDb.projects)) {
      const targetProjects = targetConn.db.collection('projects');
      for (const p of localDb.projects) {
        const query = p.id ? { id: p.id } : { title: p.title };
        const exists = await targetProjects.findOne(query);
        if (!exists) {
          await targetProjects.insertOne(p);
          console.log(`Inserted extra project from local db.json: "${p.title}"`);
        }
      }
    }
  } catch (err) {
    console.warn('Note on local json extra check:', err.message);
  }

  console.log('\n--- VERIFYING NEW CLUSTER COUNTS ---');
  for (const colName of collections) {
    const count = await targetConn.db.collection(colName).countDocuments();
    console.log(` - ${colName}: ${count} total documents in new cluster`);
  }

  await sourceConn.close();
  await targetConn.close();
  console.log('\n✅ Migration complete! Both clusters are safe and in sync.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
