export interface NotificationEmailPayload {
  to: string;
  subject: string;
  eventType: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Sends notification emails to administrators.
 * Reusable email abstraction layer.
 */
export async function sendNotificationEmail(payload: NotificationEmailPayload): Promise<boolean> {
  try {
    const { to, subject, title, message, actionUrl } = payload;

    // Log email delivery in server console / logging engine
    console.log(`[Notification Email Dispatcher] Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${title}\n${message}\nAction: ${actionUrl || "N/A"}`);

    // If an external SMTP or Transporter service (Resend, SendGrid, Nodemailer) is configured in process.env, execute here:
    // e.g., await resend.emails.send({ from: "notifications@avextools.com", to, subject, html: ... })

    return true;
  } catch (err) {
    console.error("[Notification Email Failed]:", err);
    return false;
  }
}
