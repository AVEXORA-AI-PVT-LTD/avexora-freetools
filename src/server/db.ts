import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prisma_v16?: PrismaClient };

// Force a new client if the old cached one doesn't have the new model
if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma_v16) {
    globalForPrisma.prisma_v16 = new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma_v16 ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v16 = prisma;

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  return !url.includes("<") && !url.includes(">");
}
