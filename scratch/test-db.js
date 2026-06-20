const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testando conexão com o banco...');
    const stats = await prisma.estatisticaBairro.findMany();
    console.log('Sucesso! Encontrados:', stats.length);
  } catch (e) {
    console.error('Erro de conexão:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
