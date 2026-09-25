import { Permission } from "@/lib/admin/permissions";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Search,
  Paintbrush,
  Users,
  LineChart,
  BadgeDollarSign,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  Bell,
  FileSpreadsheet,
  ShieldAlert,
  History,
  Settings,
  Sparkles,
  LucideIcon
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  permission?: Permission;
  children?: AdminNavItem[];
};

export const adminNavigation: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    label: "Tools",
    icon: Wrench,
    children: [
      { label: "All Tools", href: "/admin/tools", permission: "tools.view" },
      { label: "Add Tool", href: "/admin/tools/new", permission: "tools.create" },
      { label: "Categories", href: "/admin/categories", permission: "categories.view" },
      { label: "Tool Usage", href: "/admin/tools/usage", permission: "analytics.view" },
      { label: "Tool Collections", href: "/admin/tools/collections", permission: "tools.view" },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    children: [
      { label: "Homepage", href: "/admin/content/homepage", permission: "homepage.view" },
      { label: "Pages", href: "/admin/content/pages", permission: "content.view" },
      { label: "Blog", href: "/admin/content/blog", permission: "content.view" },
      { label: "FAQs", href: "/admin/content/faqs", permission: "content.view" },
      { label: "Guides", href: "/admin/content/guides", permission: "content.view" },
    ],
  },
  {
    label: "SEO",
    icon: Search,
    children: [
      { label: "Global SEO", href: "/admin/seo/global", permission: "seo.view" },
      { label: "Tool SEO", href: "/admin/seo/tools", permission: "seo.view" },
      { label: "Sitemap", href: "/admin/seo/sitemap", permission: "seo.view" },
      { label: "Robots", href: "/admin/seo/robots", permission: "seo.view" },
      { label: "Redirects", href: "/admin/seo/redirects", permission: "seo.view" },
      { label: "Validation", href: "/admin/seo/validation", permission: "seo.view" },
    ],
  },
  {
    label: "Brand Studio",
    icon: Paintbrush,
    children: [
      { label: "Products", href: "/admin/brand-studio/products", permission: "brand_studio.view" },
      { label: "Templates", href: "/admin/brand-studio/templates", permission: "brand_studio.view" },
      { label: "Assets", href: "/admin/brand-studio/assets", permission: "brand_studio.view" },
      { label: "Pricing", href: "/admin/brand-studio/pricing", permission: "brand_studio.view" },
    ],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    permission: "users.view",
  },
  {
    label: "Analytics",
    icon: LineChart,
    children: [
      { label: "Website", href: "/admin/analytics/website", permission: "analytics.view" },
      { label: "Tools", href: "/admin/analytics", permission: "analytics.view" },
      { label: "Users", href: "/admin/analytics/users", permission: "analytics.view" },
      { label: "Revenue", href: "/admin/analytics/revenue", permission: "analytics.view" },
    ],
  },
  {
    label: "Monetization",
    icon: BadgeDollarSign,
    children: [
      { label: "Revenue Dashboard", href: "/admin/monetization/revenue", permission: "settings.view" },
      { label: "Payments", href: "/admin/monetization/payments", permission: "settings.view" },
      { label: "Pricing", href: "/admin/monetization/pricing", permission: "settings.view" },
      { label: "Subscriptions", href: "/admin/monetization/subscriptions", permission: "settings.view" },
      { label: "Ads", href: "/admin/monetization/ads", permission: "ads.view" },
    ],
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: ImageIcon,
    permission: "media.view",
  },
  {
    label: "AI Writer",
    href: "/admin/ai-writer",
    icon: Sparkles,
    permission: "ai.view",
  },
  {
    label: "Contact & Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
    permission: "feedback.view",
  },
  {
    label: "Error Monitoring",
    icon: AlertTriangle,
    permission: "errors.view",
    children: [
      { label: "All Errors", href: "/admin/error-monitoring", permission: "errors.view" },
      { label: "Open", href: "/admin/error-monitoring?status=Open", permission: "errors.view" },
      { label: "Investigating", href: "/admin/error-monitoring?status=Investigating", permission: "errors.view" },
      { label: "Resolved", href: "/admin/error-monitoring?status=Resolved", permission: "errors.view" },
      { label: "Ignored", href: "/admin/error-monitoring?status=Ignored", permission: "errors.view" },
    ],
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    permission: "dashboard.view",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: FileSpreadsheet,
    permission: "analytics.view",
  },
  {
    label: "Admin & Roles",
    icon: ShieldAlert,
    children: [
      { label: "Administrators", href: "/admin/admins", permission: "admins.view" },
      { label: "Roles & Permissions", href: "/admin/roles", permission: "roles.view" },
    ],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    permission: "audit.view",
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/admin/settings/general", permission: "settings.view" },
      { label: "Email", href: "/admin/settings/email", permission: "settings.view" },
      { label: "API", href: "/admin/settings/api", permission: "settings.edit" },
      { label: "Security", href: "/admin/settings/security", permission: "settings.edit" },
      { label: "Backup & Maintenance", href: "/admin/settings/backup", permission: "settings.edit" },
    ],
  },
];
