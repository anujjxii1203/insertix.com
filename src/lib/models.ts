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
  focalX?: number; // 0 to 100, default 50
  focalY?: number; // 0 to 100, default 50
  zoom?: number;   // default 1
  aspectRatio?: string; // "4:3" | "1:1" | "4:5", default "4:3"
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
  instagram?: string; // normalized Instagram handle / URL
  order: number;
  visible?: boolean;
  focalX?: number; // 0 to 100, default 50
  focalY?: number; // 0 to 100, default 25
  zoom?: number;   // default 1
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
  focalX?: number; // default 50
  focalY?: number; // default 50
  zoom?: number;   // default 1
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

export interface IHeroStat {
  value: string;
  suffix?: string;
  label: string;
  visible?: boolean;
  order?: number;
}

export interface ITrustedBrand {
  name: string;
  logo?: string;
  order?: number;
  visible?: boolean;
}

export interface IServiceItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  features: string[];
  icon: string;
  visible?: boolean;
  order?: number;
}

export interface ISectionHeading {
  title: string;
  accentWord: string;
  subtext: string;
}

export interface ISiteSettings {
  id: string; // "site-settings-singleton"
  hero: {
    badge: string;
    headlineLine1: string;
    headlineLine2: string;
    accentWord: string;
    subtitle: string;
    primaryBtnText: string;
    secondaryBtnText: string;
  };
  heroStats: IHeroStat[];
  about: {
    heading: string;
    accentWord: string;
    paragraphs: string[];
    counters: Array<{
      label: string;
      number: number;
      suffix: string;
    }>;
  };
  trustedBrands: {
    heading: string;
    visible: boolean;
    brands: ITrustedBrand[];
  };
  services: IServiceItem[];
  contact: {
    email: string;
    phone1: string;
    phone2: string;
    city: string;
    workingHours: string;
    copyrightCompany: string;
    footerTagline: string;
    instagram: string;
    linkedin: string;
    whatsappNumber: string;
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  sectionHeadings: {
    work: ISectionHeading;
    about: ISectionHeading;
    members: ISectionHeading;
    recentWork: ISectionHeading;
    partners: ISectionHeading;
    contact: ISectionHeading;
  };
  themeDefault: "system" | "light" | "dark";
  useScriptFontForAccents?: boolean;
  updatedAt: string;
}

export interface IActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  details?: string;
  timestamp: string;
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
  focalX: { type: Number, default: 50 },
  focalY: { type: Number, default: 50 },
  zoom: { type: Number, default: 1 },
  aspectRatio: { type: String, default: "4:3" },
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
  focalX: { type: Number, default: 50 },
  focalY: { type: Number, default: 25 },
  zoom: { type: Number, default: 1 },
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
  focalX: { type: Number, default: 50 },
  focalY: { type: Number, default: 50 },
  zoom: { type: Number, default: 1 },
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

const SiteSettingsSchema = new Schema<ISiteSettings>({
  id: { type: String, default: "site-settings-singleton", unique: true },
  hero: {
    badge: { type: String, default: "Creative Media Agency" },
    headlineLine1: { type: String, default: "We Shoot Stories" },
    headlineLine2: { type: String, default: "That Make Brands" },
    accentWord: { type: String, default: "unforgettable" },
    subtitle: { type: String, default: "High-impact video shoots, photoshoots, product catalogues, event coverage and growth marketing tailored for ambitious brands." },
    primaryBtnText: { type: String, default: "View Recent Work" },
    secondaryBtnText: { type: String, default: "Chat on WhatsApp" },
  },
  heroStats: [{
    value: { type: String, required: true },
    suffix: { type: String, default: "" },
    label: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }],
  about: {
    heading: { type: String, default: "A New Era Of" },
    accentWord: { type: String, default: "Creative Media" },
    paragraphs: [{ type: String }],
    counters: [{
      label: { type: String, required: true },
      number: { type: Number, required: true },
      suffix: { type: String, default: "" },
    }],
  },
  trustedBrands: {
    heading: { type: String, default: "Trusted by Industry Leaders & Fast-Growing Brands" },
    visible: { type: Boolean, default: true },
    brands: [{
      name: { type: String, required: true },
      logo: { type: String },
      order: { type: Number, default: 0 },
      visible: { type: Boolean, default: true },
    }],
  },
  services: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    tag: { type: String, required: true },
    description: { type: String, required: true },
    features: [{ type: String }],
    icon: { type: String, default: "Video" },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }],
  contact: {
    email: { type: String, default: "insertixmedia@gmail.com" },
    phone1: { type: String, default: "+91 97171 50055" },
    phone2: { type: String, default: "+91 63875 76969" },
    city: { type: String, default: "New Delhi, India" },
    workingHours: { type: String, default: "Available Mon to Sat, 10 AM to 8 PM IST" },
    copyrightCompany: { type: String, default: "INSERTIX MEDIA LLC" },
    footerTagline: { type: String, default: "Creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing that turns ideas into unforgettable content." },
    instagram: { type: String, default: "https://www.instagram.com/insertixmedia" },
    linkedin: { type: String, default: "https://www.linkedin.com/company/insertixmedia" },
    whatsappNumber: { type: String, default: "919717150055" },
  },
  seo: {
    title: { type: String, default: "Insertix Media — Creative Media Production & Growth Agency" },
    description: { type: String, default: "Award-winning media production agency specializing in video shoots, brand films, photoshoots, product shoots and high-reach marketing." },
    ogImage: { type: String, default: "/og-image.jpg" },
  },
  sectionHeadings: {
    work: {
      title: { type: String, default: "What We" },
      accentWord: { type: String, default: "Dominate" },
      subtext: { type: String, default: "Everything you need to shoot it, show it and sell it." },
    },
    about: {
      title: { type: String, default: "A New Era Of" },
      accentWord: { type: String, default: "Creative Media" },
      subtext: { type: String, default: "Our Story and Numbers" },
    },
    members: {
      title: { type: String, default: "Meet The" },
      accentWord: { type: String, default: "Members" },
      subtext: { type: String, default: "Our core collective unites award-winning cinematographers, photographers, video editors, marketing leads, and production managers." },
    },
    recentWork: {
      title: { type: String, default: "Recent" },
      accentWord: { type: String, default: "Work" },
      subtext: { type: String, default: "A showcase of high-converting visual stories we delivered." },
    },
    partners: {
      title: { type: String, default: "Words From Our" },
      accentWord: { type: String, default: "Partners" },
      subtext: { type: String, default: "What industry leaders and founders say about collaborating with Insertix." },
    },
    contact: {
      title: { type: String, default: "Let's Create" },
      accentWord: { type: String, default: "something iconic" },
      subtext: { type: String, default: "Have a bold vision? We are ready to bring it to life." },
    },
  },
  themeDefault: { type: String, enum: ["system", "light", "dark"], default: "system" },
  useScriptFontForAccents: { type: Boolean, default: true },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const ActivityLogSchema = new Schema<IActivityLog>({
  id: { type: String, required: true, unique: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

export const SiteSettingsModel =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export const ActivityLogModel =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

