/**
 * IMPORTAÇÃO IBGE v2 — Endpoints corrigidos
 * Uberlândia-MG (3170206)
 * node prisma/import_ibge_v2.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const IBGE = 'https://servicodados.ibge.gov.br/api/v3';
const COD = '3170206';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, label) {
  try {
    process.stdout.write(`  ↓ ${label}... `);
    const r = await fetch(url);
    if (!r.ok) { console.log(`❌ HTTP ${r.status}`); return null; }
    const d = await r.json();
    console.log('✅');
    await sleep(600);
    return d;
  } catch (e) { console.log(`❌ ${e.message}`); return null; }
}

// Extrai valor da estrutura do IBGE v3
function val(data, categoria) {
  try {
    const series = data?.[0]?.resultados;
    if (!series) return null;
    for (const resultado of series) {
      const serie = resultado?.series?.[0]?.serie;
      if (!serie) continue;
      // Tenta pegar o valor de 2022 diretamente
      if (serie['2022'] !== undefined) return serie['2022'];
    }
    return null;
  } catch { return null; }
}

// Extrai múltiplos valores de classificação (raça, sexo)
function valMulti(data) {
  try {
    const out = {};
    for (const resultado of data?.[0]?.resultados || []) {
      const classificacoes = resultado?.classificacoes;
      const categoriaId = classificacoes?.[0]?.categoria;
      const serie = resultado?.series?.[0]?.serie;
      if (categoriaId && serie?.['2022']) {
        out[Object.keys(categoriaId)[0]] = serie['2022'];
      }
    }
    return out;
  } catch { return {}; }
}

async function main() {
  console.log('🧠 ORÁCULO — Importação IBGE v2 (endpoints corrigidos)');
  console.log('═'.repeat(55));

  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  const resultado = {};

  // ── 1. POPULAÇÃO TOTAL ──────────────────────────────────
  console.log('\n👥 POPULAÇÃO');
  const popTotal = await get(
    `${IBGE}/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${COD}]`,
    'Total'
  );
  resultado.populacaoTotal = val(popTotal);

  // ── 2. SEXO (classificação 2: cat 4=Homens, 5=Mulheres) ─
  const popSexo = await get(
    `${IBGE}/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${COD}]&classificacao=2[4,5]`,
    'Por sexo'
  );
  if (popSexo) {
    // A API retorna resultados separados por categoria
    for (const res of popSexo?.[0]?.resultados || []) {
      const cats = res?.classificacoes?.[0]?.categoria;
      const valor = res?.series?.[0]?.serie?.['2022'];
      if (!cats || !valor) continue;
      const catId = Object.keys(cats)[0];
      if (catId === '4') resultado.homens = valor;
      if (catId === '5') resultado.mulheres = valor;
    }
  }
  console.log(`     Homens: ${resultado.homens || 'N/D'} | Mulheres: ${resultado.mulheres || 'N/D'}`);

  // ── 3. RAÇA/COR (classificação 86) ──────────────────────
  console.log('\n🎨 RAÇA/COR');
  const racaMap = { '2776': 'Branca', '2777': 'Preta', '2778': 'Amarela', '2779': 'Parda', '2780': 'Indígena' };
  const popRaca = await get(
    `${IBGE}/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${COD}]&classificacao=86[2776,2777,2778,2779,2780]`,
    'Por raça/cor'
  );
  resultado.raca = {};
  if (popRaca) {
    for (const res of popRaca?.[0]?.resultados || []) {
      const cats = res?.classificacoes?.[0]?.categoria;
      const valor = res?.series?.[0]?.serie?.['2022'];
      if (!cats || !valor) continue;
      const catId = Object.keys(cats)[0];
      if (racaMap[catId]) {
        resultado.raca[racaMap[catId]] = parseInt(valor);
        console.log(`     ${racaMap[catId]}: ${parseInt(valor).toLocaleString('pt-BR')}`);
      }
    }
  }

  // ── 4. DOMICÍLIOS E SANEAMENTO ───────────────────────────
  console.log('\n🚰 SANEAMENTO (Domicílios)');

  // Domicílios com banheiro e esgoto (agregado 9605, var 390)
  const esgoto = await get(
    `${IBGE}/agregados/9605/periodos/2022/variaveis/390?localidades=N6[${COD}]`,
    'Esgoto/banheiro'
  );
  resultado.domiciliosComEsgoto = val(esgoto);
  console.log(`     Com esgoto: ${resultado.domiciliosComEsgoto || 'N/D'}`);

  // Total de domicílios (para calcular %)
  const totalDomicilios = await get(
    `${IBGE}/agregados/9605/periodos/2022/variaveis/387?localidades=N6[${COD}]`,
    'Total domicílios'
  );
  resultado.totalDomicilios = val(totalDomicilios);
  console.log(`     Total: ${resultado.totalDomicilios || 'N/D'}`);

  if (resultado.domiciliosComEsgoto && resultado.totalDomicilios) {
    resultado.pctEsgoto = ((parseInt(resultado.domiciliosComEsgoto) / parseInt(resultado.totalDomicilios)) * 100).toFixed(1);
    console.log(`     % Cobertura esgoto: ${resultado.pctEsgoto}%`);
  }

  // ── 5. ALFABETIZAÇÃO ────────────────────────────────────
  console.log('\n📚 EDUCAÇÃO');
  const alfab = await get(
    `${IBGE}/agregados/9529/periodos/2022/variaveis/1645?localidades=N6[${COD}]`,
    'Alfabetizados'
  );
  resultado.alfabetizados = val(alfab);
  console.log(`     Alfabetizados: ${resultado.alfabetizados || 'N/D'}`);

  // ── 6. PIB PER CAPITA (Estimativas, não Censo) ──────────
  console.log('\n💰 PIB');
  const pib = await get(
    `${IBGE}/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${COD}]`,
    'PIB per capita 2021'
  );
  resultado.pibPerCapita = val(pib);
  console.log(`     PIB per capita: R$ ${resultado.pibPerCapita || 'N/D'}`);

  // ── 7. RENDA — PNAD Contínua (substitui Censo para renda) 
  console.log('\n💵 RENDA (PNAD Contínua)');
  const renda = await get(
    `${IBGE}/agregados/7101/periodos/2023/variaveis/5929?localidades=N6[${COD}]`,
    'Rendimento médio mensal'
  );
  resultado.rendaMedia = val(renda);
  console.log(`     Rendimento médio: R$ ${resultado.rendaMedia || 'N/D'}`);

  // ── 8. GEOJSON DOS BAIRROS ──────────────────────────────
  console.log('\n🗺️  GEOJSON');
  const geojson = await get(
    `${IBGE}/malhas/municipios/${COD}?formato=application/vnd.geo+json&qualidade=minima`,
    'Malha municipal'
  );
  if (geojson) {
    fs.writeFileSync(
      path.join(__dirname, '../public/uberlandia-municipio.json'),
      JSON.stringify(geojson, null, 2)
    );
    console.log('     ✅ Salvo em public/uberlandia-municipio.json');
  }

  // ── 9. CNES via dados.gov.br ─────────────────────────────
  console.log('\n🏥 ESTABELECIMENTOS DE SAÚDE (CNES)');
  const cnes = await get(
    `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo=317020&limit=100&offset=0`,
    'CNES DataSUS'
  );

  if (cnes?.estabelecimentos?.length) {
    resultado.totalEstabelecimentos = cnes.estabelecimentos.length;
    const tiposRelevantes = { '01':'Hospital','02':'Hospital','04':'UBS','05':'UBS',
      '07':'UAI','15':'UPA','39':'UPA','40':'UPA','69':'UAI','71':'UBS','72':'UBS','73':'UBS' };

    const filtrados = cnes.estabelecimentos.filter(e =>
      tiposRelevantes[e.tp_unidade] ||
      (e.nm_fantasia || '').toLowerCase().includes('uai') ||
      (e.nm_fantasia || '').toLowerCase().includes('ubs') ||
      (e.nm_fantasia || '').toLowerCase().includes('upa')
    ).map(e => ({
      id: `cnes-${e.co_cnes}`,
      nome: e.nm_fantasia || e.no_razao_social,
      tipo: tiposRelevantes[e.tp_unidade] || 'Clínica',
      endereco: `${e.no_logradouro || ''}, ${e.nu_endereco || ''} — ${e.no_bairro || ''}`.trim(),
      lat: parseFloat(e.nu_latitude) || null,
      lng: parseFloat(e.nu_longitude) || null,
    }));

    fs.writeFileSync(
      path.join(__dirname, '../data/cnes_saude.json'),
      JSON.stringify(filtrados, null, 2)
    );
    console.log(`     ✅ ${filtrados.length} unidades salvas em data/cnes_saude.json`);

    // Importar no Prisma
    const bairros = await prisma.neighborhood.findMany({
      select: { id: true, latitude: true, longitude: true }
    });

    for (const est of filtrados) {
      if (!est.lat || !est.lng) continue;
      // Bairro mais próximo
      let melhor = bairros[0];
      let menor = Infinity;
      for (const b of bairros) {
        if (!b.latitude) continue;
        const d = Math.hypot(est.lat - b.latitude, est.lng - b.longitude);
        if (d < menor) { menor = d; melhor = b; }
      }
      await prisma.healthFacility.upsert({
        where: { id: est.id },
        update: { name: est.nome, type: est.tipo },
        create: {
          id: est.id,
          neighborhoodId: melhor.id,
          name: est.nome,
          type: est.tipo,
          address: est.endereco,
          latitude: est.lat,
          longitude: est.lng,
        }
      }).catch(() => {});
    }
    console.log(`     ✅ Importado no banco`);
  } else {
    console.log('     ⚠️  CNES indisponível — tente mais tarde ou acesse manualmente:');
    console.log('     https://cnes.datasus.gov.br');
  }

  // ── 10. SALVAR JSON COMPLETO ────────────────────────────
  const outputPath = path.join(__dirname, '../data/ibge_municipal.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2));

  // ── 11. SALVAR NO BANCO (NeighborhoodMetric) ────────────
  console.log('\n💾 Salvando no banco...');
  const bairros = await prisma.neighborhood.findMany({ select: { id: true } });
  let salvos = 0;

  const metricas = [
    { type: 'POPULACAO_TOTAL',     value: resultado.populacaoTotal },
    { type: 'POPULACAO_HOMENS',    value: resultado.homens },
    { type: 'POPULACAO_MULHERES',  value: resultado.mulheres },
    { type: 'RACA_BRANCA',         value: resultado.raca?.Branca },
    { type: 'RACA_PRETA',          value: resultado.raca?.Preta },
    { type: 'RACA_PARDA',          value: resultado.raca?.Parda },
    { type: 'RACA_AMARELA',        value: resultado.raca?.Amarela },
    { type: 'RACA_INDIGENA',       value: resultado.raca?.Indígena },
    { type: 'PCT_ESGOTO',          value: resultado.pctEsgoto },
    { type: 'PIB_PER_CAPITA',      value: resultado.pibPerCapita },
    { type: 'RENDA_MEDIA',         value: resultado.rendaMedia },
    { type: 'ALFABETIZADOS',       value: resultado.alfabetizados },
    { type: 'TOTAL_DOMICILIOS',    value: resultado.totalDomicilios },
  ].filter(m => m.value != null);

  for (const bairro of bairros) {
    for (const m of metricas) {
      await prisma.neighborhoodMetric.upsert({
        where: { id: `ibge2022-${bairro.id}-${m.type}` },
        update: { value: parseFloat(m.value) },
        create: {
          id: `ibge2022-${bairro.id}-${m.type}`,
          neighborhoodId: bairro.id,
          year: 2022,
          metricType: m.type,
          value: parseFloat(m.value),
          source: 'IBGE_CENSO_2022',
        }
      }).catch(() => {});
      salvos++;
    }
  }
  console.log(`  ✅ ${salvos} métricas salvas`);

  // ── RELATÓRIO ───────────────────────────────────────────
  const pop = parseInt(resultado.populacaoTotal) || 0;
  console.log('\n' + '═'.repeat(55));
  console.log('📊 RESUMO FINAL');
  console.log('═'.repeat(55));
  console.log(`População total:  ${pop.toLocaleString('pt-BR')}`);
  console.log(`Homens:           ${parseInt(resultado.homens || 0).toLocaleString('pt-BR')}`);
  console.log(`Mulheres:         ${parseInt(resultado.mulheres || 0).toLocaleString('pt-BR')}`);
  if (Object.keys(resultado.raca || {}).length) {
    console.log('\nRaça/Cor:');
    for (const [r, v] of Object.entries(resultado.raca || {})) {
      const pct = pop ? ((v / pop) * 100).toFixed(1) : '?';
      console.log(`  ${r.padEnd(10)} ${v.toLocaleString('pt-BR').padStart(9)}  (${pct}%)`);
    }
  }
  if (resultado.pctEsgoto) console.log(`\nSaneamento esgoto: ${resultado.pctEsgoto}%`);
  if (resultado.pibPerCapita) console.log(`PIB per capita:    R$ ${parseInt(resultado.pibPerCapita).toLocaleString('pt-BR')}`);
  console.log('\n✅ Concluído! Dados em data/ibge_municipal.json');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
