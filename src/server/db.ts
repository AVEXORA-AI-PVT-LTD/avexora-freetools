import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma_v24?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma_v24) {
      globalForPrisma.prisma_v24 = new PrismaClient();
    }
    return globalForPrisma.prisma_v24;
  }
  if (!globalForPrisma.prisma_v24 || !(globalForPrisma.prisma_v24 as any).role) {
    globalForPrisma.prisma_v24 = new PrismaClient();
  }
  return globalForPrisma.prisma_v24;
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
