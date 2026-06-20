const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const DIR = path.join(__dirname, '..');

async function main() {
  console.log('🧹 Limpando banco de dados...');
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

  console.log('Carregando Candidatos...');
  const candidates = {}; 
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(DIR, 'Candidatos Uberlandia.csv'))
      .pipe(csv())
      .on('data', (data) => {
        if (data.numero && data.nome_urna) {
          candidates[data.numero.trim()] = data.nome_urna.trim();
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('Carregando Perfil Eleitorado...');
  const secaoToBairro = {}; 
  const bairroEleitores = {}; 
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(DIR, 'Perfil Eleitorado por Local Uberlandia.csv'))
      .pipe(csv())
      .on('data', (data) => {
        if (data.zona && data.secao && data.bairro) {
          const key = `${data.zona.trim()}-${data.secao.trim()}`;
          const bairro = data.bairro.trim().toUpperCase();
          secaoToBairro[key] = bairro;
          
          if (!bairroEleitores[bairro]) bairroEleitores[bairro] = 0;
          bairroEleitores[bairro] += parseInt(data.eleitores_secao || 0);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Criando ${Object.keys(bairroEleitores).length} bairros no banco...`);
  const bairroDbMap = {};
  for (const [bairroName, totalVoters] of Object.entries(bairroEleitores)) {
    // Título Case (ex: TABAJARAS -> Tabajaras)
    const titleCaseName = bairroName.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    const b = await prisma.neighborhood.create({
      data: {
        id: `b-${bairroName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: titleCaseName,
        totalVoters: totalVoters,
        cityId: city.id
      }
    });
    bairroDbMap[bairroName] = b.id;
  }

  console.log('Processando Resultados Eleitorais...');
  const resultados = {}; 
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(DIR, 'Resultado Candidato por Secao Uberlandia.csv'))
      .pipe(csv())
      .on('data', (data) => {
        const zona = (data.zona || '').trim();
        const secao = (data.secao || '').trim();
        const key = `${zona}-${secao}`;
        const bairro = secaoToBairro[key];
        
        if (bairro) {
          const numeroCandidato = (data.numero_candidato || '').trim();
          const candidatoName = candidates[numeroCandidato] || `Candidato ${numeroCandidato}`;
          const votos = parseInt(data.votos || 0);
          
          if (!resultados[bairro]) resultados[bairro] = {};
          if (!resultados[bairro][candidatoName]) resultados[bairro][candidatoName] = 0;
          resultados[bairro][candidatoName] += votos;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('Salvando Resultados Eleitorais no banco...');
  const insertData = [];
  for (const [bairro, cands] of Object.entries(resultados)) {
    const neighborhoodId = bairroDbMap[bairro];
    if (!neighborhoodId) continue;
    
    for (const [cand, votos] of Object.entries(cands)) {
      if (votos > 0) {
        // limit id to avoid max length, use crypto for unique id
        const cleanCand = cand.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
        insertData.push({
          id: `res-${neighborhoodId}-${cleanCand}-${Math.random().toString(36).substr(2, 5)}`,
          neighborhoodId: neighborhoodId,
          year: 2022, // Assumindo eleição de 2022 do arquivo
          candidateName: cand,
          votesCount: votos
        });
      }
    }
  }

  const chunkSize = 5000;
  for (let i = 0; i < insertData.length; i += chunkSize) {
    await prisma.electoralResult.createMany({
      data: insertData.slice(i, i + chunkSize),
      skipDuplicates: true,
    });
    console.log(`Inserido lote de resultados... (${Math.min(i + chunkSize, insertData.length)} / ${insertData.length})`);
  }

  console.log('✅ Banco populado com sucesso a partir dos CSVs do TSE!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
