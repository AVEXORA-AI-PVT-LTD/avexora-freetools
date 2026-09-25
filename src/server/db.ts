import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma_v23?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma_v23) {
      globalForPrisma.prisma_v23 = new PrismaClient();
    }
    return globalForPrisma.prisma_v23;
  }
  if (!globalForPrisma.prisma_v23 || !(globalForPrisma.prisma_v23 as any).errorLog) {
    globalForPrisma.prisma_v23 = new PrismaClient();
  }
  return globalForPrisma.prisma_v23;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  return !url.includes("<") && !url.includes(">");
}
