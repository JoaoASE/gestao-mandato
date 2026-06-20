const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista das reais UAIs e Hospitais de Uberlândia para espalhar pela cidade
const realFacilities = [
  { name: 'UAI Martins', type: 'UAI', lat: -18.9242, lng: -48.2831, baseWait: 120, queue: 60 },
  { name: 'UAI Tibery', type: 'UAI', lat: -18.9110, lng: -48.2560, baseWait: 45, queue: 20 },
  { name: 'UAI Luizote', type: 'UAI', lat: -18.9105, lng: -48.3300, baseWait: 80, queue: 40 },
  { name: 'UAI Planalto', type: 'UAI', lat: -18.9320, lng: -48.3120, baseWait: 90, queue: 50 },
  { name: 'UAI Roosevelt', type: 'UAI', lat: -18.8950, lng: -48.2700, baseWait: 60, queue: 30 },
  { name: 'UAI Pampulha', type: 'UAI', lat: -18.9450, lng: -48.2500, baseWait: 50, queue: 25 },
  { name: 'UAI São Jorge', type: 'UAI', lat: -18.9550, lng: -48.2600, baseWait: 100, queue: 55 },
  { name: 'Hospital de Clínicas (HC-UFU)', type: 'Hospital', lat: -18.9150, lng: -48.2600, baseWait: 180, queue: 90 },
  { name: 'Hospital Municipal', type: 'Hospital', lat: -18.9100, lng: -48.3310, baseWait: 150, queue: 75 }
];

async function main() {
  console.log('Iniciando o preenchimento de TODA a cidade com dados simulados realistas...');

  const neighborhoods = await prisma.neighborhood.findMany();

  if (neighborhoods.length === 0) {
    console.error('Nenhum bairro encontrado no banco. Rode o import_tse.js primeiro.');
    return;
  }

  for (const neighborhood of neighborhoods) {
    // Gerar métricas simuladas baseadas em regras lógicas para parecerem reais
    // Bairros maiores (mais eleitores) tendem a ter mais problemas e mais linhas de ônibus
    const sizeMultiplier = Math.max(1, (neighborhood.totalVoters || 5000) / 10000);
    
    // Renda influencia saneamento (bairros mais ricos tem mais esgoto)
    const incomeLevel = neighborhood.averageIncome || 3000;
    const isWealthy = incomeLevel > 5000;
    
    const leisureAreasCount = Math.floor(Math.random() * 5 * sizeMultiplier) + (isWealthy ? 3 : 1);
    const securityIncidents = Math.floor(Math.random() * 80 * sizeMultiplier) + (isWealthy ? 20 : 50);
    const sanitationCoverage = isWealthy ? (95 + Math.random() * 5) : (80 + Math.random() * 15);
    const transportLines = Math.floor(Math.random() * 8 * sizeMultiplier) + 2;

    await prisma.neighborhood.update({
      where: { id: neighborhood.id },
      data: {
        leisureAreasCount: Math.round(leisureAreasCount),
        securityIncidents: Math.round(securityIncidents),
        sanitationCoverage: parseFloat(sanitationCoverage.toFixed(1)),
        transportLines: Math.round(transportLines),
      }
    });

    // Distribuir as instalações de saúde de forma semi-aleatória (1 ou 2 por bairro no máximo, ou nenhuma)
    // Para ficar bem preenchido, vamos colocar pelo menos 1 unidade próxima em quase todo bairro grande
    if (neighborhood.totalVoters > 5000 && Math.random() > 0.3) {
      const facility = realFacilities[Math.floor(Math.random() * realFacilities.length)];
      
      const existingFac = await prisma.healthFacility.findFirst({
        where: { name: facility.name, neighborhoodId: neighborhood.id }
      });

      // Variar a fila para não ficar estático
      const currentQueue = Math.max(0, facility.queue + Math.floor(Math.random() * 20 - 10));
      const waitTime = Math.max(15, facility.baseWait + Math.floor(Math.random() * 30 - 15));

      if (existingFac) {
        await prisma.healthFacility.update({
          where: { id: existingFac.id },
          data: {
            currentQueueSize: currentQueue,
            averageWaitTime: waitTime
          }
        });
      } else {
        await prisma.healthFacility.create({
          data: {
            neighborhoodId: neighborhood.id,
            name: facility.name,
            type: facility.type,
            latitude: facility.lat,
            longitude: facility.lng,
            currentQueueSize: currentQueue,
            averageWaitTime: waitTime
          }
        });
      }
    }
  }

  console.log(`✅ ${neighborhoods.length} bairros preenchidos com dados urbanos realistas e postos de saúde.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
