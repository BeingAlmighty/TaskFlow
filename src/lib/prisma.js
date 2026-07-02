import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

if (!globalForPrisma.prisma_v5) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  globalForPrisma.prisma_v5 = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma_v5;
