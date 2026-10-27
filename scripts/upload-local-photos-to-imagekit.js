const fs = require('fs');
const mongoose = require('mongoose');

// Read target URI from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/^MONGODB_URI=(.*)$/m);
const targetUri = match ? match[1].trim() : '';

const privateKey = 'IMAGEKIT_PRIVATE_KEY';

async function uploadToImageKit(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/webp' });

  const form = new FormData();
  form.append('file', blob, fileName);
  form.append('fileName', fileName);
  form.append('folder', '/insertix/team/');

  const auth = Buffer.from(privateKey + ':').toString('base64');
  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth
    },
    body: form
  });

  const data = await res.json();
  if (data.url) {
    return data.url;
  } else {
    console.error(`ImageKit upload failed for ${fileName}:`, data);
    return null;
  }
}

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(targetUri);
  const teamCol = conn.connection.db.collection('teammembers');
  const members = await teamCol.find({}).toArray();

  for (const m of members) {
    const avatar = m.avatar || '';
    if (avatar.startsWith('/uploads/')) {
      const localRelPath = 'public' + avatar;
      const fileName = avatar.split('/').pop();
      console.log(`\nUploading photo for ${m.name}: ${localRelPath}`);
      const ikUrl = await uploadToImageKit(localRelPath, fileName);
      if (ikUrl) {
        console.log(` -> Uploaded successfully: ${ikUrl}`);
        await teamCol.updateOne({ _id: m._id }, { $set: { avatar: ikUrl } });
        console.log(` -> Updated database record for ${m.name}`);
      }
    } else {
      console.log(`\nSkipping ${m.name}: already on CDN (${avatar})`);
    }
  }

  // Also check projects cover images that might be in /uploads/
  const projectsCol = conn.connection.db.collection('projects');
  const projects = await projectsCol.find({}).toArray();
  for (const p of projects) {
    const cover = p.coverImage || '';
    if (cover.startsWith('/uploads/')) {
      const localRelPath = 'public' + cover;
      const fileName = cover.split('/').pop();
      console.log(`\nUploading project cover for "${p.title}": ${localRelPath}`);
      const ikUrl = await uploadToImageKit(localRelPath, fileName);
      if (ikUrl) {
        await projectsCol.updateOne({ _id: p._id }, { $set: { coverImage: ikUrl } });
        console.log(` -> Updated project cover for "${p.title}" to ${ikUrl}`);
      }
    }
  }

  // Also update data/db.json so local fallback stays synced
  try {
    const dbJson = JSON.parse(fs.readFileSync('data/db.json', 'utf-8'));
    const freshMembers = await teamCol.find({}).toArray();
    dbJson.team = freshMembers;
    const freshProjects = await projectsCol.find({}).toArray();
    dbJson.projects = freshProjects;
    fs.writeFileSync('data/db.json', JSON.stringify(dbJson, null, 2));
    console.log('\nSynced fresh CDN URLs to data/db.json');
  } catch (err) {
    console.warn('Could not sync data/db.json:', err.message);
  }

  console.log('\n✅ All team and project photos successfully migrated to ImageKit CDN!');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
