import { requireAdminAuth } from "@/server/admin-auth";
import { FeedbackClient } from "./FeedbackClient";

export const metadata = {
  title: "Contact & Feedback Management | Admin Panel",
};

export default async function ContactFeedbackAdminPage() {
  await requireAdminAuth("feedback.view");

  return <FeedbackClient />;
}
