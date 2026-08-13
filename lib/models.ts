import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Visitor Interface & Schema
export interface IVisitor extends Document {
  name?: string | null;
  role?: string | null;
  status: 'identified' | 'skipped';
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  createdAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, default: null },
    role: { type: String, default: null },
    status: { type: String, enum: ['identified', 'skipped'], required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    referrer: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 2. Project Interface & Schema
export interface IProject extends Document {
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  featured?: boolean;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    category: { type: String, default: 'Full Stack' },
    image: { type: String, required: true },
    tags: [{ type: String }],
    liveUrl: { type: String, default: '#' },
    githubUrl: { type: String, default: '#' },
    linkedinUrl: { type: String, default: 'https://linkedin.com/in/krishna-devadkar' },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 3. Skill Interface & Schema
export interface ISkill extends Document {
  name: string;
  category: string;
  level: number;
  iconName?: string;
  popular?: boolean;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: Number, default: 85 },
    iconName: { type: String, default: 'Code' },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 4. AdminConfig Interface & Schema
export interface IAdminConfig extends Document {
  availableForHire: boolean;
  resumeUrl: string;
  updatedAt: Date;
}

const AdminConfigSchema = new Schema<IAdminConfig>(
  {
    availableForHire: { type: Boolean, default: true },
    resumeUrl: { type: String, default: '/api/resume' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 5. ContactMessage Interface & Schema
export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Exports with Mongoose model compilation checks
export const Visitor: Model<IVisitor> =
  mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);

export const AdminConfig: Model<IAdminConfig> =
  mongoose.models.AdminConfig || mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
