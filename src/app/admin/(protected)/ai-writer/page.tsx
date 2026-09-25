import { getAiToolsAction, getAiUsageAnalyticsAction } from "./ai-actions";
import { AiWriterClient } from "./AiWriterClient";

export const metadata = {
  title: "AI Writer Management | Admin Panel",
};

export default async function AiWriterAdminPage() {
  const { isCategoryEnabled, tools } = await getAiToolsAction();
  const analytics = await getAiUsageAnalyticsAction();

  return <AiWriterClient initialTools={tools} isCategoryEnabled={isCategoryEnabled} analytics={analytics} />;
}
