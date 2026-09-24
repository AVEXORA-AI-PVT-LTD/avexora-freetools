import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import { SITE_URL } from "@/tools/categories";
import { ValidationClient } from "./ValidationClient";
import type { SeoMetadata } from "@/server/seo-manager";

export const metadata = { title: "SEO Validation | Admin" };

export default async function ValidationPage() {
  await requireAdminAuth("seo.view");

  const configs = await prisma.toolConfig.findMany({
    select: { toolSlug: true, seoMetadata: true }
  });

  const validations = allTools.map(t => {
    const override = configs.find(c => c.toolSlug === t.slug)?.seoMetadata as SeoMetadata | null | undefined;
    const isOverride = !!override && Object.keys(override).length > 0;
    const title = override?.title || t.name;
    const description = override?.description || t.seoDescription;
    const canonical = override?.canonical || `${SITE_URL}/${t.category}/${t.slug}`;
    const noindex = override?.robotsIndex === false;

    const errors = [];
    const warnings = [];

    if (!title) errors.push("Missing SEO title");
    else if (title.length < 10) warnings.push("Title too short");
    else if (title.length > 70) warnings.push("Title too long");

    if (!description) errors.push("Missing meta description");
    else if (description.length < 50) warnings.push("Description too short");
    else if (description.length > 160) warnings.push("Description too long");

    if (!canonical) errors.push("Missing canonical URL");
    else if (!canonical.startsWith(SITE_URL)) errors.push("Canonical domain mismatch (Must be " + SITE_URL + ")");

    if (noindex) warnings.push("Page is set to NoIndex");

    if (canonical && canonical.includes("avextools.avexora.in")) {
      errors.push("CRITICAL: Legacy domain 'avextools.avexora.in' found in canonical.");
    }

    return {
      slug: t.slug,
      name: t.name,
      category: t.category,
      isOverride,
      errors,
      warnings,
      status: errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "PASSED"
    };
  });

  // Calculate stats
  const passed = validations.filter(v => v.status === "PASSED").length;
  const errorCount = validations.filter(v => v.status === "ERROR").length;
  const warningCount = validations.filter(v => v.status === "WARNING").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Validation Scanner</h1>
        <p className="mt-1 text-slate-600">Scan all public tools to detect metadata issues, invalid canonicals, and missing SEO fields.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{passed}</div>
          <div className="text-sm text-slate-500 font-medium">Passed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          <div className="text-sm text-slate-500 font-medium">Warnings</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-sm text-slate-500 font-medium">Errors</div>
        </div>
      </div>

      <ValidationClient validations={validations} />
    </div>
  );
}
