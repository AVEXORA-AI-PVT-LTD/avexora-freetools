import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import { notFound } from "next/navigation";
import { ToolSeoEditor } from "./ToolSeoEditor";
import { SITE_URL } from "@/tools/categories";

export const metadata = { title: "Edit Tool SEO | Admin" };

export default async function EditToolSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminAuth("seo.edit");
  const { slug } = await params;

  const tool = allTools.find(t => t.slug === slug);
  if (!tool) notFound();

  const config = await prisma.toolConfig.findUnique({
    where: { toolSlug: slug },
    select: { seoMetadata: true }
  });

  const override = config?.seoMetadata || {};

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit SEO: {tool.name}</h1>
        <p className="mt-1 text-slate-600">Override the automatically generated metadata for this specific tool.</p>
      </div>

      <ToolSeoEditor tool={tool} initialData={override} siteUrl={SITE_URL} />
    </div>
  );
}
