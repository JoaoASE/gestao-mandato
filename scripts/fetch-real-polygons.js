const fs = require('fs');
const path = require('path');
const osmtogeojson = require('osmtogeojson');

async function fetchBairros() {
  console.log("Iniciando busca de polígonos na Overpass API...");
  // Overpass QL to fetch suburbs/neighborhoods in Uberlândia
  const query = `
    [out:json][timeout:25];
    area["name"="Uberlândia"]["admin_level"="8"]->.searchArea;
    (
      relation["admin_level"="10"](area.searchArea);
      way["admin_level"="10"](area.searchArea);
      relation["place"="suburb"](area.searchArea);
      way["place"="suburb"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const params = new URLSearchParams();
    params.append('data', query);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GestaoMandatoBot/1.0 (contact@example.com)'
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro na API Overpass: ${response.status} ${response.statusText} - ${text}`);
    }

    const osmData = await response.json();
    console.log(`Recebidos ${osmData.elements.length} elementos do OSM.`);

    // Converter para GeoJSON
    const geojson = osmtogeojson(osmData);

    // Filtrar para ter apenas Polígonos (MultiPolygon ou Polygon) e que tenham nome
    const filteredFeatures = geojson.features.filter(f => 
      f.properties && f.properties.name && 
      (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    ).map(f => {
      // Normalizar nome para uso no sistema
      const nomeOriginal = f.properties.name.toUpperCase();
      const normalizeString = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
      
      return {
        type: "Feature",
        properties: {
          nome: nomeOriginal,
          bairroNormalizado: normalizeString(nomeOriginal)
        },
        geometry: f.geometry
      };
    });

    const finalGeoJson = {
      type: "FeatureCollection",
      features: filteredFeatures
    };

    console.log(`Filtrados ${finalGeoJson.features.length} bairros com polígonos válidos.`);

    const outPath = path.join(__dirname, '..', 'public', 'uberlandia-bairros.json');
    fs.writeFileSync(outPath, JSON.stringify(finalGeoJson, null, 2));
    console.log(`Arquivo salvo com sucesso em: ${outPath}`);

  } catch (error) {
    console.error("Falha ao buscar bairros:", error);
  }
}

fetchBairros();
