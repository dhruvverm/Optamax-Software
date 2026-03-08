import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const dbPath = path.join(process.cwd(), "dev.db");

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbPath }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
