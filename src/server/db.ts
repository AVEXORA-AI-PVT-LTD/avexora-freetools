import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * A real Mongo connection string can never contain a literal `<...>`
 * placeholder. `.env.example` ships with one (e.g. `<cluster-host>`), and if it
 * is ever copied into `.env` as-is, Prisma fails at query time with a confusing
 * `PrismaClientInitializationError` ("Malformed label"). Routes should use this
 * guard to fail fast and return a structured error response instead.
 */
export function isDatabaseConfigured(): boolean {
  return !process.env.DATABASE_URL?.includes("<") && !process.env.DATABASE_URL?.includes(">");
}
