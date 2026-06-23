const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando banco de dados...');
  await prisma.leisureArea.deleteMany({});
  await prisma.electoralResult.deleteMany({});
  await prisma.citizenDemand.deleteMany({});
  await prisma.healthFacility.deleteMany({});
  await prisma.neighborhoodMetric.deleteMany({});
  await prisma.electionProjection.deleteMany({});
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

  console.log('👤 Criando Candidato de Teste...');
  // clerkUserId = 'SUBSTITUIR' — após criar o usuário no Clerk,
  // atualize este valor com o ID real (começa com "user_")
  // Exemplo: UPDATE "Candidate" SET "clerkUserId" = 'user_abc123' WHERE id = 'cand-01';
  const candidate = await prisma.candidate.create({
    data: {
      id: 'cand-01',
      clerkUserId: 'seed_placeholder_substituir_pelo_clerk_user_id',
      name: 'Candidato Teste',
      cityId: city.id,
      slug: 'candidato-teste',
      plan: 'campanha',
    }
  });

  const bairros = [
    { id: 'b-fundinho',   name: 'Fundinho',           totalVoters: 5000,  averageIncome: 9000,  leisureAreasCount: 3,  securityIncidents: 45,  sanitationCoverage: 100.0, transportLines: 12 },
    { id: 'b-santamonica',name: 'Santa Mônica',        totalVoters: 35000, averageIncome: 4500,  leisureAreasCount: 8,  securityIncidents: 120, sanitationCoverage: 98.5,  transportLines: 15 },
    { id: 'b-gavea',      name: 'Gávea / Parque Una',  totalVoters: 8000,  averageIncome: 12000, leisureAreasCount: 5,  securityIncidents: 20,  sanitationCoverage: 100.0, transportLines: 5  },
    { id: 'b-shopping',   name: 'Shopping Park',       totalVoters: 22000, averageIncome: 1900,  leisureAreasCount: 2,  securityIncidents: 180, sanitationCoverage: 85.0,  transportLines: 8  },
    { id: 'b-martins',    name: 'Martins',             totalVoters: 15000, averageIncome: 4200,  leisureAreasCount: 5,  securityIncidents: 150, sanitationCoverage: 99.0,  transportLines: 25 },
    { id: 'b-luizote',    name: 'Luizote de Freitas',  totalVoters: 25000, averageIncome: 1800,  leisureAreasCount: 12, securityIncidents: 90,  sanitationCoverage: 95.0,  transportLines: 10 },
  ];

  console.log('🏘️ Criando Bairros...');
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

    // Instalações de saúde reais
    const uais = {
      'Martins':           { name: 'UAI Martins',           lat: -18.9242, lng: -48.2831, queue: 65, wait: 120 },
      'Luizote de Freitas':{ name: 'UAI Luizote',           lat: -18.9105, lng: -48.3300, queue: 40, wait: 80  },
      'Santa Mônica':      { name: 'UAI Tibery (Próxima)',   lat: -18.9110, lng: -48.2560, queue: 25, wait: 45  },
    };
    if (uais[b.name]) {
      const u = uais[b.name];
      await prisma.healthFacility.create({
        data: {
          neighborhoodId: neighborhood.id,
          name: u.name, type: 'UAI',
          latitude: u.lat, longitude: u.lng,
          currentQueueSize: u.queue, averageWaitTime: u.wait,
        }
      });
    }

    // Histórico eleitoral — percentuais fixos (sem Math.random no seed de produção)
    const votesPct = { 'b-fundinho': 0.08, 'b-santamonica': 0.12, 'b-gavea': 0.06,
                       'b-shopping': 0.09, 'b-martins': 0.11, 'b-luizote': 0.10 };
    const pct = votesPct[b.id] || 0.08;
    await prisma.electoralResult.createMany({
      data: [
        { id: `elec-2020-${b.id}`, neighborhoodId: neighborhood.id, year: 2020,
          candidateName: 'Candidato Teste', votesCount: Math.floor(b.totalVoters * pct) },
        { id: `elec-2022-${b.id}`, neighborhoodId: neighborhood.id, year: 2022,
          candidateName: 'Candidato Teste (Deputado)', votesCount: Math.floor(b.totalVoters * (pct + 0.03)) },
      ]
    });

    // Demandas de exemplo por categoria
    const demandas = [
      { cat: 'Saúde',          desc: 'Moradores relatam falta de médicos na UBS local.' },
      { cat: 'Segurança',      desc: 'Aumento de ocorrências noturnas na região.' },
      { cat: 'Infraestrutura', desc: 'Ruas com buracos e iluminação pública precária.' },
    ];
    for (let i = 0; i < demandas.length; i++) {
      await prisma.citizenDemand.create({
        data: {
          id: `demand-${b.id}-${i}`,
          candidateId: candidate.id,
          neighborhoodId: neighborhood.id,
          title: `Problema com ${demandas[i].cat}`,
          description: demandas[i].desc,
          category: demandas[i].cat,
          sentiment: 'Negativo',
          latitude: city.latitude + (i * 0.005),
          longitude: city.longitude + (i * 0.005),
          status: 'PENDENTE',
        }
      });
    }
  }

  console.log('');
  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('⚠️  IMPORTANTE: atualize o clerkUserId do candidato de teste após criar');
  console.log('   o usuário no Clerk. Execute no banco:');
  console.log("   UPDATE \"Candidate\" SET \"clerkUserId\" = 'user_SEU_ID_CLERK' WHERE id = 'cand-01';");
  console.log('');
  console.log('🌳 Agora rode: node scripts/import-leisure.js');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
