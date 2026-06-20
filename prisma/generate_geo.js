const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const turf = require('@turf/turf');

const DATA_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'uberlandia-bairros.json');

// Helper para normalizar strings
function normalizeString(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function processCSV(filename, callback) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(DATA_DIR, filename))
      .pipe(csv())
      .on('data', callback)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function main() {
  console.log('🗺️ Extraindo coordenadas das escolas/seções por bairro...');
  const bairroPoints = {};

  await processCSV('Perfil Eleitorado por Local Uberlandia.csv', (data) => {
    // Pode ser qualquer ano, queremos as coordenadas da escola, elas não mudam muito
    const bairroRaw = data.bairro;
    const lat = parseFloat(data.latitude?.replace(',', '.'));
    const lng = parseFloat(data.longitude?.replace(',', '.'));

    if (!bairroRaw || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const bairroNormalizado = normalizeString(bairroRaw);
    if (!bairroPoints[bairroNormalizado]) {
      bairroPoints[bairroNormalizado] = {
        nomeOriginal: bairroRaw,
        points: []
      };
    }
    bairroPoints[bairroNormalizado].points.push([lng, lat]); // GeoJSON é Lng, Lat
  });

  const features = [];

  for (const [bairroNorm, data] of Object.entries(bairroPoints)) {
    // Remove duplicatas exatas para a mesma escola
    const uniquePoints = Array.from(new Set(data.points.map(JSON.stringify))).map(JSON.parse);
    const pointsCollection = turf.featureCollection(uniquePoints.map(p => turf.point(p)));

    let baseGeom;
    if (uniquePoints.length >= 3) {
      // Cria a envoltória convexa
      const hull = turf.convex(pointsCollection);
      if (hull) baseGeom = hull;
    } else if (uniquePoints.length === 2) {
      // Para duas escolas, cria uma linha e expande
      baseGeom = turf.lineString(uniquePoints);
    } else if (uniquePoints.length === 1) {
      // Para uma escola, pega o ponto e expande
      baseGeom = turf.point(uniquePoints[0]);
    }

    if (baseGeom) {
      // Expande o polígono/linha/ponto em um buffer de 0.6 km (600 metros)
      // para abranger os quarteirões vizinhos ao local de votação
      const buffered = turf.buffer(baseGeom, 0.6, { units: 'kilometers', steps: 16 });
      
      buffered.properties = {
        nome: data.nomeOriginal,
        bairroNormalizado: bairroNorm
      };
      
      features.push(buffered);
    }
  }

  const geojson = turf.featureCollection(features);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
  console.log(`✅ ${features.length} Bairros mapeados de forma orgânica salvos em ${OUTPUT_FILE}`);
}

main().catch(console.error);
