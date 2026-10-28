import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supportpilot?schema=public',
    },
  },
  log: ['error'],
});

async function main() {
  console.log('Attempting connection to PostgreSQL at configured DATABASE_URL...');
  try {
    await prisma.$connect();
    console.log('SUCCESS: Connected to PostgreSQL database.');
    const ext = await prisma.$queryRawUnsafe(`SELECT extname FROM pg_extension WHERE extname = 'vector';`);
    console.log('pgvector extension query result:', ext);
  } catch (err: any) {
    console.error('DATABASE INTEGRITY VERIFICATION RESULT: FAILED_TO_CONNECT');
    console.error('Error Code:', err.code);
    console.error('Client Error Message:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
