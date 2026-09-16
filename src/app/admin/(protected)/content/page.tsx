import { requireAdminAuth } from "@/server/admin-auth";
import { getEffectiveContents, CONTENT_BLOCKS_LIST } from "@/server/content";
import { ContentForm } from "./ContentForm";

export const metadata = {
  title: "Website Content | Admin Panel",
};

export default async function AdminContentPage() {
  await requireAdminAuth("content.view");

  const effectiveContents = await getEffectiveContents();
  
  // Group by section
  const grouped = CONTENT_BLOCKS_LIST.reduce((acc, block) => {
    if (!acc[block.section]) acc[block.section] = [];
    acc[block.section].push(block);
    return acc;
  }, {} as Record<string, typeof CONTENT_BLOCKS_LIST>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Website Content</h1>
        <p className="text-sm text-slate-500">Manage configurable website text across the site.</p>
      </div>

      <div className="space-y-10">
        {Object.entries(grouped).map(([section, blocks]) => (
          <div key={section} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">{section}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {blocks.map((block) => (
                <ContentForm 
                  key={block.key} 
                  config={block} 
                  initialValue={effectiveContents[block.key]} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
