import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Force a new client if the old cached one doesn't have the new model
if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma || !('navigationLink' in globalForPrisma.prisma)) {
    globalForPrisma.prisma = new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function isDatabaseConfigured(): boolean {
  return !process.env.DATABASE_URL?.includes("<") && !process.env.DATABASE_URL?.includes(">");
}
