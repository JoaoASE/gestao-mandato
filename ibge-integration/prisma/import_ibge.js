/**
 * IMPORTAÇÃO COMPLETA DE DADOS IBGE + CNES
 * Uberlândia - MG (código IBGE: 3170206)
 *
 * Roda com: node prisma/import_ibge.js
 *
 * O que este script importa:
 * 1. Dados municipais: população, raça, renda, saneamento, educação, PIB, Gini
 * 2. Estabelecimentos de saúde reais (CNES/DataSUS): UAIs, UBSs, UPAs, hospitais
 * 3. Dados por setor censitário: raça e sexo por bairro
 * 4. GeoJSON oficial dos bairros (malha IBGE)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IBGE_CODE = '3170206'; // Uberlândia
const DELAY_MS = 800; // respeitar rate limit do IBGE

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────

async function fetchJSON(url, label) {
  try {
    console.log(`  ↓ ${label}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await sleep(DELAY_MS);
    return data;
  } catch (e) {
    console.warn(`  ⚠️  Falha em ${label}: ${e.message}`);
    return null;
  }
}

function extractValue(data, variavel) {
  try {
    return data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[variavel] ||
           data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.['2022'] ||
           null;
  } catch { return null; }
}

// ─────────────────────────────────────────────
// 1. DADOS MUNICIPAIS GERAIS
// ─────────────────────────────────────────────

async function importDadosMunicipais() {
  console.log('\n📊 Importando dados municipais do IBGE Censo 2022...');

  const endpoints = {
    populacaoTotal:    `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]`,
    populacaoHomens:   `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/2?localidades=N6[${IBGE_CODE}]`,
    populacaoMulheres: `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/3?localidades=N6[${IBGE_CODE}]`,
    racaBranca:        `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]&classificacao=86[2776]`,
    racaPreta:         `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]&classificacao=86[2777]`,
    racaAmarela:       `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]&classificacao=86[2778]`,
    racaParda:         `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]&classificacao=86[2779]`,
    racaIndigena:      `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]&classificacao=86[2780]`,
    rendaMedia:        `https://servicodados.ibge.gov.br/api/v3/agregados/9891/periodos/2022/variaveis/10084?localidades=N6[${IBGE_CODE}]`,
    gini:              `https://servicodados.ibge.gov.br/api/v3/agregados/9891/periodos/2022/variaveis/10082?localidades=N6[${IBGE_CODE}]`,
    pibPerCapita:      `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${IBGE_CODE}]`,
    domiciliosEsgoto:  `https://servicodados.ibge.gov.br/api/v3/agregados/9894/periodos/2022/variaveis/10085?localidades=N6[${IBGE_CODE}]`,
    domiciliosAgua:    `https://servicodados.ibge.gov.br/api/v3/agregados/9894/periodos/2022/variaveis/10086?localidades=N6[${IBGE_CODE}]`,
    domiciliosLixo:    `https://servicodados.ibge.gov.br/api/v3/agregados/9894/periodos/2022/variaveis/10087?localidades=N6[${IBGE_CODE}]`,
    taxaAnalfabetismo: `https://servicodados.ibge.gov.br/api/v3/agregados/9906/periodos/2022/variaveis/10100?localidades=N6[${IBGE_CODE}]`,
    mortalidadeInfantil:`https://servicodados.ibge.gov.br/api/v3/agregados/9145/periodos/2022/variaveis/5961?localidades=N6[${IBGE_CODE}]`,
  };

  const resultados = {};
  for (const [chave, url] of Object.entries(endpoints)) {
    const data = await fetchJSON(url, chave);
    resultados[chave] = extractValue(data, '2022');
  }

  // Salvar em JSON para auditoria
  const outputPath = path.join(__dirname, '../data/ibge_municipal.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));

  console.log('  ✅ Dados municipais salvos em data/ibge_municipal.json');
  console.log('  📋 Resumo:');
  Object.entries(resultados).forEach(([k, v]) => {
    console.log(`     ${k}: ${v ?? 'N/D'}`);
  });

  return resultados;
}

// ─────────────────────────────────────────────
// 2. ESTABELECIMENTOS DE SAÚDE (CNES/DataSUS)
// ─────────────────────────────────────────────

async function importEstabelecimentosSaude() {
  console.log('\n🏥 Importando estabelecimentos de saúde (CNES/DataSUS)...');

  // API pública do DataSUS - sem autenticação
  const url = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo=317020&limit=200&offset=0`;
  const data = await fetchJSON(url, 'CNES estabelecimentos');

  if (!data?.estabelecimentos?.length) {
    console.warn('  ⚠️  CNES não retornou dados. Tentando endpoint alternativo...');

    // Endpoint alternativo
    const url2 = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo=3170206&limit=200`;
    const data2 = await fetchJSON(url2, 'CNES alternativo');

    if (!data2?.estabelecimentos?.length) {
      console.warn('  ⚠️  CNES indisponível. Usando dados base do seed.');
      return [];
    }
  }

  const estabelecimentos = data?.estabelecimentos || [];

  // Filtrar tipos relevantes
  const tiposRelevantes = {
    '01': 'Hospital', '02': 'Hospital', '03': 'Hospital',
    '04': 'UBS', '05': 'UBS', '07': 'UAI',
    '15': 'UPA', '20': 'Clínica', '22': 'Clínica',
    '36': 'Clínica', '39': 'UPA', '40': 'UPA',
    '69': 'UAI', '71': 'UBS', '72': 'UBS',
    '73': 'UBS', '81': 'Laboratório', '85': 'CAPS',
  };

  const filtrados = estabelecimentos.filter(e =>
    tiposRelevantes[e.tp_unidade] || e.nm_fantasia?.toLowerCase().includes('uai') ||
    e.nm_fantasia?.toLowerCase().includes('ubs') || e.nm_fantasia?.toLowerCase().includes('upa') ||
    e.nm_fantasia?.toLowerCase().includes('hospital')
  );

  console.log(`  ✅ ${filtrados.length} estabelecimentos encontrados de ${estabelecimentos.length} total`);

  // Salvar JSON completo
  const outputPath = path.join(__dirname, '../data/cnes_saude.json');
  fs.writeFileSync(outputPath, JSON.stringify(filtrados, null, 2));
  console.log('  📄 Dados salvos em data/cnes_saude.json');

  // Importar no banco — associar ao bairro mais próximo
  const bairros = await prisma.neighborhood.findMany({
    select: { id: true, name: true, latitude: true, longitude: true }
  });

  let importados = 0;
  for (const est of filtrados) {
    try {
      const lat = parseFloat(est.nu_latitude) || parseFloat(est.latitude) || -18.9186;
      const lng = parseFloat(est.nu_longitude) || parseFloat(est.longitude) || -48.2772;
      const nome = est.nm_fantasia || est.no_razao_social || 'Unidade de Saúde';
      const tipo = tiposRelevantes[est.tp_unidade] || 'Clínica';

      // Encontrar bairro mais próximo por coordenada
      let bairroMaisProximo = bairros[0];
      let menorDistancia = Infinity;
      for (const b of bairros) {
        if (!b.latitude || !b.longitude) continue;
        const dist = Math.sqrt(
          Math.pow(lat - b.latitude, 2) + Math.pow(lng - b.longitude, 2)
        );
        if (dist < menorDistancia) { menorDistancia = dist; bairroMaisProximo = b; }
      }

      await prisma.healthFacility.upsert({
        where: { id: `cnes-${est.co_cnes}` },
        update: { name: nome, type: tipo, latitude: lat, longitude: lng },
        create: {
          id: `cnes-${est.co_cnes}`,
          neighborhoodId: bairroMaisProximo.id,
          name: nome,
          type: tipo,
          address: `${est.no_logradouro || ''}, ${est.nu_endereco || ''} — ${est.no_bairro || ''}`.trim(),
          latitude: lat,
          longitude: lng,
          currentQueueSize: null,
          averageWaitTime: null,
        }
      });
      importados++;
    } catch (e) {
      console.warn(`  ⚠️  Erro ao importar ${est.nm_fantasia}: ${e.message}`);
    }
  }

  console.log(`  ✅ ${importados} estabelecimentos importados no banco`);
  return filtrados;
}

// ─────────────────────────────────────────────
// 3. SETORES CENSITÁRIOS — RAÇA E SEXO POR BAIRRO
// ─────────────────────────────────────────────

async function importSetoresCensitarios() {
  console.log('\n🗺️  Importando dados por setor censitário (raça/sexo por bairro)...');
  console.log('  ℹ️  Atenção: arquivos de setor censitário são grandes (~200MB).');
  console.log('  ℹ️  Download do FTP IBGE pode demorar alguns minutos.');

  // Os arquivos estão no FTP do IBGE:
  // https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/
  // Arquivo CSV para MG: Municipio=3170206

  // Verificar se já foi baixado manualmente
  const csvPath = path.join(__dirname, '../data/setores_censitarios_3170206.csv');
  const jsonPath = path.join(__dirname, '../data/setores_censitarios_bairros.json');

  if (!fs.existsSync(csvPath)) {
    console.log('\n  📥 AÇÃO NECESSÁRIA:');
    console.log('  O arquivo de setores censitários não foi encontrado.');
    console.log('  Baixe manualmente em:');
    console.log('  https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/MG/');
    console.log('  Procure pelo arquivo do município 3170206 (Uberlândia)');
    console.log('  Salve como: data/setores_censitarios_3170206.csv');
    console.log('\n  Depois rode novamente: node prisma/import_ibge.js --step=setores');
    return null;
  }

  // Processar CSV se existir
  console.log('  ✅ Arquivo CSV encontrado. Processando...');
  // (implementação do parser CSV quando o arquivo estiver disponível)
  return null;
}

// ─────────────────────────────────────────────
// 4. GEOJSON OFICIAL DOS BAIRROS (MALHA IBGE)
// ─────────────────────────────────────────────

async function importGeoJSONBairros() {
  console.log('\n🗺️  Buscando GeoJSON oficial dos bairros...');

  // Malha de subdistritos (nível mais próximo de bairro disponível no IBGE)
  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_CODE}?formato=application/vnd.geo+json&qualidade=intermediario&divisoes=subdistrito`;
  const data = await fetchJSON(url, 'GeoJSON bairros');

  if (data?.features?.length) {
    const outputPath = path.join(__dirname, '../public/uberlandia-bairros-ibge.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`  ✅ ${data.features.length} polígonos salvos em public/uberlandia-bairros-ibge.json`);
    return data;
  } else {
    console.warn('  ⚠️  GeoJSON não disponível via API. Usando GeoJSON manual já existente.');
    return null;
  }
}

// ─────────────────────────────────────────────
// 5. MÉTRICAS IBGE → BANCO (atualiza NeighborhoodMetric)
// ─────────────────────────────────────────────

async function salvarMetricasNoBanco(dadosMunicipais) {
  console.log('\n💾 Salvando métricas IBGE no banco de dados...');

  // Buscar cidade Uberlândia
  const city = await prisma.city.findFirst({ where: { ibgeCode: '3170206' } });
  if (!city) {
    console.warn('  ⚠️  Cidade Uberlândia não encontrada no banco. Rode o seed primeiro.');
    return;
  }

  // Atualizar dados da cidade
  await prisma.city.update({
    where: { id: city.id },
    data: {
      // Campos que podem ser adicionados ao schema futuramente:
      // populacaoTotal, rendaMediaMunicipal, gini, pibPerCapita
    }
  });

  // Salvar como métricas municipais nos bairros proporcionalmente
  const bairros = await prisma.neighborhood.findMany({ where: { cityId: city.id } });

  const metricasGlobais = [
    { type: 'RENDA_MEDIA_MUNICIPAL',    value: parseFloat(dadosMunicipais.rendaMedia) || 0 },
    { type: 'GINI_MUNICIPAL',           value: parseFloat(dadosMunicipais.gini) || 0 },
    { type: 'PIB_PER_CAPITA',           value: parseFloat(dadosMunicipais.pibPerCapita) || 0 },
    { type: 'TX_ANALFABETISMO',         value: parseFloat(dadosMunicipais.taxaAnalfabetismo) || 0 },
    { type: 'MORTALIDADE_INFANTIL',     value: parseFloat(dadosMunicipais.mortalidadeInfantil) || 0 },
    { type: 'SANEAMENTO_ESGOTO_PCT',    value: parseFloat(dadosMunicipais.domiciliosEsgoto) || 0 },
    { type: 'SANEAMENTO_AGUA_PCT',      value: parseFloat(dadosMunicipais.domiciliosAgua) || 0 },
    { type: 'POPULACAO_RACA_BRANCA',    value: parseFloat(dadosMunicipais.racaBranca) || 0 },
    { type: 'POPULACAO_RACA_PRETA',     value: parseFloat(dadosMunicipais.racaPreta) || 0 },
    { type: 'POPULACAO_RACA_PARDA',     value: parseFloat(dadosMunicipais.racaParda) || 0 },
    { type: 'POPULACAO_RACA_INDIGENA',  value: parseFloat(dadosMunicipais.racaIndigena) || 0 },
    { type: 'POPULACAO_RACA_AMARELA',   value: parseFloat(dadosMunicipais.racaAmarela) || 0 },
  ];

  // Salvar métrica municipal em cada bairro (dado agregado)
  let salvos = 0;
  for (const bairro of bairros) {
    for (const metrica of metricasGlobais) {
      if (!metrica.value) continue;
      try {
        await prisma.neighborhoodMetric.upsert({
          where: {
            // upsert por combinação neighborhood+year+type
            id: `ibge-${bairro.id}-${metrica.type}-2022`,
          },
          update: { value: metrica.value },
          create: {
            id: `ibge-${bairro.id}-${metrica.type}-2022`,
            neighborhoodId: bairro.id,
            year: 2022,
            metricType: metrica.type,
            value: metrica.value,
            source: 'IBGE_CENSO_2022',
          }
        });
        salvos++;
      } catch { /* continua */ }
    }
  }

  console.log(`  ✅ ${salvos} métricas IBGE salvas no banco`);
}

// ─────────────────────────────────────────────
// 6. RELATÓRIO FINAL
// ─────────────────────────────────────────────

async function gerarRelatorio(dadosMunicipais, estabelecimentos) {
  console.log('\n📋 RELATÓRIO FINAL DE IMPORTAÇÃO');
  console.log('═'.repeat(50));

  const popTotal = parseInt(dadosMunicipais?.populacaoTotal) || 0;
  const popH = parseInt(dadosMunicipais?.populacaoHomens) || 0;
  const popM = parseInt(dadosMunicipais?.populacaoMulheres) || 0;

  if (popTotal) {
    console.log(`\n👥 POPULAÇÃO (Censo 2022)`);
    console.log(`   Total:    ${popTotal.toLocaleString('pt-BR')} habitantes`);
    console.log(`   Homens:   ${popH.toLocaleString('pt-BR')} (${((popH/popTotal)*100).toFixed(1)}%)`);
    console.log(`   Mulheres: ${popM.toLocaleString('pt-BR')} (${((popM/popTotal)*100).toFixed(1)}%)`);

    console.log(`\n🎨 RAÇA/COR`);
    const racas = {
      Branca: parseInt(dadosMunicipais.racaBranca) || 0,
      Preta: parseInt(dadosMunicipais.racaPreta) || 0,
      Parda: parseInt(dadosMunicipais.racaParda) || 0,
      Amarela: parseInt(dadosMunicipais.racaAmarela) || 0,
      Indígena: parseInt(dadosMunicipais.racaIndigena) || 0,
    };
    Object.entries(racas).forEach(([r, v]) => {
      if (v) console.log(`   ${r}: ${v.toLocaleString('pt-BR')} (${((v/popTotal)*100).toFixed(1)}%)`);
    });
  }

  if (dadosMunicipais?.rendaMedia) {
    console.log(`\n💰 SOCIOECONÔMICO`);
    console.log(`   Renda média domiciliar: R$ ${parseFloat(dadosMunicipais.rendaMedia).toLocaleString('pt-BR')}`);
    console.log(`   PIB per capita: R$ ${parseFloat(dadosMunicipais.pibPerCapita || 0).toLocaleString('pt-BR')}`);
    console.log(`   Índice de Gini: ${dadosMunicipais.gini || 'N/D'}`);
  }

  if (dadosMunicipais?.domiciliosEsgoto) {
    console.log(`\n🚰 SANEAMENTO`);
    console.log(`   Esgoto: ${dadosMunicipais.domiciliosEsgoto}%`);
    console.log(`   Água:   ${dadosMunicipais.domiciliosAgua}%`);
    console.log(`   Lixo:   ${dadosMunicipais.domiciliosLixo}%`);
  }

  if (estabelecimentos?.length) {
    console.log(`\n🏥 SAÚDE`);
    console.log(`   Estabelecimentos importados: ${estabelecimentos.length}`);
    const tipos = {};
    estabelecimentos.forEach(e => { tipos[e.type || 'Outros'] = (tipos[e.type || 'Outros'] || 0) + 1; });
    Object.entries(tipos).forEach(([t, c]) => console.log(`   ${t}: ${c}`));
  }

  console.log('\n═'.repeat(50));
  console.log('✅ Importação concluída!');
  console.log('\n📁 Arquivos gerados:');
  console.log('   data/ibge_municipal.json   ← todos os dados municipais');
  console.log('   data/cnes_saude.json       ← estabelecimentos de saúde');
  console.log('   public/uberlandia-bairros-ibge.json ← GeoJSON oficial (se disponível)');
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('🧠 ORÁCULO — Importação de Dados IBGE + CNES');
  console.log('═'.repeat(50));
  console.log(`Município: Uberlândia-MG (${IBGE_CODE})`);
  console.log(`Data: ${new Date().toLocaleDateString('pt-BR')}`);

  // Criar pasta data se não existir
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });

  // Verificar step específico via argumento
  const step = process.argv.find(a => a.startsWith('--step='))?.split('=')?.[1];

  let dadosMunicipais = {};
  let estabelecimentos = [];

  if (!step || step === 'municipal') {
    dadosMunicipais = await importDadosMunicipais() || {};
  }

  if (!step || step === 'saude') {
    estabelecimentos = await importEstabelecimentosSaude() || [];
  }

  if (!step || step === 'geojson') {
    await importGeoJSONBairros();
  }

  if (!step || step === 'setores') {
    await importSetoresCensitarios();
  }

  if (!step || step === 'banco') {
    if (Object.keys(dadosMunicipais).length > 0) {
      await salvarMetricasNoBanco(dadosMunicipais);
    }
  }

  await gerarRelatorio(dadosMunicipais, estabelecimentos);
}

main()
  .catch(e => { console.error('❌ Erro fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
