export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface ToolFormData {
  // Basic Information
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  subCategory: string;
  tags: string[];
  type: string;
  icon: string;
  thumbnail: string;

  // Tool Content
  pageHeading: string;
  introduction: string;
  howToUse: string;
  steps: string[];
  examples: string[];
  faqs: FAQItem[];
  relatedTools: string[];
  disclaimer: string;
  formula: string;

  // Runtime Settings
  pricing: "Free" | "Premium";
  loginRequired: boolean;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  rateLimit: number | null;
  fileUploadEnabled: boolean;
  maxUploadSizeMB: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  apiRequired: boolean;
  maintenanceMode: boolean;

  // Technical Configuration
  route: string;
  internalServiceId: string;
  apiEndpointId: string;
  version: string;
  executionTimeoutMs: number;
  maxConcurrentJobs: number;
  featureFlags: string[];

  // SEO
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schemaType: string;
  index: boolean;

  // Publishing
  status: "Draft" | "Published" | "Scheduled";
  publishDate: string;
  unpublishDate: string;
  featured: boolean;
  homepageVisible: boolean;
}

export const INITIAL_TOOL_FORM_DATA: ToolFormData = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "",
  subCategory: "",
  tags: [],
  type: "generator",
  icon: "",
  thumbnail: "",

  pageHeading: "",
  introduction: "",
  howToUse: "",
  steps: [],
  examples: [],
  faqs: [],
  relatedTools: [],
  disclaimer: "",
  formula: "",

  pricing: "Free",
  loginRequired: false,
  dailyLimit: null,
  monthlyLimit: null,
  rateLimit: null,
  fileUploadEnabled: false,
  maxUploadSizeMB: 5,
  allowedMimeTypes: [],
  allowedExtensions: [],
  apiRequired: false,
  maintenanceMode: false,

  route: "",
  internalServiceId: "",
  apiEndpointId: "",
  version: "v1",
  executionTimeoutMs: 30000,
  maxConcurrentJobs: 10,
  featureFlags: [],

  seoTitle: "",
  metaDescription: "",
  focusKeyword: "",
  secondaryKeywords: [],
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  schemaType: "SoftwareApplication",
  index: true,

  status: "Draft",
  publishDate: "",
  unpublishDate: "",
  featured: false,
  homepageVisible: true,
};
