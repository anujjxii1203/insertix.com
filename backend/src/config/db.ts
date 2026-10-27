import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  IProject,
  ITeamMember,
  ITestimonial,
  IContactMessage,
  IAdmin,
  ISiteSettings,
  IActivityLog,
  ProjectModel,
  TeamMemberModel,
  TestimonialModel,
  ContactMessageModel,
  AdminModel,
  SiteSettingsModel,
  ActivityLogModel,
} from "../models";
import { DEFAULT_SITE_SETTINGS } from "./defaultSettings";

// Fallback JSON db path
const DB_FILE_PATH = path.join(process.cwd(), "..", "data", "db.json");

interface LocalDB {
  projects: IProject[];
  team: ITeamMember[];
  testimonials: ITestimonial[];
  contactMessages: IContactMessage[];
  admins: IAdmin[];
  siteSettings?: ISiteSettings;
  activityLogs?: IActivityLog[];
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
      siteSettings: DEFAULT_SITE_SETTINGS,
      activityLogs: [],
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.siteSettings) parsed.siteSettings = DEFAULT_SITE_SETTINGS;
    if (!parsed.activityLogs) parsed.activityLogs = [];
    return parsed;
  } catch {
    const defaultData: LocalDB = {
      projects: [],
      team: [],
      testimonials: [],
      contactMessages: [],
      admins: [],
      siteSettings: DEFAULT_SITE_SETTINGS,
      activityLogs: [],
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
    mongoose.set("bufferCommands", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      bufferCommands: false,
      maxPoolSize: 10,
    });
    isMongoConnected = true;
    console.log("Connected to MongoDB Atlas successfully");
    return true;
  } catch (err) {
    mongoose.set("bufferCommands", false);
    isMongoConnected = false;
    console.warn("MongoDB connection failed, falling back to local persistent JSON:", (err as any)?.message || err);
    return false;
  }
}

// ================= PROJECTS =================
export async function getProjects(publicOnly = false): Promise<IProject[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await ProjectModel.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined, __v: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.projects;
  if (publicOnly) {
    list = list.filter((p) => p.visible !== false);
  }
  return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getProjectById(id: string): Promise<IProject | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const doc = await ProjectModel.findOne({ id }).lean();
    return doc ? { ...(doc as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  return db.projects.find((p) => p.id === id) || null;
}

export async function createProject(data: IProject): Promise<IProject> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const created = await ProjectModel.create(data);
    const obj = created.toObject();
    delete (obj as any)._id;
    delete (obj as any).__v;
    return obj;
  }
  const db = ensureLocalDB();
  db.projects.push(data);
  saveLocalDB(db);
  return data;
}

export async function updateProject(id: string, data: Partial<IProject>): Promise<IProject | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await ProjectModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean();
    return updated ? { ...(updated as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], ...data };
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
export async function getTeamMembers(publicOnly = false): Promise<ITeamMember[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await TeamMemberModel.find(query).sort({ order: 1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined, __v: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.team;
  if (publicOnly) {
    list = list.filter((m) => m.visible !== false);
  }
  return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getTeamMemberById(id: string): Promise<ITeamMember | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const doc = await TeamMemberModel.findOne({ id }).lean();
    return doc ? { ...(doc as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  return db.team.find((m) => m.id === id) || null;
}

export async function createTeamMember(data: ITeamMember): Promise<ITeamMember> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const created = await TeamMemberModel.create(data);
    const obj = created.toObject();
    delete (obj as any)._id;
    delete (obj as any).__v;
    return obj;
  }
  const db = ensureLocalDB();
  db.team.push(data);
  saveLocalDB(db);
  return data;
}

export async function updateTeamMember(id: string, data: Partial<ITeamMember>): Promise<ITeamMember | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await TeamMemberModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean();
    return updated ? { ...(updated as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.team.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.team[idx] = { ...db.team[idx], ...data };
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
    return docs.map((d: any) => ({ ...d, _id: undefined, __v: undefined }));
  }
  const db = ensureLocalDB();
  let list = db.testimonials;
  if (publicOnly) {
    list = list.filter((t) => t.visible !== false);
  }
  return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function createTestimonial(data: ITestimonial): Promise<ITestimonial> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const created = await TestimonialModel.create(data);
    const obj = created.toObject();
    delete (obj as any)._id;
    delete (obj as any).__v;
    return obj;
  }
  const db = ensureLocalDB();
  db.testimonials.push(data);
  saveLocalDB(db);
  return data;
}

export async function updateTestimonial(id: string, data: Partial<ITestimonial>): Promise<ITestimonial | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await TestimonialModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean();
    return updated ? { ...(updated as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.testimonials.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.testimonials[idx] = { ...db.testimonials[idx], ...data };
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
    const docs = await ContactMessageModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({ ...d, _id: undefined, __v: undefined }));
  }
  const db = ensureLocalDB();
  return [...db.contactMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createContactMessage(data: IContactMessage): Promise<IContactMessage> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const created = await ContactMessageModel.create(data);
    const obj = created.toObject();
    delete (obj as any)._id;
    delete (obj as any).__v;
    return obj;
  }
  const db = ensureLocalDB();
  db.contactMessages.push(data);
  saveLocalDB(db);
  return data;
}

export async function updateContactMessage(
  id: string,
  data: Partial<IContactMessage>
): Promise<IContactMessage | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const updated = await ContactMessageModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean();
    return updated ? { ...(updated as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  const idx = db.contactMessages.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.contactMessages[idx] = { ...db.contactMessages[idx], ...data };
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
    return doc ? { ...(doc as any), _id: undefined, __v: undefined } : null;
  }
  const db = ensureLocalDB();
  return db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createAdmin(data: IAdmin): Promise<IAdmin> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const created = await AdminModel.create(data);
    const obj = created.toObject();
    delete (obj as any)._id;
    delete (obj as any).__v;
    return obj;
  }
  const db = ensureLocalDB();
  const idx = db.admins.findIndex((a) => a.email.toLowerCase() === data.email.toLowerCase());
  if (idx >= 0) {
    db.admins[idx] = data;
  } else {
    db.admins.push(data);
  }
  saveLocalDB(db);
  return data;
}

export async function updateAdminPassword(email: string, newPasswordHash: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const res = await AdminModel.updateOne({ email: email.toLowerCase() }, { $set: { passwordHash: newPasswordHash } });
    return res.modifiedCount > 0;
  }
  const db = ensureLocalDB();
  const idx = db.admins.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  db.admins[idx].passwordHash = newPasswordHash;
  saveLocalDB(db);
  return true;
}

// ================= SITE SETTINGS =================
export async function getSiteSettings(): Promise<ISiteSettings> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    let settings = await SiteSettingsModel.findOne({ id: "site-settings-singleton" }).lean();
    if (!settings) {
      // Seed default settings idempotently
      await SiteSettingsModel.create(DEFAULT_SITE_SETTINGS);
      return DEFAULT_SITE_SETTINGS;
    }
    return { ...(settings as any), _id: undefined, __v: undefined };
  }
  const db = ensureLocalDB();
  if (!db.siteSettings) {
    db.siteSettings = DEFAULT_SITE_SETTINGS;
    saveLocalDB(db);
  }
  return db.siteSettings || DEFAULT_SITE_SETTINGS;
}

export async function updateSiteSettings(data: Partial<ISiteSettings>): Promise<ISiteSettings> {
  const hasMongo = await connectDB();
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (hasMongo) {
    const updated = await SiteSettingsModel.findOneAndUpdate(
      { id: "site-settings-singleton" },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();
    return { ...(updated as any), _id: undefined, __v: undefined };
  }

  const db = ensureLocalDB();
  db.siteSettings = {
    ...(db.siteSettings || DEFAULT_SITE_SETTINGS),
    ...updateData,
  } as ISiteSettings;
  saveLocalDB(db);
  return db.siteSettings;
}

// ================= ACTIVITY LOGS =================
export async function addActivityLog(log: Omit<IActivityLog, "id" | "timestamp">): Promise<IActivityLog> {
  const fullLog: IActivityLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const hasMongo = await connectDB();
  if (hasMongo) {
    await ActivityLogModel.create(fullLog);
    // Keep max 100 logs
    const total = await ActivityLogModel.countDocuments();
    if (total > 100) {
      const oldest = await ActivityLogModel.find().sort({ timestamp: 1 }).limit(total - 100);
      const ids = oldest.map((d: any) => d._id);
      await ActivityLogModel.deleteMany({ _id: { $in: ids } });
    }
    return fullLog;
  }

  const db = ensureLocalDB();
  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift(fullLog);
  if (db.activityLogs.length > 100) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }
  saveLocalDB(db);
  return fullLog;
}

export async function getActivityLogs(limit = 100): Promise<IActivityLog[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const docs = await ActivityLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
    return docs.map((d: any) => ({ ...(d as any), _id: undefined, __v: undefined }));
  }
  const db = ensureLocalDB();
  return (db.activityLogs || []).slice(0, limit);
}

