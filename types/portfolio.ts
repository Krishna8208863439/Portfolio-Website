export interface NavItem {
  name: string;
  href: string;
}

export interface HighlightStat {
  label: string;
  value: number;
  suffix: string;
  description: string;
  iconName: string;
}

export interface Skill {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'AI' | 'Cloud' | 'Tools';
  level: number; // 0-100
  iconName: string;
  popular?: boolean;
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  category: 'Web' | 'AI' | 'Mobile' | 'Full Stack' | 'Machine Learning';
  technologies: string[];
  features?: string[];
  image: string;
  githubUrl: string;
  liveUrl: string;
  linkedinUrl?: string;
  featured?: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  type: 'Full-time' | 'Contract' | 'Internship';
  description: string;
  responsibilities: string[];
  achievements: string[];
  skills: string[];
  logoText: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  period: string;
  score: string;
  achievements: string[];
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
  image: string;
  skills: string[];
  type: 'Certification' | 'Hackathon' | 'Award' | 'Research' | 'Internship';
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  features: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  review: string;
  rating: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
