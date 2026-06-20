const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Calculating total voters from 2022 candidate votes...');
  const neighborhoods = await prisma.neighborhood.findMany();
  
  for (const n of neighborhoods) {
    const sumResult = await prisma.electoralResult.aggregate({
      _sum: {
        votesCount: true
      },
      where: {
        neighborhoodId: n.id,
        year: 2022
      }
    });
    
    const sum = sumResult._sum.votesCount || 0;
    
    if (sum > 0) {
      await prisma.neighborhood.update({
        where: { id: n.id },
        data: { totalVoters: sum }
      });
      console.log(`Updated ${n.name}: ${sum} voters`);
    } else {
      // If no 2022 data, try 2020 or 2018
      const sumResultOld = await prisma.electoralResult.aggregate({
        _sum: { votesCount: true },
        where: { neighborhoodId: n.id }
      });
      const oldSum = sumResultOld._sum.votesCount || 0;
      if (oldSum > 0) {
         await prisma.neighborhood.update({
          where: { id: n.id },
          data: { totalVoters: oldSum }
        });
        console.log(`Updated ${n.name} (from all years sum): ${oldSum} voters`);
      }
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
