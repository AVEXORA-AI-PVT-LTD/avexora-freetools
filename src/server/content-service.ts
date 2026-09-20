import { prisma } from "@/server/db";
import { ContentType, ContentStatus, ContentItem } from "@prisma/client";
import { draftMode } from "next/headers";

export async function getPublishedContent(slug: string, type?: ContentType): Promise<ContentItem | null> {
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: any = { slug };
  if (!isDraftMode) {
    where.OR = [
      { status: ContentStatus.PUBLISHED },
      { status: ContentStatus.SCHEDULED, scheduledAt: { lte: new Date() } }
    ];
  }
  if (type) where.contentType = type;
  
  const item = await prisma.contentItem.findFirst({
    where,
    include: {
      author: {
        select: { name: true, image: true, email: true, jobRole: true, companyName: true }
      }
    }
  });

  if (item && !isDraftMode) {
    await prisma.contentItem.update({
      where: { id: item.id },
      data: { views: { increment: 1 } }
    });
  }

  return item;
}

export async function getPublishedList(type: ContentType): Promise<ContentItem[]> {
  const isDraftMode = (await draftMode()).isEnabled;
  
  const where: any = { contentType: type };
  if (!isDraftMode) {
    where.OR = [
      { status: ContentStatus.PUBLISHED },
      { status: ContentStatus.SCHEDULED, scheduledAt: { lte: new Date() } }
    ];
  }
  
  return prisma.contentItem.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: {
      author: {
        select: { name: true, image: true, email: true }
      }
    }
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
