const mongoose = require('mongoose');

// Testing the previous cluster (from atlas-credentials.env) read-only
const oldUri = 'mongodb+srv://anujrai11986_db_user:SOURCE_PASSWORD@cluster0.oqbuytf.mongodb.net/insertix?retryWrites=true&w=majority';

async function checkOldCluster() {
  try {
    const conn = await mongoose.createConnection(oldUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log('Successfully connected to PREVIOUS cluster:', conn.host);
    const admin = conn.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases on previous cluster:');
    for (const dbInfo of dbs.databases) {
      console.log(' - ' + dbInfo.name);
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
  } catch (err) {
    console.log('Old cluster connection failed or unreachable:', err.message);
  }
}

checkOldCluster();
