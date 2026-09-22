import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { ContentEditor } from "./ContentEditor";
import { ContentType, ContentStatus } from "@prisma/client";
import { getAllCategoriesAdmin } from "@/server/category-service";
import { allTools } from "@/tools/registry";

export const metadata = { title: "Edit Content | Avex Tools Admin" };

export default async function ContentEditorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requireAdminAuth("content.edit");

  const isNew = params.id === "new";

  const authors = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin", "editor"] } },
    select: { id: true, name: true, email: true }
  });

  const allRegisteredTools = allTools;
  const tools = allRegisteredTools.map((t: any) => ({ id: t.slug, title: t.name, slug: t.slug }));

  const categories = await getAllCategoriesAdmin();
  
  const allContent = await prisma.contentItem.findMany({
    select: { id: true, title: true, slug: true }
  });

  
  let initialData: any = {
    title: "",
    slug: "",
    contentType: ContentType.PAGE,
    content: "",
    excerpt: "",
    featuredImage: "",
    status: ContentStatus.DRAFT,
    tags: [],
    category: "",
    seoTitle: "",
    metaDesc: "",
    ogTitle: "",
    ogDesc: "",
    ogImage: "",
    canonicalUrl: "",
    noIndex: false,
    authorId: user.id || "",
    featured: false,
    relatedTools: [],
    relatedPosts: [],
  };

  let revisions: any[] = [];

  if (!isNew) {
    const existing = await prisma.contentItem.findUnique({ where: { id: params.id } });
    if (!existing) return <div>Content not found</div>;
    initialData = existing;
    
    revisions = await prisma.contentRevision.findMany({
      where: { contentId: params.id },
      orderBy: { version: "desc" },
      take: 10
    });
  }

  return <ContentEditor initialData={initialData} isNew={isNew} revisions={revisions} userRole={user.role || "unknown"} authors={authors} tools={tools} allContent={allContent} />;
}
