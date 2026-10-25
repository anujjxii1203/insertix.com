import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  IProject,
  ITeamMember,
  ITestimonial,
  IContactMessage,
  IAdmin,
  ProjectModel,
  TeamMemberModel,
  TestimonialModel,
  ContactMessageModel,
  AdminModel,
} from "./models";

const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");

interface LocalDB {
  projects: IProject[];
  team: ITeamMember[];
  testimonials: ITestimonial[];
  contactMessages: IContactMessage[];
  admins: IAdmin[];
}

function ensureLocalDB(): LocalDB {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const defaultData: LocalDB = {
      projects: [],
      team: [],
      testimonials: [],
      contactMessages: [],
      admins: [],
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    const defaultData: LocalDB = {
      projects: [],
      team: [],
      testimonials: [],
      contactMessages: [],
      admins: [],
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
}

function saveLocalDB(data: LocalDB): void {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

let isMongoConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    return false;
  }
  if (isMongoConnected) return true;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    return true;
  } catch (err) {
    console.warn("MongoDB connection failed, falling back to persistent JSON storage:", err);
    return false;
  }
}

// ================= PROJECTS =================
export async function getProjects(publicOnly = false): Promise<IProject[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await ProjectModel.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.projects;
  if (publicOnly) {
    list = list.filter((p) => p.visible !== false);
  }
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getProjectById(id: string): Promise<IProject | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const doc = await ProjectModel.findOne({ id }).lean();
    return doc ? { ...doc, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  return db.projects.find((p) => p.id === id) || null;
}

export async function createProject(project: IProject): Promise<IProject> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    await ProjectModel.create(project);
    return project;
  }
  const db = ensureLocalDB();
  db.projects.unshift(project);
  saveLocalDB(db);
  return project;
}

export async function updateProject(id: string, updates: Partial<IProject>): Promise<IProject | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await ProjectModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated ? { ...updated, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], ...updates };
  saveLocalDB(db);
  return db.projects[idx];
}

export async function deleteProject(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const res = await ProjectModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const db = ensureLocalDB();
  const initialLen = db.projects.length;
  db.projects = db.projects.filter((p) => p.id !== id);
  saveLocalDB(db);
  return db.projects.length < initialLen;
}

// ================= TEAM =================
export async function getTeam(publicOnly = false): Promise<ITeamMember[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await TeamMemberModel.find(query).sort({ order: 1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.team;
  if (publicOnly) {
    list = list.filter((m) => m.visible !== false);
  }
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function createTeamMember(member: ITeamMember): Promise<ITeamMember> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    await TeamMemberModel.create(member);
    return member;
  }
  const db = ensureLocalDB();
  db.team.push(member);
  saveLocalDB(db);
  return member;
}

export async function updateTeamMember(id: string, updates: Partial<ITeamMember>): Promise<ITeamMember | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await TeamMemberModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated ? { ...updated, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.team.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.team[idx] = { ...db.team[idx], ...updates };
  saveLocalDB(db);
  return db.team[idx];
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const res = await TeamMemberModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const db = ensureLocalDB();
  const initialLen = db.team.length;
  db.team = db.team.filter((m) => m.id !== id);
  saveLocalDB(db);
  return db.team.length < initialLen;
}

// ================= TESTIMONIALS =================
export async function getTestimonials(publicOnly = false): Promise<ITestimonial[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await TestimonialModel.find(query).sort({ order: 1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.testimonials;
  if (publicOnly) {
    list = list.filter((t) => t.visible !== false);
  }
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function createTestimonial(testimonial: ITestimonial): Promise<ITestimonial> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    await TestimonialModel.create(testimonial);
    return testimonial;
  }
  const db = ensureLocalDB();
  db.testimonials.push(testimonial);
  saveLocalDB(db);
  return testimonial;
}

export async function updateTestimonial(id: string, updates: Partial<ITestimonial>): Promise<ITestimonial | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await TestimonialModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated ? { ...updated, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.testimonials.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.testimonials[idx] = { ...db.testimonials[idx], ...updates };
  saveLocalDB(db);
  return db.testimonials[idx];
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const res = await TestimonialModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const db = ensureLocalDB();
  const initialLen = db.testimonials.length;
  db.testimonials = db.testimonials.filter((t) => t.id !== id);
  saveLocalDB(db);
  return db.testimonials.length < initialLen;
}

// ================= CONTACT MESSAGES =================
export async function getContactMessages(): Promise<IContactMessage[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const docs = await ContactMessageModel.find({}).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined }));
  }
  const db = ensureLocalDB();
  return db.contactMessages.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createContactMessage(msg: IContactMessage): Promise<IContactMessage> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    await ContactMessageModel.create(msg);
    return msg;
  }
  const db = ensureLocalDB();
  db.contactMessages.unshift(msg);
  saveLocalDB(db);
  return msg;
}

export async function updateContactMessage(
  id: string,
  updates: Partial<IContactMessage>
): Promise<IContactMessage | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await ContactMessageModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated ? { ...updated, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.contactMessages.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.contactMessages[idx] = { ...db.contactMessages[idx], ...updates };
  saveLocalDB(db);
  return db.contactMessages[idx];
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const res = await ContactMessageModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const db = ensureLocalDB();
  const initialLen = db.contactMessages.length;
  db.contactMessages = db.contactMessages.filter((m) => m.id !== id);
  saveLocalDB(db);
  return db.contactMessages.length < initialLen;
}

// ================= ADMINS =================
export async function getAdminByEmail(email: string): Promise<IAdmin | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const doc = await AdminModel.findOne({ email }).lean();
    return doc ? { ...doc, _id: undefined } : null;
  }
  const db = ensureLocalDB();
  return db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createAdmin(admin: IAdmin): Promise<IAdmin> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    await AdminModel.create(admin);
    return admin;
  }
  const db = ensureLocalDB();
  const existingIdx = db.admins.findIndex((a) => a.email.toLowerCase() === admin.email.toLowerCase());
  if (existingIdx !== -1) {
    db.admins[existingIdx] = admin;
  } else {
    db.admins.push(admin);
  }
  saveLocalDB(db);
  return admin;
}
