import { prisma } from "@/server/db";
import { ContentType, ContentStatus, ContentItem } from "@prisma/client";
import { draftMode } from "next/headers";

export async function getPublishedContent(slug: string, type?: ContentType): Promise<ContentItem | null> {
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: any = { slug };
  if (!isDraftMode) {
    where.status = ContentStatus.PUBLISHED;
  }
  if (type) where.contentType = type;
  
  return prisma.contentItem.findFirst({ where });
}

export async function getPublishedList(type: ContentType): Promise<ContentItem[]> {
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: any = { contentType: type };
  if (!isDraftMode) {
    where.status = ContentStatus.PUBLISHED;
  }
  
  return prisma.contentItem.findMany({
    where,
    orderBy: { publishedAt: "desc" }
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
