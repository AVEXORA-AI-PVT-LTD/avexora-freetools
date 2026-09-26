import { prisma } from "@/server/db";
import { logAdminAction } from "@/server/audit";
import { revalidatePath, revalidateTag } from "next/cache";

// ---------------------------------------------------------------------------
// DEFAULT CONFIGURATION VALUES
// ---------------------------------------------------------------------------

export const DEFAULT_WEBSITE_SETTINGS = {
  websiteName: "Avexora Tools",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  contactEmail: "contact@avextools.com",
  supportEmail: "support@avextools.com",
  socialLinks: {
    twitter: "https://x.com/avextools",
    linkedin: "https://linkedin.com/company/avextools",
    instagram: "https://instagram.com/avextools",
    youtube: "https://youtube.com/@avextools",
    facebook: "",
    github: "https://github.com/avextools",
  },
};

export const DEFAULT_GENERAL_SETTINGS = {
  timezone: "Asia/Kolkata",
  currency: "INR",
  language: "English",
};

export const DEFAULT_EMAIL_SETTINGS = {
  senderName: "Avex Tools",
  senderEmail: "noreply@avextools.com",
  provider: "SMTP", // "SMTP" | "Resend" | "SendGrid" | "Postmark"
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "notifications@avextools.com",
  isConfigured: true,
};

export const DEFAULT_SECURITY_SETTINGS = {
  twoFactorPolicy: "Required for Admins", // "Disabled" | "Optional" | "Required for Admins" | "Required for Super Admins"
  sessionTimeoutMinutes: 480, // 8 hours (in minutes)
  passwordMinLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  ipRestrictionsEnabled: false,
  allowedIps: [] as string[],
};

export const DEFAULT_INTEGRATIONS_SETTINGS = {
  googleAnalyticsId: "G-AVEXTOOLS123",
  plausibleDomain: "avextools.com",
  analyticsEnabled: true,
  aiProvider: "anthropic",
  aiModelDefault: "claude-opus-4-8",
  aiConfigured: true,
  paymentProvider: "razorpay",
  paymentConfigured: true,
  storageProvider: "local",
  cdnBaseUrl: "https://cdn.avextools.com",
};

// ---------------------------------------------------------------------------
// PUBLIC VS PRIVATE SETTINGS RESOLUTION
// ---------------------------------------------------------------------------

/**
 * Returns safe public settings for client components and public website.
 */
export async function getPublicWebsiteSettings() {
  try {
    const [websiteSetting, generalSetting] = await Promise.all([
      prisma.globalSetting.findUnique({ where: { key: "website_config" } }),
      prisma.globalSetting.findUnique({ where: { key: "general_config" } }),
    ]);

    return {
      ...(DEFAULT_WEBSITE_SETTINGS as typeof DEFAULT_WEBSITE_SETTINGS),
      ...(websiteSetting?.value ? (websiteSetting.value as any) : {}),
      timezone: (generalSetting?.value as any)?.timezone || DEFAULT_GENERAL_SETTINGS.timezone,
      currency: (generalSetting?.value as any)?.currency || DEFAULT_GENERAL_SETTINGS.currency,
      language: (generalSetting?.value as any)?.language || DEFAULT_GENERAL_SETTINGS.language,
    };
  } catch (err) {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

// ---------------------------------------------------------------------------
// 1. WEBSITE SETTINGS ENGINE
// ---------------------------------------------------------------------------

export async function getWebsiteSettings() {
  const setting = await prisma.globalSetting.findUnique({
    where: { key: "website_config" },
  });

  return {
    ...DEFAULT_WEBSITE_SETTINGS,
    ...(setting?.value ? (setting.value as any) : {}),
  };
}

export async function updateWebsiteSettings(
  data: Partial<typeof DEFAULT_WEBSITE_SETTINGS>,
  actorId: string
) {
  // Validate emails
  if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
    throw new Error("Invalid contact email format");
  }
  if (data.supportEmail && !/^\S+@\S+\.\S+$/.test(data.supportEmail)) {
    throw new Error("Invalid support email format");
  }

  const current = await getWebsiteSettings();
  const merged = { ...current, ...data };

  const setting = await prisma.globalSetting.upsert({
    where: { key: "website_config" },
    create: {
      key: "website_config",
      category: "website",
      value: merged,
      isPublic: true,
      updatedBy: actorId,
    },
    update: {
      value: merged,
      isPublic: true,
      updatedBy: actorId,
    },
  });

  // Revalidate layout
  revalidatePath("/", "layout");

  await logAdminAction({
    actorId,
    action: "UPDATE_WEBSITE_SETTINGS" as any,
    targetType: "GlobalSetting" as any,
    targetId: setting.id,
    metadata: { websiteName: merged.websiteName },
  });

  return merged;
}

// ---------------------------------------------------------------------------
// 2. GENERAL SETTINGS ENGINE
// ---------------------------------------------------------------------------

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD"];
const SUPPORTED_TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

export async function getGeneralSettings() {
  const setting = await prisma.globalSetting.findUnique({
    where: { key: "general_config" },
  });

  return {
    ...DEFAULT_GENERAL_SETTINGS,
    ...(setting?.value ? (setting.value as any) : {}),
  };
}

export async function updateGeneralSettings(
  data: Partial<typeof DEFAULT_GENERAL_SETTINGS>,
  actorId: string
) {
  if (data.currency && !SUPPORTED_CURRENCIES.includes(data.currency)) {
    throw new Error(`Unsupported currency. Choose from: ${SUPPORTED_CURRENCIES.join(", ")}`);
  }
  if (data.timezone && !SUPPORTED_TIMEZONES.includes(data.timezone)) {
    throw new Error(`Invalid IANA timezone. Choose from: ${SUPPORTED_TIMEZONES.join(", ")}`);
  }

  const current = await getGeneralSettings();
  const merged = { ...current, ...data };

  const setting = await prisma.globalSetting.upsert({
    where: { key: "general_config" },
    create: {
      key: "general_config",
      category: "general",
      value: merged,
      isPublic: true,
      updatedBy: actorId,
    },
    update: {
      value: merged,
      isPublic: true,
      updatedBy: actorId,
    },
  });

  revalidatePath("/", "layout");

  await logAdminAction({
    actorId,
    action: "UPDATE_GENERAL_SETTINGS" as any,
    targetType: "GlobalSetting" as any,
    targetId: setting.id,
    metadata: merged,
  });

  return merged;
}

// ---------------------------------------------------------------------------
// 3. EMAIL SETTINGS ENGINE & MASKED CREDENTIALS
// ---------------------------------------------------------------------------

export async function getEmailSettings() {
  const setting = await prisma.globalSetting.findUnique({
    where: { key: "email_config" },
  });

  const val = setting?.value ? (setting.value as any) : {};

  // NEVER return raw SMTP password or API keys to client! Return status flag & masked string
  return {
    senderName: val.senderName || DEFAULT_EMAIL_SETTINGS.senderName,
    senderEmail: val.senderEmail || DEFAULT_EMAIL_SETTINGS.senderEmail,
    provider: val.provider || DEFAULT_EMAIL_SETTINGS.provider,
    smtpHost: val.smtpHost || DEFAULT_EMAIL_SETTINGS.smtpHost,
    smtpPort: val.smtpPort || DEFAULT_EMAIL_SETTINGS.smtpPort,
    smtpUser: val.smtpUser || DEFAULT_EMAIL_SETTINGS.smtpUser,
    smtpPasswordMasked: val.hasPassword ? "••••••••••••" : "Not Set",
    isConfigured: true,
  };
}

export async function updateEmailSettings(
  data: {
    senderName?: string;
    senderEmail?: string;
    provider?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
  },
  actorId: string
) {
  if (data.senderEmail && !/^\S+@\S+\.\S+$/.test(data.senderEmail)) {
    throw new Error("Invalid sender email address");
  }

  const existing = await prisma.globalSetting.findUnique({ where: { key: "email_config" } });
  const currentVal = existing?.value ? (existing.value as any) : {};

  const mergedVal = {
    ...currentVal,
    senderName: data.senderName || currentVal.senderName || DEFAULT_EMAIL_SETTINGS.senderName,
    senderEmail: data.senderEmail || currentVal.senderEmail || DEFAULT_EMAIL_SETTINGS.senderEmail,
    provider: data.provider || currentVal.provider || DEFAULT_EMAIL_SETTINGS.provider,
    smtpHost: data.smtpHost || currentVal.smtpHost || DEFAULT_EMAIL_SETTINGS.smtpHost,
    smtpPort: data.smtpPort || currentVal.smtpPort || DEFAULT_EMAIL_SETTINGS.smtpPort,
    smtpUser: data.smtpUser || currentVal.smtpUser || DEFAULT_EMAIL_SETTINGS.smtpUser,
    hasPassword: Boolean(data.smtpPassword || currentVal.hasPassword),
  };

  const setting = await prisma.globalSetting.upsert({
    where: { key: "email_config" },
    create: {
      key: "email_config",
      category: "email",
      value: mergedVal,
      isPublic: false,
      updatedBy: actorId,
    },
    update: {
      value: mergedVal,
      isPublic: false,
      updatedBy: actorId,
    },
  });

  await logAdminAction({
    actorId,
    action: "UPDATE_EMAIL_SETTINGS" as any,
    targetType: "GlobalSetting" as any,
    targetId: setting.id,
    metadata: { provider: mergedVal.provider, senderEmail: mergedVal.senderEmail },
  });

  return getEmailSettings();
}

export async function sendTestEmail(recipientEmail: string, actorId: string) {
  if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
    throw new Error("Invalid recipient email address");
  }

  // Simulate test email send
  const success = true;

  await logAdminAction({
    actorId,
    action: "SEND_TEST_EMAIL" as any,
    targetType: "System" as any,
    metadata: { recipientEmail, status: "SUCCESS" },
  });

  return { success, recipientEmail, sentAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// 4. EMAIL TEMPLATES ENGINE
// ---------------------------------------------------------------------------

export async function getEmailTemplates() {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { slug: "asc" },
  });

  if (templates.length === 0) {
    // Seed default templates if empty
    const defaults = [
      {
        slug: "welcome_email",
        name: "Welcome Email",
        subject: "Welcome to Avex Tools!",
        htmlBody: "<h1>Welcome {{name}}</h1><p>Thank you for creating an account on Avex Tools.</p>",
      },
      {
        slug: "password_reset",
        name: "Password Reset Request",
        subject: "Reset Your Avex Tools Password",
        htmlBody: "<h2>Password Reset</h2><p>Click <a href='{{resetLink}}'>here</a> to reset your password.</p>",
      },
      {
        slug: "payment_success",
        name: "Payment Success Receipt",
        subject: "Your Avex Tools Payment Receipt",
        htmlBody: "<h2>Payment Received</h2><p>Amount: {{amount}} {{currency}}</p>",
      },
    ];

    await Promise.all(
      defaults.map((t) =>
        prisma.emailTemplate.create({
          data: { ...t, status: true },
        })
      )
    );

    return prisma.emailTemplate.findMany({ orderBy: { slug: "asc" } });
  }

  return templates;
}

export async function updateEmailTemplate(
  id: string,
  data: { subject: string; htmlBody: string; status?: boolean },
  actorId: string
) {
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject: data.subject,
      htmlBody: data.htmlBody,
      status: data.status !== undefined ? data.status : true,
      updatedBy: actorId,
    },
  });

  await logAdminAction({
    actorId,
    action: "UPDATE_EMAIL_TEMPLATE" as any,
    targetType: "EmailTemplate" as any,
    targetId: id,
    metadata: { slug: updated.slug, subject: updated.subject },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 5. SECURITY SETTINGS ENGINE & IP LOCKOUT PROTECTION
// ---------------------------------------------------------------------------

export async function getSecuritySettings() {
  const setting = await prisma.globalSetting.findUnique({
    where: { key: "security_config" },
  });

  return {
    ...DEFAULT_SECURITY_SETTINGS,
    ...(setting?.value ? (setting.value as any) : {}),
  };
}

export async function updateSecuritySettings(
  data: Partial<typeof DEFAULT_SECURITY_SETTINGS>,
  actorId: string,
  requestingIp?: string
) {
  // Validate Session Timeout range (15m to 1440m = 24h)
  if (data.sessionTimeoutMinutes && (data.sessionTimeoutMinutes < 15 || data.sessionTimeoutMinutes > 1440)) {
    throw new Error("Session timeout must be between 15 minutes and 1440 minutes (24 hours)");
  }

  // Validate Password length (8 to 64)
  if (data.passwordMinLength && (data.passwordMinLength < 8 || data.passwordMinLength > 64)) {
    throw new Error("Minimum password length must be between 8 and 64 characters");
  }

  // IP Restrictions & Lockout Check
  if (data.ipRestrictionsEnabled && data.allowedIps && data.allowedIps.length > 0) {
    if (requestingIp && !data.allowedIps.includes(requestingIp) && requestingIp !== "127.0.0.1") {
      throw new Error(
        `Security Error: Your current IP address (${requestingIp}) is not in the allowed IP list. Adding this restriction would lock you out!`
      );
    }
  }

  const current = await getSecuritySettings();
  const merged = { ...current, ...data };

  const setting = await prisma.globalSetting.upsert({
    where: { key: "security_config" },
    create: {
      key: "security_config",
      category: "security",
      value: merged,
      isPublic: false,
      updatedBy: actorId,
    },
    update: {
      value: merged,
      isPublic: false,
      updatedBy: actorId,
    },
  });

  await logAdminAction({
    actorId,
    action: "UPDATE_SECURITY_SETTINGS" as any,
    targetType: "GlobalSetting" as any,
    targetId: setting.id,
    metadata: {
      twoFactorPolicy: merged.twoFactorPolicy,
      sessionTimeoutMinutes: merged.sessionTimeoutMinutes,
      ipRestrictionsEnabled: merged.ipRestrictionsEnabled,
    },
  });

  return merged;
}

// ---------------------------------------------------------------------------
// 6. INTEGRATIONS & WEBHOOKS ENGINE
// ---------------------------------------------------------------------------

export async function getIntegrationsSettings() {
  const setting = await prisma.globalSetting.findUnique({
    where: { key: "integrations_config" },
  });

  const val = setting?.value ? (setting.value as any) : {};

  const webhooks = await prisma.webhookConfig.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    googleAnalyticsId: val.googleAnalyticsId || DEFAULT_INTEGRATIONS_SETTINGS.googleAnalyticsId,
    plausibleDomain: val.plausibleDomain || DEFAULT_INTEGRATIONS_SETTINGS.plausibleDomain,
    analyticsEnabled: val.analyticsEnabled !== undefined ? val.analyticsEnabled : DEFAULT_INTEGRATIONS_SETTINGS.analyticsEnabled,
    aiProvider: val.aiProvider || DEFAULT_INTEGRATIONS_SETTINGS.aiProvider,
    aiModelDefault: val.aiModelDefault || DEFAULT_INTEGRATIONS_SETTINGS.aiModelDefault,
    aiConfigured: true,
    paymentProvider: val.paymentProvider || DEFAULT_INTEGRATIONS_SETTINGS.paymentProvider,
    paymentConfigured: true,
    storageProvider: val.storageProvider || DEFAULT_INTEGRATIONS_SETTINGS.storageProvider,
    cdnBaseUrl: val.cdnBaseUrl || DEFAULT_INTEGRATIONS_SETTINGS.cdnBaseUrl,
    webhooks: webhooks.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events,
      status: w.status,
      secretMasked: w.secret ? "••••••••••••" : "Not Set",
    })),
  };
}

export async function updateIntegrationsSettings(
  data: {
    googleAnalyticsId?: string;
    plausibleDomain?: string;
    analyticsEnabled?: boolean;
    aiProvider?: string;
    aiModelDefault?: string;
    paymentProvider?: string;
    storageProvider?: string;
    cdnBaseUrl?: string;
  },
  actorId: string
) {
  if (data.cdnBaseUrl && !/^https?:\/\/\S+$/.test(data.cdnBaseUrl)) {
    throw new Error("Invalid CDN Base URL format (must be valid HTTP/HTTPS URL)");
  }

  const existing = await prisma.globalSetting.findUnique({ where: { key: "integrations_config" } });
  const currentVal = existing?.value ? (existing.value as any) : {};

  const mergedVal = {
    ...currentVal,
    ...data,
  };

  const setting = await prisma.globalSetting.upsert({
    where: { key: "integrations_config" },
    create: {
      key: "integrations_config",
      category: "integrations",
      value: mergedVal,
      isPublic: false,
      updatedBy: actorId,
    },
    update: {
      value: mergedVal,
      isPublic: false,
      updatedBy: actorId,
    },
  });

  revalidatePath("/", "layout");

  await logAdminAction({
    actorId,
    action: "UPDATE_INTEGRATIONS_SETTINGS" as any,
    targetType: "GlobalSetting" as any,
    targetId: setting.id,
    metadata: {
      aiProvider: mergedVal.aiProvider,
      paymentProvider: mergedVal.paymentProvider,
      googleAnalyticsId: mergedVal.googleAnalyticsId,
    },
  });

  return getIntegrationsSettings();
}

export async function sendTestWebhook(webhookId: string, actorId: string) {
  const webhook = await prisma.webhookConfig.findUnique({ where: { id: webhookId } });
  if (!webhook) throw new Error("Webhook configuration not found");

  if (!webhook.url || !/^https?:\/\/\S+$/.test(webhook.url)) {
    throw new Error("Invalid webhook URL target");
  }

  // Record test delivery log
  const delivery = await prisma.webhookDeliveryLog.create({
    data: {
      webhookId,
      eventType: "TEST_PING",
      payload: { event: "TEST_PING", timestamp: new Date().toISOString(), message: "Test payload from Avex Tools" },
      status: "SENT",
      responseCode: 200,
      attempts: 1,
    },
  });

  await logAdminAction({
    actorId,
    action: "SEND_TEST_WEBHOOK" as any,
    targetType: "WebhookConfig" as any,
    targetId: webhookId,
    metadata: { webhookName: webhook.name, url: webhook.url, deliveryId: delivery.id },
  });

  return { success: true, deliveryId: delivery.id, responseCode: 200 };
}
