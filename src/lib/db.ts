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
} from "./models";
import { DEFAULT_SITE_SETTINGS } from "./defaultSettings";
import { serialize } from "./serialize";

const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");

interface LocalDB {
  projects: IProject[];
  team: ITeamMember[];
  testimonials: ITestimonial[];
  contactMessages: IContactMessage[];
  admins: IAdmin[];
  siteSettings?: ISiteSettings;
  activityLogs?: IActivityLog[];
}

// In production, NEVER touch the local filesystem. Only allow in dev when MONGODB_URI is absent.
function allowLocalFs(): boolean {
  return process.env.NODE_ENV !== "production" && (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === "");
}

function ensureLocalDB(): LocalDB {
  if (!allowLocalFs()) {
    throw new Error("MONGODB_URI is not configured in production");
  }
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
  if (!allowLocalFs()) {
    return;
  }
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Use global caching across hot-reloads and requests in Next.js Turbopack
declare global {
  var _mongooseConnected: boolean | undefined;
  var _mongooseConnectingPromise: Promise<boolean> | null | undefined;
}

let isMongoConnected = Boolean(global._mongooseConnected && mongoose.connection.readyState === 1);
let mongoConnectingPromise: Promise<boolean> | null = global._mongooseConnectingPromise || null;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is not configured");
    }
    return false;
  }
  if (isMongoConnected && mongoose.connection.readyState === 1) return true;

  if (mongoConnectingPromise) {
    return mongoConnectingPromise;
  }

  mongoConnectingPromise = (async () => {
    try {
      mongoose.set("bufferCommands", false);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      });
      isMongoConnected = true;
      global._mongooseConnected = true;

      // Log database name and cluster info at startup
      const maskedHost = (mongoose.connection.host || "").replace(/shard.*$/, "cluster");
      console.log(`[DB INFO] Connected to MongoDB Atlas: ${maskedHost} / db: "${mongoose.connection.name}"`);

      // Dev-only warning if database has 0 projects or members
      if (process.env.NODE_ENV !== "production") {
        ProjectModel.countDocuments()
          .then((count) => {
            if (count === 0) {
              console.warn(`⚠️ [DEV WARNING] Connected MongoDB database "${mongoose.connection.name}" has 0 projects.`);
            }
          })
          .catch(() => {});
      }

      return true;
    } catch (err) {
      mongoose.set("bufferCommands", false);
      isMongoConnected = false;
      if (process.env.NODE_ENV === "production") {
        console.error("MongoDB connection failed in production:", (err as any)?.message || err);
        throw new Error(`MongoDB connection failed: ${(err as any)?.message || err}`);
      }
      console.warn("MongoDB connection failed in dev, falling back to local JSON storage:", (err as any)?.message || err);
      return false;
    } finally {
      mongoConnectingPromise = null;
      global._mongooseConnectingPromise = null;
    }
  })();

  return mongoConnectingPromise;
}

// ================= PROJECTS =================
export async function getProjects(publicOnly = false): Promise<IProject[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await ProjectModel.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return serialize(docs);
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
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const doc = await ProjectModel.findOne(filter).lean();
    return doc ? serialize(doc) : null;
  }
  const db = ensureLocalDB();
  return db.projects.find((p) => p.id === id) || null;
}

export async function createProject(project: IProject): Promise<IProject> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    if (!project.order) {
      const maxDoc = await ProjectModel.findOne().sort({ order: -1 }).lean();
      project.order = maxDoc && typeof maxDoc.order === "number" ? maxDoc.order + 1 : 1;
    }
    const created = await ProjectModel.create(project);
    return serialize(created.toObject ? created.toObject() : created);
  }
  const db = ensureLocalDB();
  if (!project.order) {
    const maxOrder = db.projects.reduce((max, p) => Math.max(max, p.order || 0), 0);
    project.order = maxOrder + 1;
  }
  db.projects.unshift(project);
  saveLocalDB(db);
  return serialize(project);
}

export async function updateProject(id: string, updates: Partial<IProject>): Promise<IProject | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const updated = await ProjectModel.findOneAndUpdate(filter, updates, { returnDocument: 'after' }).lean();
    return updated ? serialize(updated) : null;
  }
  const db = ensureLocalDB();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], ...updates };
  saveLocalDB(db);
  return serialize(db.projects[idx]);
}

export async function deleteProject(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const res = await ProjectModel.deleteOne(filter);
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
    return serialize(docs);
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
    if (!member.order) {
      const maxDoc = await TeamMemberModel.findOne().sort({ order: -1 }).lean();
      member.order = maxDoc && typeof maxDoc.order === "number" ? maxDoc.order + 1 : 1;
    }
    const created = await TeamMemberModel.create(member);
    return serialize(created.toObject ? created.toObject() : created);
  }
  const db = ensureLocalDB();
  if (!member.order) {
    const maxOrder = db.team.reduce((max, m) => Math.max(max, m.order || 0), 0);
    member.order = maxOrder + 1;
  }
  db.team.push(member);
  saveLocalDB(db);
  return serialize(member);
}

export async function updateTeamMember(id: string, updates: Partial<ITeamMember>): Promise<ITeamMember | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const updated = await TeamMemberModel.findOneAndUpdate(filter, updates, { returnDocument: 'after' }).lean();
    return updated ? serialize(updated) : null;
  }
  const db = ensureLocalDB();
  const idx = db.team.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.team[idx] = { ...db.team[idx], ...updates };
  saveLocalDB(db);
  return serialize(db.team[idx]);
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const res = await TeamMemberModel.deleteOne(filter);
    return res.deletedCount > 0;
  }
  const db = ensureLocalDB();
  const initialLen = db.team.length;
  db.team = db.team.filter((m) => m.id !== id);
  saveLocalDB(db);
  return db.team.length < initialLen;
}

function cleanCompanyField(t: any): any {
  if (!t) return t;
  let company = t.company;
  if (!company || company.trim() === "") {
    if (t.role && t.role.includes(",")) {
      const parts = t.role.split(",");
      company = parts[parts.length - 1].trim();
    } else {
      company = t.clientName || "Partner";
    }
  }
  return { ...t, company };
}

// ================= TESTIMONIALS =================
export async function getTestimonials(publicOnly = false): Promise<ITestimonial[]> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const query = publicOnly ? { visible: { $ne: false } } : {};
    const docs = await TestimonialModel.find(query).sort({ order: 1 }).lean();
    return serialize(docs.map(cleanCompanyField));
  }
  const db = ensureLocalDB();
  let list = db.testimonials;
  if (publicOnly) {
    list = list.filter((t) => t.visible !== false);
  }
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(cleanCompanyField);
}

export async function createTestimonial(testimonial: ITestimonial): Promise<ITestimonial> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    if (!testimonial.order) {
      const maxDoc = await TestimonialModel.findOne().sort({ order: -1 }).lean();
      testimonial.order = maxDoc && typeof maxDoc.order === "number" ? maxDoc.order + 1 : 1;
    }
    const created = await TestimonialModel.create(testimonial);
    return serialize(created.toObject ? created.toObject() : created);
  }
  const db = ensureLocalDB();
  if (!testimonial.order) {
    const maxOrder = db.testimonials.reduce((max, t) => Math.max(max, t.order || 0), 0);
    testimonial.order = maxOrder + 1;
  }
  db.testimonials.push(testimonial);
  saveLocalDB(db);
  return serialize(testimonial);
}

export async function updateTestimonial(id: string, updates: Partial<ITestimonial>): Promise<ITestimonial | null> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const updated = await TestimonialModel.findOneAndUpdate(filter, updates, { returnDocument: 'after' }).lean();
    return updated ? serialize(updated) : null;
  }
  const db = ensureLocalDB();
  const idx = db.testimonials.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.testimonials[idx] = { ...db.testimonials[idx], ...updates };
  saveLocalDB(db);
  return serialize(db.testimonials[idx]);
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const hasMongo = await connectDB();
  if (hasMongo) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const res = await TestimonialModel.deleteOne(filter);
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
    return serialize(docs);
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
    const doc = await AdminModel.findOne({ email: new RegExp(`^${email.trim()}$`, "i") }).lean();
    if (doc) return { ...doc, _id: undefined } as any;
  }
  if (!allowLocalFs()) return null;
  const db = ensureLocalDB();
  return db.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
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
    const settings = await SiteSettingsModel.findOne({ id: "site-settings-singleton" }).lean();
    if (!settings) {
      // In-memory fallback if not yet initialized; do not write on GET in production
      return DEFAULT_SITE_SETTINGS;
    }
    return serialize(settings);
  }
  if (!allowLocalFs()) {
    return DEFAULT_SITE_SETTINGS;
  }
  const db = ensureLocalDB();
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
    return serialize(updated);
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
    return serialize(docs);
  }
  if (!allowLocalFs()) {
    return [];
  }
  const db = ensureLocalDB();
  return (db.activityLogs || []).slice(0, limit);
}
