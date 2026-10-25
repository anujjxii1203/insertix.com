import mongoose, { Schema } from "mongoose";

export type ProjectCategory = "video" | "photo" | "product" | "event" | "marketing";

export interface IProject {
  id: string;
  title: string;
  category: ProjectCategory;
  client: string;
  description?: string;
  coverImage: string;
  videoPreview?: string;
  link?: string;
  featured: boolean;
  deliverables: string[];
  metrics?: string;
  year: string;
  order?: number;
  visible?: boolean;
  createdAt: string;
}


export interface ITeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  socials: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    dribbble?: string;
  };
  order: number;
  visible?: boolean;
}

export interface ITestimonial {
  id: string;
  clientName: string;
  company: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
  order?: number;
  visible?: boolean;
}

export interface IContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "closed" | "archived";
}

export interface IAdmin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
}

// Mongoose Schemas (used when MONGODB_URI is provided)
const ProjectSchema = new Schema<IProject>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ["video", "photo", "product", "event", "marketing"],
    required: true,
  },
  client: { type: String, required: true },
  description: { type: String, default: "" },
  coverImage: { type: String, required: true },
  videoPreview: { type: String },
  link: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  deliverables: [{ type: String }],
  metrics: { type: String },
  year: { type: String, required: true },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const TeamMemberSchema = new Schema<ITeamMember>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: { type: String, required: true },
  avatar: { type: String, required: true },
  socials: {
    linkedin: String,
    instagram: String,
    twitter: String,
    dribbble: String,
  },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
});

const TestimonialSchema = new Schema<ITestimonial>({
  id: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  avatar: { type: String, required: true },
  rating: { type: Number, default: 5 },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
});

const ContactMessageSchema = new Schema<IContactMessage>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  budget: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  status: { type: String, default: "new" },
});

const AdminSchema = new Schema<IAdmin>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: "admin" },
});

export const ProjectModel =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
export const TeamMemberModel =
  mongoose.models.TeamMember || mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);
export const TestimonialModel =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);
export const ContactMessageModel =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
export const AdminModel =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
