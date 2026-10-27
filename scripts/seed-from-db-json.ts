import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  ProjectModel,
  TeamMemberModel,
  TestimonialModel,
  ContactMessageModel,
  SiteSettingsModel,
} from "../src/lib/models";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

interface LocalData {
  projects?: any[];
  team?: any[];
  testimonials?: any[];
  contactMessages?: any[];
  siteSettings?: any;
}

export async function runMigration(isDryRun = true) {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`[ERROR] File not found: ${DB_FILE}`);
    return;
  }

  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const local: LocalData = JSON.parse(raw);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[ERROR] MONGODB_URI is not set in environment");
    return;
  }

  await mongoose.connect(uri);
  console.log(`[SEED] Connected to MongoDB: ${mongoose.connection.name}`);

  const plannedInserts: { [collection: string]: any[] } = {
    projects: [],
    teammembers: [],
    testimonials: [],
    contactmessages: [],
    sitesettings: [],
  };

  // 1. Projects
  if (local.projects && local.projects.length > 0) {
    const existing = await ProjectModel.find({}, { id: 1 }).lean();
    const existingIds = new Set(existing.map((e: any) => e.id));
    for (const p of local.projects) {
      if (!existingIds.has(p.id)) {
        plannedInserts.projects.push(p);
      }
    }
  }

  // 2. Team Members
  if (local.team && local.team.length > 0) {
    const existing = await TeamMemberModel.find({}, { id: 1 }).lean();
    const existingIds = new Set(existing.map((e: any) => e.id));
    for (const t of local.team) {
      if (!existingIds.has(t.id)) {
        plannedInserts.teammembers.push(t);
      }
    }
  }

  // 3. Testimonials
  if (local.testimonials && local.testimonials.length > 0) {
    const existing = await TestimonialModel.find({}, { id: 1 }).lean();
    const existingIds = new Set(existing.map((e: any) => e.id));
    for (const t of local.testimonials) {
      if (!existingIds.has(t.id)) {
        plannedInserts.testimonials.push(t);
      }
    }
  }

  // 4. Contact Messages
  if (local.contactMessages && local.contactMessages.length > 0) {
    const existing = await ContactMessageModel.find({}, { id: 1 }).lean();
    const existingIds = new Set(existing.map((e: any) => e.id));
    for (const c of local.contactMessages) {
      if (!existingIds.has(c.id)) {
        plannedInserts.contactmessages.push(c);
      }
    }
  }

  // 5. Site Settings
  if (local.siteSettings) {
    const existingSettings = await SiteSettingsModel.findOne({ id: "site-settings-singleton" }).lean();
    if (!existingSettings) {
      plannedInserts.sitesettings.push(local.siteSettings);
    }
  }

  console.log("\n================ DRY-RUN SUMMARY ================");
  console.log(`- projects to insert: ${plannedInserts.projects.length}`);
  console.log(`- teammembers to insert: ${plannedInserts.teammembers.length}`);
  console.log(`- testimonials to insert: ${plannedInserts.testimonials.length}`);
  console.log(`- contactmessages to insert: ${plannedInserts.contactmessages.length}`);
  console.log(`- sitesettings to insert: ${plannedInserts.sitesettings.length}`);

  if (plannedInserts.contactmessages.length > 0) {
    console.log("\nDetails of planned contactmessages inserts:");
    for (const c of plannedInserts.contactmessages) {
      console.log(`  + ID: ${c.id} | Name: ${c.name} | Email: ${c.email} | Service: ${c.service}`);
    }
  }

  if (isDryRun) {
    console.log("\n[DRY RUN ONLY] No changes were written to MongoDB.");
    await mongoose.disconnect();
    return plannedInserts;
  }

  console.log("\nExecuting INSERT-ONLY migration to MongoDB...");

  if (plannedInserts.projects.length > 0) {
    await ProjectModel.insertMany(plannedInserts.projects);
    console.log(`Inserted ${plannedInserts.projects.length} projects.`);
  }
  if (plannedInserts.teammembers.length > 0) {
    await TeamMemberModel.insertMany(plannedInserts.teammembers);
    console.log(`Inserted ${plannedInserts.teammembers.length} team members.`);
  }
  if (plannedInserts.testimonials.length > 0) {
    await TestimonialModel.insertMany(plannedInserts.testimonials);
    console.log(`Inserted ${plannedInserts.testimonials.length} testimonials.`);
  }
  if (plannedInserts.contactmessages.length > 0) {
    await ContactMessageModel.insertMany(plannedInserts.contactmessages);
    console.log(`Inserted ${plannedInserts.contactmessages.length} contact messages.`);
  }
  if (plannedInserts.sitesettings.length > 0) {
    await SiteSettingsModel.create(plannedInserts.sitesettings[0]);
    console.log("Inserted site settings singleton.");
  }

  console.log("\n[SUCCESS] Migration completed safely (insert-only).");
  await mongoose.disconnect();
  return plannedInserts;
}

if (require.main === module) {
  const isDryRun = !process.argv.includes("--execute");
  runMigration(isDryRun).catch((err) => {
    console.error("[FATAL ERROR]", err);
    process.exit(1);
  });
}
