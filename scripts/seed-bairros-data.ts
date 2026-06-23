import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBairrosData() {
  console.log("Iniciando seed de dados estatísticos dos bairros...");

  try {
    const bairros = await prisma.neighborhood.findMany({
      include: { HealthFacilities: true, Metrics: true }
    });

    console.log(`Encontrados ${bairros.length} bairros no banco de dados.`);

    for (const bairro of bairros) {
      // 1. Atualizar dados faltantes do Bairro
      const needsUpdate = !bairro.averageIncome || bairro.totalVoters === 0 || !bairro.sanitationCoverage;
      
      if (needsUpdate) {
        await prisma.neighborhood.update({
          where: { id: bairro.id },
          data: {
            totalVoters: bairro.totalVoters || Math.floor(Math.random() * 15000) + 1000,
            averageIncome: bairro.averageIncome || Math.floor(Math.random() * 5000) + 1200,
            leisureAreasCount: bairro.leisureAreasCount || Math.floor(Math.random() * 10),
            securityIncidents: bairro.securityIncidents || Math.floor(Math.random() * 100),
            sanitationCoverage: bairro.sanitationCoverage || parseFloat((Math.random() * 20 + 80).toFixed(2)), // 80 a 100%
            transportLines: bairro.transportLines || Math.floor(Math.random() * 15) + 1,
          }
        });
      }

      // 2. Criar UAI se não existir
      if (bairro.HealthFacilities.length === 0) {
        // Apenas alguns bairros terão UAIs, mas para demonstração podemos colocar em 30% dos bairros ou criar UBS
        const hasUai = Math.random() > 0.7;
        const hasUbs = Math.random() > 0.4;

        if (hasUai) {
          await prisma.healthFacility.create({
            data: {
              neighborhoodId: bairro.id,
              name: `UAI ${bairro.name}`,
              type: "UAI",
              latitude: 0, // Poderíamos pegar a real, mas mock serve aqui
              longitude: 0,
              currentQueueSize: Math.floor(Math.random() * 50),
              averageWaitTime: Math.floor(Math.random() * 120) + 10,
            }
          });
        }
        if (hasUbs && !hasUai) {
           await prisma.healthFacility.create({
            data: {
              neighborhoodId: bairro.id,
              name: `UBS ${bairro.name}`,
              type: "UBS",
              latitude: 0,
              longitude: 0,
              currentQueueSize: Math.floor(Math.random() * 20),
              averageWaitTime: Math.floor(Math.random() * 60) + 5,
            }
          });
        }
      }

      // 3. Criar Métricas de Segurança (ROUBOS) por mês se não existir
      if (bairro.Metrics.length === 0) {
        const year = 2024;
        const metricsData = [];
        for (let month = 1; month <= 12; month++) {
          metricsData.push({
            neighborhoodId: bairro.id,
            year: year,
            month: month,
            metricType: "ROUBOS",
            value: Math.floor(Math.random() * 20)
          });
        }
        await prisma.neighborhoodMetric.createMany({
          data: metricsData
        });
      }
    }

    console.log("Seed de dados de bairros concluído com sucesso.");

  } catch (error) {
    console.error("Erro durante o seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBairrosData();
