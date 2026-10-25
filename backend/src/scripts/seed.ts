import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import {
  createProject,
  createTeamMember,
  createTestimonial,
  createAdmin,
  connectDB,
} from "../config/db";
import {
  IProject,
  ITeamMember,
  ITestimonial,
  IAdmin,
  ProjectModel,
  TeamMemberModel,
  TestimonialModel,
  AdminModel,
} from "../models";

export async function seed() {
  console.log("🌱 Starting Insertix Media database seed...");

  const isProduction = process.env.NODE_ENV === "production";
  const force = process.argv.includes("--force");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (isProduction) {
    if (!adminEmail || !adminPassword) {
      console.error("FATAL: In production, ADMIN_EMAIL and ADMIN_PASSWORD must be provided in environment variables!");
      process.exit(1);
    }
    if (adminPassword === "admin123" || adminPassword.length < 8) {
      console.error("FATAL: Weak admin password detected! Production seed refused.");
      process.exit(1);
    }
  }

  const hasMongo = await connectDB();
  if (hasMongo) {
    const existingProjects = await ProjectModel.countDocuments();
    if (existingProjects > 0 && !force) {
      console.log(`⚠️ Database already contains ${existingProjects} projects. Skipping seed (pass --force to override).`);
      process.exit(0);
    }
    if (force) {
      console.log("🧹 Clearing existing collections (--force flag passed)...");
      await ProjectModel.deleteMany({});
      await TeamMemberModel.deleteMany({});
      await TestimonialModel.deleteMany({});
      await AdminModel.deleteMany({});
    }
  }

  // 1. Admin
  const finalEmail = adminEmail || "admin@insertixmedia.com";
  const finalPassword = adminPassword || "admin123";
  const adminPasswordHash = await bcrypt.hash(finalPassword, 12);

  const admin: IAdmin = {
    id: "admin-1",
    email: finalEmail,
    name: "Insertix Director",
    passwordHash: adminPasswordHash,
    role: "admin",
  };
  await createAdmin(admin);
  console.log(`✅ Admin seeded: ${finalEmail}`);

  // 2. Initial projects
  const initialProjects: IProject[] = [
    {
      id: "proj-1",
      title: "Neon Pulse Commercial",
      category: "video",
      client: "Aura Audio",
      coverImage: "/projects/httpswww.instagram.compDaXQsn2CxSX.jpg",
      link: "https://www.instagram.com/p/DaXQsn2CxSX/",
      featured: true,
      deliverables: ["4K Commercial", "Color Grading", "Sound Design"],
      year: "2026",
      order: 1,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "proj-2",
      title: "Autumn Capsule Retouching",
      category: "photo",
      client: "Vogue Street",
      coverImage: "/projects/httpswww.instagram.compDcQtskSp9UM.jpg",
      link: "https://www.instagram.com/p/DcQtskSp9UM/",
      featured: true,
      deliverables: ["Editorial Photography", "High-End Retouch"],
      year: "2026",
      order: 2,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "proj-3",
      title: "Signature Matte Watch Reel",
      category: "product",
      client: "Chronos Lux",
      coverImage: "/projects/httpswww.instagram.compDd8BGQwyQS8.jpg",
      link: "https://www.instagram.com/p/Dd8BGQwyQS8/",
      featured: true,
      deliverables: ["Product Photography", "3D Motion"],
      year: "2026",
      order: 3,
      visible: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const proj of initialProjects) {
    await createProject(proj);
  }
  console.log(`✅ Seeded ${initialProjects.length} initial projects.`);

  console.log("🎉 Database seeding completed successfully!");
  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
