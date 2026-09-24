import { isDatabaseConfigured, prisma } from "@/server/db";
import { ContentType, ContentStatus, Prisma } from "@prisma/client";
import { draftMode } from "next/headers";

const contentAuthor = {
  select: { name: true, image: true, email: true, jobRole: true, companyName: true },
} satisfies Prisma.UserDefaultArgs;

const listAuthor = {
  select: { name: true, image: true, email: true },
} satisfies Prisma.UserDefaultArgs;

export type PublishedContent = Prisma.ContentItemGetPayload<{ include: { author: typeof contentAuthor } }>;
export type PublishedListItem = Prisma.ContentItemGetPayload<{ include: { author: typeof listAuthor } }>;

// CMS content lives only in the database. Without one (CI, `next build`, a
// bare container) there is none: pages render their empty state or 404, and
// admin saves revalidate them once a database is attached.

export async function getPublishedContent(slug: string, type?: ContentType): Promise<PublishedContent | null> {
  if (!isDatabaseConfigured()) return null;
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: Prisma.ContentItemWhereInput = { slug };
  if (!isDraftMode) {
    where.OR = [
      { status: ContentStatus.PUBLISHED },
      { status: ContentStatus.SCHEDULED, scheduledAt: { lte: new Date() } }
    ];
  }
  if (type) where.contentType = type;
  
  const item = await prisma.contentItem.findFirst({
    where,
    include: { author: contentAuthor }
  });

  if (item && !isDraftMode) {
    await prisma.contentItem.update({
      where: { id: item.id },
      data: { views: { increment: 1 } }
    });
  }

  return item;
}

export async function getPublishedList(type: ContentType): Promise<PublishedListItem[]> {
  if (!isDatabaseConfigured()) return [];
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: Prisma.ContentItemWhereInput = { contentType: type };
  if (!isDraftMode) {
    where.OR = [
      { status: ContentStatus.PUBLISHED },
      { status: ContentStatus.SCHEDULED, scheduledAt: { lte: new Date() } }
    ];
  }
  
  return prisma.contentItem.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: { author: listAuthor }
  });
}

export async function syncScheduledContent() {
  await prisma.contentItem.updateMany({
    where: {
      status: ContentStatus.SCHEDULED,
      scheduledAt: { lte: new Date() }
    },
    data: {
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });
}
