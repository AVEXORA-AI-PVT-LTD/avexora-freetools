"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  getGeneralSettings,
  updateGeneralSettings,
  getEmailSettings,
  updateEmailSettings,
  sendTestEmail,
  getEmailTemplates,
  updateEmailTemplate,
  getSecuritySettings,
  updateSecuritySettings,
  getIntegrationsSettings,
  updateIntegrationsSettings,
  sendTestWebhook,
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from "@/server/admin/settings-service";

// 1. Website Settings
export async function updateWebsiteSettingsAction(data: Partial<typeof DEFAULT_WEBSITE_SETTINGS>) {
  try {
    const adminUser = await requireAdminAuth("settings.website.update");
    const updated = await updateWebsiteSettings(data, adminUser.id);
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Update website settings action error:", err);
    return { success: false, error: err.message || "Failed to update website settings" };
  }
}

// 2. General Settings
export async function updateGeneralSettingsAction(data: Partial<typeof DEFAULT_GENERAL_SETTINGS>) {
  try {
    const adminUser = await requireAdminAuth("settings.general.update");
    const updated = await updateGeneralSettings(data, adminUser.id);
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Update general settings action error:", err);
    return { success: false, error: err.message || "Failed to update general settings" };
  }
}

// 3. Email Settings
export async function updateEmailSettingsAction(data: {
  senderName?: string;
  senderEmail?: string;
  provider?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}) {
  try {
    const adminUser = await requireAdminAuth("settings.email.update");
    const updated = await updateEmailSettings(data, adminUser.id);
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Update email settings action error:", err);
    return { success: false, error: err.message || "Failed to update email settings" };
  }
}

// 4. Test Email
export async function sendTestEmailAction(recipientEmail: string) {
  try {
    const adminUser = await requireAdminAuth("settings.email.test");
    const result = await sendTestEmail(recipientEmail, adminUser.id);
    return { success: true, result };
  } catch (err: any) {
    console.error("Send test email action error:", err);
    return { success: false, error: err.message || "Failed to send test email" };
  }
}

// 5. Update Email Template
export async function updateEmailTemplateAction(
  id: string,
  data: { subject: string; htmlBody: string; status?: boolean }
) {
  try {
    const adminUser = await requireAdminAuth("settings.email.update");
    const updated = await updateEmailTemplate(id, data, adminUser.id);
    return { success: true, template: updated };
  } catch (err: any) {
    console.error("Update email template action error:", err);
    return { success: false, error: err.message || "Failed to update email template" };
  }
}

// 6. Security Settings
export async function updateSecuritySettingsAction(
  data: Partial<typeof DEFAULT_SECURITY_SETTINGS>,
  requestingIp?: string
) {
  try {
    const adminUser = await requireAdminAuth("settings.security.update");
    const updated = await updateSecuritySettings(data, adminUser.id, requestingIp);
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Update security settings action error:", err);
    return { success: false, error: err.message || "Failed to update security settings" };
  }
}

// 7. Integrations Settings
export async function updateIntegrationsSettingsAction(data: {
  googleAnalyticsId?: string;
  plausibleDomain?: string;
  analyticsEnabled?: boolean;
  aiProvider?: string;
  aiModelDefault?: string;
  paymentProvider?: string;
  storageProvider?: string;
  cdnBaseUrl?: string;
}) {
  try {
    const adminUser = await requireAdminAuth("settings.integrations.update");
    const updated = await updateIntegrationsSettings(data, adminUser.id);
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Update integrations settings action error:", err);
    return { success: false, error: err.message || "Failed to update integration settings" };
  }
}

// 8. Test Webhook
export async function sendTestWebhookAction(webhookId: string) {
  try {
    const adminUser = await requireAdminAuth("settings.webhooks.test");
    const result = await sendTestWebhook(webhookId, adminUser.id);
    return { success: true, result };
  } catch (err: any) {
    console.error("Send test webhook action error:", err);
    return { success: false, error: err.message || "Failed to send test webhook" };
  }
}
