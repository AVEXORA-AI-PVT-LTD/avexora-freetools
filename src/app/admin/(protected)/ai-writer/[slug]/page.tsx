import { requireAdminAuth } from "@/server/admin-auth";
import { getAiToolDetailAction } from "../ai-actions";
import { AiToolEditor } from "./AiToolEditor";
import { notFound } from "next/navigation";

export const metadata = {
  title: "AI Tool Configuration & Prompts | Admin Panel",
};

export default async function AiToolEditorPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  await requireAdminAuth("ai.view");
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const { toolMeta, effectiveConfig, revisions, stats } = await getAiToolDetailAction(slug);

    return (
      <AiToolEditor
        toolMeta={toolMeta}
        effectiveConfig={effectiveConfig}
        revisions={revisions}
        stats={stats}
      />
    );
  } catch (err) {
    notFound();
  }
}
