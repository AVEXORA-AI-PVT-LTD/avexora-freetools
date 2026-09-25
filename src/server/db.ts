import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prisma_v19?: PrismaClient };

// Force a new client if the old cached one doesn't have the new model
if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma_v19 || !(globalForPrisma.prisma_v19 as any).mediaAsset) {
    globalForPrisma.prisma_v19 = new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma_v19 ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v19 = prisma;

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  return !url.includes("<") && !url.includes(">");
}
