import { requireAdminAuth } from "@/server/admin-auth";
import { getFeedbackByIdAction } from "../feedback-actions";
import { FeedbackDetailClient } from "./FeedbackDetailClient";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Submission Details | Contact & Feedback | Admin Panel",
};

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  await requireAdminAuth("feedback.view");
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  const data = await getFeedbackByIdAction(id);

  if (!data || !data.submission) {
    notFound();
  }

  return (
    <FeedbackDetailClient
      submission={data.submission}
      userContext={data.userContext}
      toolContext={data.toolContext}
      assignedAdmin={data.assignedAdmin}
      availableAdmins={data.availableAdmins}
    />
  );
}
