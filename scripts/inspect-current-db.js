const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/^MONGODB_URI=(.*)$/m);
const uri = match ? match[1].trim() : '';

function maskUri(u) {
  if (!u) return 'NONE';
  return u.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

console.log('Current MONGODB_URI (masked):', maskUri(uri));

async function inspect() {
  if (!uri) {
    console.log('No MONGODB_URI found.');
    return;
  }
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  console.log('Connected host:', conn.host);
  console.log('Connected database name:', conn.name);
  
  // List collections in current database
  const collections = await conn.db.listCollections().toArray();
  console.log('\nCollections in database [' + conn.name + ']:');
  for (const c of collections) {
    const count = await conn.db.collection(c.name).countDocuments();
    console.log(' - ' + c.name + ': ' + count + ' documents');
  }

  // List all databases on this cluster
  const admin = conn.db.admin();
  const dbs = await admin.listDatabases();
  console.log('\nAll databases on this cluster:');
  for (const dbInfo of dbs.databases) {
    console.log(' - ' + dbInfo.name + ' (' + Math.round(dbInfo.sizeOnDisk / 1024) + ' KB)');
    if (!['admin', 'local'].includes(dbInfo.name)) {
      const dbConn = conn.useDb(dbInfo.name);
      const cols = await dbConn.db.listCollections().toArray();
      for (const col of cols) {
        const count = await dbConn.db.collection(col.name).countDocuments();
        console.log('     * ' + col.name + ': ' + count + ' docs');
      }
    }
  }

  await conn.close();
}

inspect().catch(err => {
  console.error('Inspection error:', err.message);
});
