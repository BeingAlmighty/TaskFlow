import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

if (!globalForPrisma.prisma_v5) {
  globalForPrisma.prisma_v5 = new PrismaClient();
}

export const prisma = globalForPrisma.prisma_v5;
