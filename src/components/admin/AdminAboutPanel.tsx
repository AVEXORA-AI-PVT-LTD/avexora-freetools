"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Info, ChevronDown, ChevronUp, BookOpen, Layers, Sparkles, HelpCircle } from "lucide-react";

interface SectionGuide {
  title: string;
  subtitle: string;
  badge: string;
  purpose: string;
  subpages?: {
    name: string;
    route?: string;
    description: string;
  }[];
  bestPractices?: string[];
}

const SECTION_GUIDES: Record<string, SectionGuide> = {
  reports: {
    title: "Reports & Export Management",
    subtitle: "Centralized reporting engine for generating, scheduling, and exporting system data.",
    badge: "Reports & Analytics",
    purpose:
      "This section enables administrators to generate custom reports and securely export platform data (tool usage, user activity, revenue, subscriptions, website traffic, SEO performance, system errors, and user feedback) into CSV, XLSX, or branded PDF formats.",
    subpages: [
      {
        name: "Reports Dashboard",
        route: "/admin/reports",
        description:
          "Overview of report generation activities, storage consumption, recent export history, and 1-click quick report download shortcuts.",
      },
      {
        name: "Report Generator",
        route: "/admin/reports/generate",
        description:
          "Interactive tool to build custom reports. Filter by date range, select from 8 report categories (Tools, Users, Revenue, Subscriptions, Traffic, SEO, Errors, Feedback), choose file formats (CSV, XLSX, PDF), and enable PII masking.",
      },
      {
        name: "Report History & Jobs",
        route: "/admin/reports/history",
        description:
          "Track real-time background report generation jobs (QUEUED, PROCESSING, COMPLETED, FAILED), inspect download counts, and manage the 7-day automated file expiration cleanup policy.",
      },
    ],
    bestPractices: [
      "Use CSV or XLSX exports for large date ranges to ensure fast background job processing.",
      "Enable 'Mask PII' before sharing reports with external auditors or third-party teams.",
      "Download links expire automatically after 7 days for security compliance.",
    ],
  },
  monetization: {
    title: "Monetization & Financial Management",
    subtitle: "Complete financial operations, payment tracking, subscription plans, and ad management.",
    badge: "Finance & Monetization",
    purpose:
      "This section manages all financial operations and revenue streams across Avex Tools. Track platform revenue, inspect payment gateway transactions, manage pricing tiers, oversee user subscriptions, and configure advertisement placements.",
    subpages: [
      {
        name: "Revenue Dashboard",
        route: "/admin/monetization/revenue",
        description:
          "Real-time financial metrics including Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), total sales velocity, Average Revenue Per User (ARPU), refund rates, and revenue growth charts.",
      },
      {
        name: "Payment Transactions",
        route: "/admin/monetization/payments",
        description:
          "Detailed transaction logs from Stripe, Razorpay, and PayPal. Inspect payment statuses (Succeeded, Pending, Failed), customer emails, transaction IDs, invoice receipts, and initiate refunds.",
      },
      {
        name: "Pricing & Plans",
        route: "/admin/monetization/pricing",
        description:
          "Configure subscription plans (Free, Pro, Business, Enterprise), billing cycles (Monthly/Yearly), feature inclusions, usage limits, and promotional discount codes.",
      },
      {
        name: "User Subscriptions",
        route: "/admin/monetization/subscriptions",
        description:
          "Track active user subscriptions, upcoming renewal dates, auto-billing status, plan upgrade/downgrade history, and cancellation analytics.",
      },
      {
        name: "Ads Management",
        route: "/admin/monetization/ads",
        description:
          "Manage Google AdSense scripts, custom banner advertisements, sponsored widgets, slot placements (Header, Sidebar, In-tool), impressions, click-through rates (CTR), and ad visibility.",
      },
    ],
    bestPractices: [
      "Always verify customer subscription IDs and invoice references before processing refunds.",
      "Check auto-renewal rules for existing subscribers before updating plan pricing structures.",
    ],
  },
  media: {
    title: "Media Library",
    subtitle: "Central asset storage, image optimization, file management, and media embedding.",
    badge: "Media & Assets",
    purpose:
      "This section serves as a centralized media asset repository for uploading, organizing, compressing, and embedding platform images, logos, icons, banners, and documents.",
    subpages: [
      {
        name: "Asset Explorer & Upload",
        route: "/admin/media",
        description:
          "Upload media assets using drag-and-drop or modal file pickers. View files in grid or list mode, and filter by file size, dimensions, and MIME types (PNG, WebP, SVG).",
      },
      {
        name: "Optimization & Previews",
        route: "/admin/media",
        description:
          "Automated WebP compression for optimized web delivery. Inspect image metadata, edit SEO alt text, and copy 1-click CDN image URLs for CMS and tool usage.",
      },
    ],
    bestPractices: [
      "Always add descriptive Alt Text to uploaded images to maintain search engine accessibility.",
      "Resize oversized images before uploading to minimize storage and bandwidth consumption.",
    ],
  },
  "ai-writer": {
    title: "AI Writer & Model Configurations",
    subtitle: "Manage AI prompts, model credentials, API quotas, and generation bounds.",
    badge: "AI & Automation",
    purpose:
      "This section configures the backend infrastructure, prompt templates, API credentials, model parameters, and token rate limits for all AI-powered tools (AI Blog Writer, Code Generator, Resume Builder, etc.).",
    subpages: [
      {
        name: "Prompt Templates & System Prompts",
        route: "/admin/ai-writer",
        description:
          "Edit default system prompt instructions, configure prompt versioning, and standardize output schemas for AI-powered generators.",
      },
      {
        name: "Model Credentials & Parameters",
        route: "/admin/ai-writer",
        description:
          "Manage API keys for OpenAI (GPT-4o), Gemini Pro, and Anthropic Claude. Configure default active models, temperature (creativity), and max token output limits.",
      },
      {
        name: "Quotas & Rate Limits",
        route: "/admin/ai-writer",
        description:
          "Set daily generation limits per user or IP address to control AI API operational costs and prevent automated abuse.",
      },
    ],
    bestPractices: [
      "Use the 'Test Prompt' feature to validate AI output formatting before deploying prompt changes to production.",
      "Store API keys securely and monitor daily API usage cost trends regularly.",
    ],
  },
  tools: {
    title: "Tools & Catalog Management",
    subtitle: "Complete management of free tools catalog, categories, and tool usage metrics.",
    badge: "Tool Infrastructure",
    purpose:
      "This section manages the core catalog of online free tools on Avex Tools. Create new tools, edit or unpublish existing tools, organize tool categories, configure input/output forms, and review execution analytics.",
    subpages: [
      {
        name: "All Tools Directory",
        route: "/admin/tools",
        description:
          "Comprehensive list of all platform tools. Toggle published/unpublished status with 1 click, edit tool slugs, meta details, input schemas, and execution logic.",
      },
      {
        name: "Add New Tool",
        route: "/admin/tools/new",
        description:
          "Register a new online tool into the ecosystem. Configure title, category assignment, icon, SEO description, and feature flags.",
      },
      {
        name: "Categories Management",
        route: "/admin/categories",
        description:
          "Group tools into logical categories (Finance, Developer, Marketing, PDF, AI, HR, Text), set icons, display order, and active visibility.",
      },
      {
        name: "Tool Usage Analytics",
        route: "/admin/tools/usage",
        description:
          "Monitor individual tool execution volume, average execution speed, failure rates, and runtime error trace logs.",
      },
    ],
    bestPractices: [
      "Unpublish tools instead of deleting them to preserve historical SEO traffic and audit logs.",
      "Verify SEO meta tags and category assignments after creating any new tool.",
    ],
  },
  content: {
    title: "Content Management System (CMS)",
    subtitle: "Publishing and managing website content, blog posts, static pages, and FAQs.",
    badge: "CMS & Publishing",
    purpose:
      "This section manages public website text copy, blog posts, tool usage guides, static legal pages (About, Terms, Privacy), and structured FAQs.",
    subpages: [
      {
        name: "Homepage Content",
        route: "/admin/content/homepage",
        description:
          "Customize hero titles, feature announcement banners, call-to-action cards, and highlighted tool showcases.",
      },
      {
        name: "Static Pages",
        route: "/admin/content/pages",
        description:
          "Edit and publish core platform pages such as About Us, Privacy Policy, Terms of Service, and Contact Us.",
      },
      {
        name: "Blog & Guides",
        route: "/admin/content/blog",
        description:
          "Draft, schedule, and publish blog articles and tool tutorial guides using the rich text editor.",
      },
      {
        name: "FAQs Directory",
        route: "/admin/content/faqs",
        description:
          "Create and manage structured FAQ items for tools and platform features to improve search engine rankings.",
      },
    ],
    bestPractices: [
      "Inspect Title tags (50-60 chars) and Meta Descriptions before publishing blog posts.",
    ],
  },
  seo: {
    title: "SEO & Search Engine Optimization",
    subtitle: "Global metadata, sitemaps, robots.txt, 301 redirects, and schema markup.",
    badge: "SEO & Indexing",
    purpose:
      "This section controls search engine visibility, indexing rules, metadata defaults, XML sitemaps, and URL redirect rules across the platform.",
    subpages: [
      {
        name: "Global SEO Defaults",
        route: "/admin/seo/global",
        description:
          "Configure site-wide Meta Title patterns, Meta Descriptions, OpenGraph images, Twitter Cards, and canonical URL settings.",
      },
      {
        name: "Tool SEO Overrides",
        route: "/admin/seo/tools",
        description:
          "Set tool-specific SEO titles, targeted keywords, structured JSON-LD schemas, and AEO answer blocks.",
      },
      {
        name: "Sitemap & Robots.txt",
        route: "/admin/seo/sitemap",
        description:
          "Set XML sitemap generation frequency and edit search crawler rules in `robots.txt`.",
      },
      {
        name: "301 / 302 Redirects",
        route: "/admin/seo/redirects",
        description:
          "Create permanent (301) and temporary (302) URL redirect rules to fix broken links and preserve search equity.",
      },
    ],
    bestPractices: [
      "Always set up a 301 Redirect when changing an existing tool slug to avoid losing search rankings.",
    ],
  },
  analytics: {
    title: "Analytics & Traffic Insights",
    subtitle: "Real-time traffic metrics, tool usage velocity, user engagement, and performance trends.",
    badge: "Data & Metrics",
    purpose:
      "This section provides administrators with deep-dive analytics computed from real production database records, covering site traffic, tool execution velocity, and user conversion rates.",
    subpages: [
      {
        name: "Analytics Overview",
        route: "/admin/analytics",
        description:
          "High-level snapshot of platform performance: total page views, unique visitors, active user sessions, and top executed tools.",
      },
      {
        name: "Website Traffic",
        route: "/admin/analytics/website",
        description:
          "Traffic sources (Organic, Direct, Referral), device distribution (Mobile, Desktop), bounce rates, and geographic visitor breakdown.",
      },
      {
        name: "Tool Performance",
        route: "/admin/analytics/tools",
        description:
          "Top executed tools, average execution speed, error rates, and daily tool usage trend graphs.",
      },
      {
        name: "User Growth",
        route: "/admin/analytics/users",
        description:
          "Sign-up velocity, active versus dormant accounts, and free-to-paid subscriber conversion rates.",
      },
    ],
    bestPractices: [
      "Review tool failure rates weekly to proactively catch broken third-party APIs or worker errors.",
    ],
  },
  users: {
    title: "User Management",
    subtitle: "User profiles, plan management, access status, and user directory.",
    badge: "Users & Accounts",
    purpose:
      "This section allows administrators to view registered user accounts, manage subscription plans, toggle active/blocked statuses, and inspect individual usage history.",
    subpages: [
      {
        name: "All Users Directory",
        route: "/admin/users",
        description:
          "Searchable directory of registered users. Filter by name, email, plan type (Free/Pro), registration date, and account status.",
      },
      {
        name: "User Actions & Profile",
        route: "/admin/users",
        description:
          "Inspect user profile details, update subscription tier, send password reset emails, or block suspicious accounts.",
      },
    ],
    bestPractices: [
      "Review audit logs before blocking a user account and document the justification.",
    ],
  },
  notifications: {
    title: "Admin Notifications",
    subtitle: "Real-time system notification hub for system events and critical alerts.",
    badge: "Alerts & Events",
    purpose:
      "This section acts as a centralized notification center for real-time alerts regarding payment failures, runtime errors, administrative role assignments, and system updates.",
    subpages: [
      {
        name: "Notification Stream",
        route: "/admin/notifications",
        description:
          "List of all system notifications. Filter by read/unread status, mark single or all items as read, or delete old alerts.",
      },
      {
        name: "Notification Preferences",
        route: "/admin/notifications",
        description:
          "Configure trigger channels (In-app, Email, Webhooks) for critical system events.",
      },
    ],
    bestPractices: [
      "Address CRITICAL notifications immediately to maintain system stability.",
    ],
  },
  "audit-logs": {
    title: "Audit Logs & Security Trail",
    subtitle: "Immutable append-only audit trail recording every administrative mutation.",
    badge: "Security & Auditing",
    purpose:
      "This section provides an immutable, append-only audit logging system that records every administrative mutation (logins, user modifications, tool deletions, role updates, report downloads, refunds) for security compliance.",
    subpages: [
      {
        name: "Audit Event Directory",
        route: "/admin/audit-logs",
        description:
          "List of security events showing Event ID, timestamp, actor (Name/Email/Role), action type, target resource, and IP address.",
      },
      {
        name: "Diff & State Inspector",
        route: "/admin/audit-logs",
        description:
          "Inspect exact JSON state diffs (Before vs After) and sanitized metadata for any administrative action.",
      },
    ],
    bestPractices: [
      "Audit logs are immutable and cannot be edited or deleted, ensuring full security compliance.",
    ],
  },
  admins: {
    title: "Admin Accounts & RBAC Roles",
    subtitle: "Administrator accounts, 2FA enforcement, and fine-grained RBAC permissions.",
    badge: "Access Control",
    purpose:
      "This section manages administrator accounts, enforces Two-Factor Authentication (2FA), and configures fine-grained Role-Based Access Control (RBAC) permissions.",
    subpages: [
      {
        name: "Administrator Directory",
        route: "/admin/admins",
        description:
          "List of admin team members, assigned system roles (Super Admin, Finance, Support, Content Manager), 2FA status, and active sessions.",
      },
      {
        name: "Roles & Permission Matrix",
        route: "/admin/roles",
        description:
          "Define system roles and configure permission matrices (e.g. `tools.view`, `finance.refund`, `reports.create`).",
      },
    ],
    bestPractices: [
      "Follow the Least Privilege Principle when assigning roles to support or content personnel.",
    ],
  },
  "error-monitoring": {
    title: "Error Monitoring & Diagnostics",
    subtitle: "Real-time exception tracking, error grouping, and incident resolution workflow.",
    badge: "System Health",
    purpose:
      "This section tracks runtime application exceptions, broken API endpoints, and system errors in real time.",
    subpages: [
      {
        name: "Error Directory",
        route: "/admin/error-monitoring",
        description:
          "View error messages, full stack traces, affected browser/OS, frequency, and status (Open, Investigating, Resolved, Ignored).",
      },
      {
        name: "Incident Resolution",
        route: "/admin/error-monitoring",
        description:
          "Assign errors to admin developers, update incident status, and mark issues as Resolved.",
      },
    ],
    bestPractices: [
      "Prioritize high-frequency errors first and verify audit logs after deploying fixes.",
    ],
  },
  feedback: {
    title: "Contact & User Feedback",
    subtitle: "User feedback collection, rating management, and support requests.",
    badge: "User Relations",
    purpose:
      "This section organizes user feedback ratings (1-5 stars), bug reports, feature requests, and tool feedback submitted by website visitors.",
    subpages: [
      {
        name: "Feedback Directory",
        route: "/admin/feedback",
        description:
          "View user ratings, comments, targeted tools, user emails, and resolution statuses.",
      },
    ],
    bestPractices: [
      "Respond promptly to low ratings (1-2 stars) to improve tool user experience.",
    ],
  },
  settings: {
    title: "System Settings",
    subtitle: "Platform configuration, email SMTP credentials, security policies, and DB backup.",
    badge: "Platform Config",
    purpose:
      "This section manages foundational platform settings including SMTP email credentials, third-party API keys, security headers, and database backups.",
    subpages: [
      {
        name: "General & Branding",
        route: "/admin/settings/general",
        description:
          "Configure site title, logo, support email, default language, and timezone settings.",
      },
      {
        name: "Email & SMTP",
        route: "/admin/settings/email",
        description:
          "Configure SMTP mail server credentials for transactional emails (password resets, invoices, notifications).",
      },
      {
        name: "Security & API",
        route: "/admin/settings/api",
        description:
          "Configure IP whitelists, CORS origin rules, API rate limiting, and environment credentials.",
      },
      {
        name: "Backup & Maintenance",
        route: "/admin/settings/backup",
        description:
          "Execute 1-click database backups, view backup logs, and toggle platform maintenance mode.",
      },
    ],
    bestPractices: [
      "Broadcast an announcement banner before enabling Maintenance Mode.",
    ],
  },
  "brand-studio": {
    title: "Brand Studio",
    subtitle: "Brand identity, templates, products, and visual assets.",
    badge: "Brand Assets",
    purpose:
      "This section manages brand assets, product templates, visual guidelines, and pricing configurations.",
    subpages: [
      {
        name: "Products & Templates",
        route: "/admin/brand-studio/products",
        description: "Manage brand products, design templates, and visual assets.",
      },
    ],
    bestPractices: ["Ensure all uploaded brand assets adhere to official brand guidelines."],
  },
  dashboard: {
    title: "Admin Dashboard",
    subtitle: "Central command center for platform performance, KPIs, and real-time operations.",
    badge: "Command Center",
    purpose:
      "This is the central command center for Avex Tools. Monitor overall platform health, daily traffic, active users, tool executions, monthly revenue, and system status at a glance.",
    subpages: [
      {
        name: "KPI Metrics Summary",
        route: "/admin",
        description:
          "Snapshot cards for total site traffic, active user count, daily tool execution volume, monthly revenue, and pending system alerts.",
      },
      {
        name: "Live Activity Feed",
        route: "/admin",
        description:
          "Real-time activity stream displaying recent tool usage, new user sign-ups, and system alerts.",
      },
    ],
    bestPractices: [
      "Investigate any red warning indicators immediately in Error Monitoring or Audit Logs.",
    ],
  },
};

export function AdminAboutPanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Determine current active section based on route
  let sectionKey = "dashboard";
  if (pathname.startsWith("/admin/reports")) sectionKey = "reports";
  else if (pathname.startsWith("/admin/monetization")) sectionKey = "monetization";
  else if (pathname.startsWith("/admin/media")) sectionKey = "media";
  else if (pathname.startsWith("/admin/ai-writer")) sectionKey = "ai-writer";
  else if (
    pathname.startsWith("/admin/tools") ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/navigation")
  )
    sectionKey = "tools";
  else if (pathname.startsWith("/admin/content")) sectionKey = "content";
  else if (pathname.startsWith("/admin/seo")) sectionKey = "seo";
  else if (pathname.startsWith("/admin/analytics")) sectionKey = "analytics";
  else if (pathname.startsWith("/admin/users")) sectionKey = "users";
  else if (pathname.startsWith("/admin/notifications")) sectionKey = "notifications";
  else if (pathname.startsWith("/admin/audit-logs")) sectionKey = "audit-logs";
  else if (pathname.startsWith("/admin/admins") || pathname.startsWith("/admin/roles"))
    sectionKey = "admins";
  else if (pathname.startsWith("/admin/error-monitoring")) sectionKey = "error-monitoring";
  else if (pathname.startsWith("/admin/feedback")) sectionKey = "feedback";
  else if (pathname.startsWith("/admin/settings")) sectionKey = "settings";
  else if (pathname.startsWith("/admin/brand-studio")) sectionKey = "brand-studio";

  const guide = SECTION_GUIDES[sectionKey] || SECTION_GUIDES.dashboard;

  return (
    <div className="w-full my-4">
      {/* Light subtle trigger text / button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2 text-xs md:text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-100 cursor-pointer border border-zinc-200/60 bg-white shadow-2xs"
        title="Click to view section documentation and guide"
      >
        <Info className="h-4 w-4 text-orange-600 shrink-0" />
        <span>About {guide.title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
        )}
      </button>

      {/* Collapsible Dropdown Panel - Clean Light Theme without Heavy Dark Background */}
      {isOpen && (
        <div className="mt-3 bg-white border border-zinc-200/90 rounded-xl p-5 shadow-sm text-zinc-800 transition-all animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 mb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 text-orange-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-base md:text-lg text-zinc-900">
                  {guide.title}
                </h4>
                <p className="text-xs text-zinc-500">{guide.subtitle}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 self-start sm:self-center">
              {guide.badge}
            </span>
          </div>

          {/* Section Purpose */}
          <div className="mb-5 bg-zinc-50/80 p-4 rounded-lg border border-zinc-200/70">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-600" /> Purpose & Overview
            </h5>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {guide.purpose}
            </p>
          </div>

          {/* Subpages & Features Breakdown */}
          {guide.subpages && guide.subpages.length > 0 && (
            <div className="mb-5">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-orange-600" /> Sub-pages & Feature Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guide.subpages.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-zinc-50/60 border border-zinc-200/70 hover:border-orange-300 transition-colors"
                  >
                    <div className="font-semibold text-sm text-zinc-900 mb-1 flex items-center justify-between">
                      <span>{sub.name}</span>
                      {sub.route && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-600">
                          {sub.route}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices & Guidelines */}
          {guide.bestPractices && guide.bestPractices.length > 0 && (
            <div className="pt-3 border-t border-zinc-100">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-orange-600" /> Best Practices & Security Guidelines
              </h5>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600">
                {guide.bestPractices.map((bp, i) => (
                  <li key={i} className="leading-relaxed">
                    {bp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer toggle button to close */}
          <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Close Guide</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
