const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando banco de dados...');
  // Limpa tudo na ordem correta devido a chaves estrangeiras
  await prisma.electoralResult.deleteMany({});
  await prisma.citizenDemand.deleteMany({});
  await prisma.neighborhood.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.city.deleteMany({});

  console.log('🏙️ Criando Cidade...');
  const city = await prisma.city.create({
    data: {
      id: 'city-udi-01',
      name: 'Uberlândia',
      state: 'MG',
      ibgeCode: '3170206',
      latitude: -18.9186,
      longitude: -48.2772,
    }
  });

  console.log('👤 Criando Candidato...');
  const candidate = await prisma.candidate.create({
    data: {
      id: 'cand-01',
      name: 'Candidato Teste',
      cityId: city.id,
      slug: 'candidato-teste'
    }
  });

  const bairros = [
    { id: 'b-fundinho', name: 'Fundinho', totalVoters: 5000, averageIncome: 9000, leisureAreasCount: 3, securityIncidents: 45, sanitationCoverage: 100.0, transportLines: 12 },
    { id: 'b-santamonica', name: 'Santa Mônica', totalVoters: 35000, averageIncome: 4500, leisureAreasCount: 8, securityIncidents: 120, sanitationCoverage: 98.5, transportLines: 15 },
    { id: 'b-gavea', name: 'Gávea / Parque Una', totalVoters: 8000, averageIncome: 12000, leisureAreasCount: 5, securityIncidents: 20, sanitationCoverage: 100.0, transportLines: 5 },
    { id: 'b-shopping', name: 'Shopping Park', totalVoters: 22000, averageIncome: 1900, leisureAreasCount: 2, securityIncidents: 180, sanitationCoverage: 85.0, transportLines: 8 },
    { id: 'b-martins', name: 'Martins', totalVoters: 15000, averageIncome: 4200, leisureAreasCount: 5, securityIncidents: 150, sanitationCoverage: 99.0, transportLines: 25 },
    { id: 'b-luizote', name: 'Luizote de Freitas', totalVoters: 25000, averageIncome: 1800, leisureAreasCount: 12, securityIncidents: 90, sanitationCoverage: 95.0, transportLines: 10 },
  ];

  console.log('🏘️ Criando Bairros, Histórico Eleitoral e Demandas...');
  for (const b of bairros) {
    const neighborhood = await prisma.neighborhood.create({
      data: {
        id: b.id,
        name: b.name,
        totalVoters: b.totalVoters,
        averageIncome: b.averageIncome,
        leisureAreasCount: b.leisureAreasCount,
        securityIncidents: b.securityIncidents,
        sanitationCoverage: b.sanitationCoverage,
        transportLines: b.transportLines,
        cityId: city.id,
      }
    });

    // Adicionar UAI para alguns bairros para simular filas
    if (b.name === 'Martins') {
      await prisma.healthFacility.create({
        data: {
          neighborhoodId: neighborhood.id,
          name: 'UAI Martins',
          type: 'UAI',
          latitude: -18.9242,
          longitude: -48.2831,
          currentQueueSize: 65,
          averageWaitTime: 120
        }
      });
    } else if (b.name === 'Luizote de Freitas') {
      await prisma.healthFacility.create({
        data: {
          neighborhoodId: neighborhood.id,
          name: 'UAI Luizote',
          type: 'UAI',
          latitude: -18.9105,
          longitude: -48.3300,
          currentQueueSize: 40,
          averageWaitTime: 80
        }
      });
    } else if (b.name === 'Santa Mônica') {
      await prisma.healthFacility.create({
        data: {
          neighborhoodId: neighborhood.id,
          name: 'UAI Tibery (Próxima)',
          type: 'UAI',
          latitude: -18.9110,
          longitude: -48.2560,
          currentQueueSize: 25,
          averageWaitTime: 45
        }
      });
    }

    // Mock de histórico eleitoral (Resultados de eleições passadas)
    await prisma.electoralResult.createMany({
      data: [
        {
          id: `elec-2020-${b.id}`,
          neighborhoodId: neighborhood.id,
          year: 2020,
          candidateName: 'Candidato Teste',
          votesCount: Math.floor(b.totalVoters * (Math.random() * 0.15 + 0.05)), // 5 a 20% dos votos
        },
        {
          id: `elec-2022-${b.id}`,
          neighborhoodId: neighborhood.id,
          year: 2022,
          candidateName: 'Candidato Teste (Deputado)',
          votesCount: Math.floor(b.totalVoters * (Math.random() * 0.20 + 0.10)), // Crescimento
        }
      ]
    });

    // Mock de demandas de cidadãos (reclamações/pedidos do bairro)
    const categorias = ['Saúde', 'Segurança', 'Infraestrutura', 'Educação'];
    for (let i = 0; i < 3; i++) {
      await prisma.citizenDemand.create({
        data: {
          id: `demand-${b.id}-${i}`,
          candidateId: candidate.id,
          neighborhoodId: neighborhood.id,
          title: `Problema com ${categorias[Math.floor(Math.random() * categorias.length)]}`,
          description: `Os moradores relataram problemas recorrentes nesta área durante as visitas da última semana.`,
          category: categorias[Math.floor(Math.random() * categorias.length)],
          sentiment: Math.random() > 0.5 ? 'Negativo' : 'Neutro',
          latitude: city.latitude + (Math.random() * 0.02 - 0.01),
          longitude: city.longitude + (Math.random() * 0.02 - 0.01),
          status: 'PENDENTE'
        }
      });
    }
  }

  console.log('✅ Banco de dados repovoado com sucesso com dados hiper-detalhados!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });