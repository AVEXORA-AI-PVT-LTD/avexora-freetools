const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.toolUsage.count();
  console.log("Total usage rows:", count);
  
  const groups = await prisma.toolUsage.groupBy({
    by: ['toolSlug'],
    _count: { toolSlug: true },
  });
  console.log(groups);
}
main().catch(console.error).finally(() => prisma.$disconnect());
