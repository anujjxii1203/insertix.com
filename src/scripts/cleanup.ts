import fs from "fs";
import path from "path";
import { connectDB } from "../lib/db";
import {
  ProjectModel,
  TestimonialModel,
  TeamMemberModel,
  ContactMessageModel,
} from "../lib/models";
import { seed } from "./seed";

const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");
const VALID_SERVICES = [
  "Video Shoots",
  "Photoshoots",
  "Marketing",
  "Product Shoot",
  "Event Shoots",
  "Other / Multiple Services",
];

async function cleanup() {
  console.log("🧹 Starting Insertix Media database cleanup & migration...");

  let projectsRemoved = 0;
  let testimonialsRemoved = 0;
  let contactsUpdated = 0;

  const hasMongo = await connectDB();

  if (hasMongo) {
    console.log("MongoDB connection active. Cleaning collections...");
    const projRes = await ProjectModel.deleteMany({});
    projectsRemoved = projRes.deletedCount || 0;

    const testRes = await TestimonialModel.deleteMany({});
    testimonialsRemoved = testRes.deletedCount || 0;

    await TeamMemberModel.deleteMany({});

    // Map old contact message service values to "Other / Multiple Services"
    const contacts = await ContactMessageModel.find({});
    for (const msg of contacts) {
      if (!VALID_SERVICES.includes(msg.service)) {
        msg.service = "Other / Multiple Services";
        await msg.save();
        contactsUpdated++;
      }
    }
  } else {
    console.log("Local JSON DB active. Processing data/db.json...");
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const data = JSON.parse(raw);

        projectsRemoved = (data.projects || []).length;
        testimonialsRemoved = (data.testimonials || []).length;

        // Reset projects and testimonials
        data.projects = [];
        data.testimonials = [];
        data.team = [];

        // Clean contact messages
        if (Array.isArray(data.contactMessages)) {
          for (const msg of data.contactMessages) {
            if (!VALID_SERVICES.includes(msg.service)) {
              msg.service = "Other / Multiple Services";
              contactsUpdated++;
            }
          }
        }

        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
      } catch (err) {
        console.error("Error reading local db.json:", err);
      }
    }
  }

  console.log(`\n════════ DATABASE CLEANUP SUMMARY ════════`);
  console.log(`• Old Projects Removed: ${projectsRemoved}`);
  console.log(`• Old Testimonials Removed: ${testimonialsRemoved}`);
  console.log(`• Contact Inquiries Remapped to "Other / Multiple Services": ${contactsUpdated}`);

  // Re-run seed to insert clean data
  console.log("\n🌱 Re-seeding database with 5 real services...");
  await seed();

  console.log("\n✅ Database cleanup & reseeding complete!");
}

cleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
