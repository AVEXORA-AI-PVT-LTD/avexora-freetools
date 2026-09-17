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
      { label: "Tool Usage", href: "/admin/tools/usage", permission: "analytics.view" as any },
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
    icon: Users,
    children: [
      { label: "All Users", href: "/admin/users", permission: "users.view" },
      { label: "User Activity", href: "/admin/users/activity", permission: "users.view" },
      { label: "User Restrictions", href: "/admin/users/restrictions", permission: "users.edit" },
    ],
  },
  {
    label: "Analytics",
    icon: LineChart,
    children: [
      { label: "Website", href: "/admin/analytics/website", permission: "analytics.view" },
      { label: "Tools", href: "/admin/analytics", permission: "analytics.view" }, // Re-using existing /admin/analytics
      { label: "Users", href: "/admin/analytics/users", permission: "analytics.view" },
      { label: "Revenue", href: "/admin/analytics/revenue", permission: "analytics.view" },
    ],
  },
  {
    label: "Monetization",
    icon: BadgeDollarSign,
    children: [
      { label: "Pricing", href: "/admin/monetization/pricing", permission: "settings.view" as any },
      { label: "Subscriptions", href: "/admin/monetization/subscriptions", permission: "settings.view" as any },
      { label: "Payments", href: "/admin/monetization/payments", permission: "settings.view" as any },
      { label: "Ads", href: "/admin/monetization/ads", permission: "settings.view" as any },
    ],
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: ImageIcon,
    permission: "content.view" as any,
  },
  {
    label: "Contact & Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
    permission: "content.view" as any,
  },
  {
    label: "Error Logs",
    href: "/admin/error-logs",
    icon: AlertTriangle,
    permission: "audit_logs.view" as any,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    permission: "dashboard.view" as any,
  },
  {
    label: "Reports",
    href: "/admin/analytics",
    icon: FileSpreadsheet,
    permission: "analytics.view" as any,
  },
  {
    label: "Admin & Roles",
    icon: ShieldAlert,
    children: [
      { label: "Administrators", href: "/admin/admins", permission: "roles.view" },
      { label: "Roles", href: "/admin/roles", permission: "roles.view" },
      { label: "Permissions", href: "/admin/permissions", permission: "roles.view" },
    ],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    permission: "audit_logs.view",
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
