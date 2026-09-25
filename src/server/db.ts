import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prisma_v22?: PrismaClient };

if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma_v22 || !(globalForPrisma.prisma_v22 as any).contactSubmission) {
    globalForPrisma.prisma_v22 = new PrismaClient();
  }
}

export const prisma: PrismaClient = globalForPrisma.prisma_v22 ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v22 = prisma;

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  return !url.includes("<") && !url.includes(">");
}
