const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '..');

// Helper para normalizar strings (remover acentos e minúsculas)
function normalizeString(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function processCSV(filename, callback) {
  return new Promise((resolve, reject) => {
    console.log(`Processando ${filename}...`);
    if (!fs.existsSync(path.join(DATA_DIR, filename))) {
      console.warn(`⚠️ Arquivo ${filename} não encontrado. Pulando.`);
      return resolve();
    }
    const stream = fs.createReadStream(path.join(DATA_DIR, filename))
      .pipe(csv())
      .on('data', callback)
      .on('end', () => {
        console.log(`${filename} processado com sucesso.`);
        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🧹 Limpando dados eleitorais anteriores...');
  await prisma.healthFacility.deleteMany({});
  await prisma.neighborhoodMetric.deleteMany({});
  await prisma.electoralResult.deleteMany({});
  await prisma.citizenDemand.deleteMany({});
  await prisma.neighborhood.deleteMany({});
  
  let city = await prisma.city.findFirst({ where: { ibgeCode: '3170206' }});
  if (!city) {
    city = await prisma.city.create({
      data: {
        id: 'city-udi-01',
        name: 'Uberlândia',
        state: 'MG',
        ibgeCode: '3170206',
        latitude: -18.9186,
        longitude: -48.2772,
      }
    });
  }

  // 1. Mapeamento de Zonas e Seções -> Bairros
  const secaoBairroMap = {};
  const bairrosStats = {}; // { "bairro_norm": { nome, eleitores } }
  const zonaEleitoresTotal = {}; // { "zona": total_eleitores }
  const zonaBairrosWeights = {}; // { "zona": { "bairro_norm": peso } }
  
  const processedSections = new Set();

  console.log('📊 Calculando pesos demográficos por Zona/Bairro...');
  await processCSV('Perfil Eleitorado por Local Uberlandia.csv', (data) => {
    if (data.ano !== '2020' && data.ano !== '2022') return; 
    
    const zona = data.zona;
    const secao = data.secao;
    const bairroRaw = data.bairro;
    const eleitores = parseInt(data.eleitores_secao) || 0;

    if (!zona || !bairroRaw) return;

    const bairroNormalizado = normalizeString(bairroRaw);
    const key = `${zona}_${secao}`;

    if (secao && !secaoBairroMap[key]) {
      secaoBairroMap[key] = bairroNormalizado;
    }

    if (!bairrosStats[bairroNormalizado]) {
      bairrosStats[bairroNormalizado] = {
        nome: bairroRaw,
        eleitores: 0,
        rendaMedia: Math.floor(Math.random() * 5000) + 1500
      };
    }
    
    // Evitar duplicidade de contagem de eleitores (usar apenas 2022 se disponível)
    if (data.ano === '2022') {
        const yearSecaoKey = `2022_${key}`;
        if (!processedSections.has(yearSecaoKey)) {
          processedSections.add(yearSecaoKey);
          
          bairrosStats[bairroNormalizado].eleitores += eleitores;
          
          // Acumular total por zona para cálculo de peso
          if (!zonaEleitoresTotal[zona]) zonaEleitoresTotal[zona] = 0;
          zonaEleitoresTotal[zona] += eleitores;

          if (!zonaBairrosWeights[zona]) zonaBairrosWeights[zona] = {};
          if (!zonaBairrosWeights[zona][bairroNormalizado]) zonaBairrosWeights[zona][bairroNormalizado] = 0;
          zonaBairrosWeights[zona][bairroNormalizado] += eleitores;
        }
    }
  });

  // Converter contagem em pesos (porcentagem)
  for (const zona in zonaBairrosWeights) {
    const total = zonaEleitoresTotal[zona];
    for (const b in zonaBairrosWeights[zona]) {
      zonaBairrosWeights[zona][b] = zonaBairrosWeights[zona][b] / total;
    }
  }

  // 2. Mapeamento de Candidatos
  const candidatosMap = {};
  await processCSV('Candidatos Uberlandia.csv', (data) => {
    const numero = data.numero;
    const nome = data.nome_urna || data.nome;
    if (numero && nome) candidatosMap[numero] = nome;
  });

  const votosPorBairro = {}; // { bairro_norm: { cand_key: { nome, votos, ano } } }

  // 3. Votos por SEÇÃO (Dados Precisos - Federais)
  const anosSecaoProcessados = new Set();
  await processCSV('Resultado Candidato por Secao Uberlandia.csv', (data) => {
    const zona = data.zona;
    const secao = data.secao;
    const numCandidato = data.numero_candidato || data.numero_partido; 
    const votos = parseInt(data.votos) || 0;
    const ano = data.ano;

    if (!zona || !secao || !numCandidato) return;
    anosSecaoProcessados.add(ano);

    const key = `${zona}_${secao}`;
    const bairroNormalizado = secaoBairroMap[key];

    if (bairroNormalizado) {
      if (!votosPorBairro[bairroNormalizado]) votosPorBairro[bairroNormalizado] = {};
      const candidateKey = `${ano}_${numCandidato}`;
      if (!votosPorBairro[bairroNormalizado][candidateKey]) {
        votosPorBairro[bairroNormalizado][candidateKey] = {
          nome: candidatosMap[numCandidato] || `Candidato ${numCandidato}`,
          votos: 0,
          ano: parseInt(ano)
        };
      }
      votosPorBairro[bairroNormalizado][candidateKey].votos += votos;
    }
  });

  // 4. Votos por ZONA (Distribuição Proporcional - Municipais)
  console.log('🧪 Distribuindo votos das eleições municipais via alocação proporcional...');
  await processCSV('Resultado Candidato por Zona Uberlandia.csv', (data) => {
    const ano = data.ano;
    // Se já temos esse ano via Seção (mais preciso), pulamos o dado de Zona
    if (anosSecaoProcessados.has(ano)) return;

    const zona = data.zona;
    const numCandidato = data.numero_candidato || data.numero_partido;
    const votosZona = parseInt(data.votos) || 0;

    if (!zona || !numCandidato || !zonaBairrosWeights[zona]) return;

    // Distribuir os votos da zona para cada bairro proporcionalmente ao seu eleitorado na zona
    for (const [bairroNorm, peso] of Object.entries(zonaBairrosWeights[zona])) {
      if (!votosPorBairro[bairroNorm]) votosPorBairro[bairroNorm] = {};
      
      const candidateKey = `${ano}_${numCandidato}`;
      if (!votosPorBairro[bairroNorm][candidateKey]) {
        votosPorBairro[bairroNorm][candidateKey] = {
          nome: candidatosMap[numCandidato] || `Candidato ${numCandidato}`,
          votos: 0,
          ano: parseInt(ano)
        };
      }
      votosPorBairro[bairroNorm][candidateKey].votos += Math.round(votosZona * peso);
    }
  });

  console.log('🚀 Salvando no banco de dados...');
  for (const [bairroNorm, stats] of Object.entries(bairrosStats)) {
    if (!stats.nome) continue;

    const neighborhood = await prisma.neighborhood.create({
      data: {
        id: `bairro-${bairroNorm}`,
        name: stats.nome,
        totalVoters: stats.eleitores,
        averageIncome: stats.rendaMedia,
        cityId: city.id
      }
    });

    if (votosPorBairro[bairroNorm]) {
      const candidatosDoBairro = Object.values(votosPorBairro[bairroNorm]);
      candidatosDoBairro.sort((a, b) => b.votos - a.votos);
      
      if (candidatosDoBairro.length > 0) {
        // Chunk inserts for performance if needed, but createMany is fine for ~70 neighborhoods
        await prisma.electoralResult.createMany({
          data: candidatosDoBairro.map(c => ({
            id: `elec-${neighborhood.id}-${c.ano}-${c.nome}-${Math.random().toString(36).substring(7)}`,
            neighborhoodId: neighborhood.id,
            year: c.ano,
            candidateName: c.nome,
            votesCount: c.votos
          }))
        });
      }
    }
  }

  console.log('✅ Importação TSE (Híbrida: Seção + Zona Proporcional) concluída!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
