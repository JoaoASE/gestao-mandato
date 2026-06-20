const fs = require('fs');
const https = require('https');

const query = `[out:json];
area["name"="Uberlândia"]->.searchArea;
(
  relation["admin_level"="9"](area.searchArea);
  way["admin_level"="9"](area.searchArea);
  relation["admin_level"="10"](area.searchArea);
  way["admin_level"="10"](area.searchArea);
);
out body;
>;
out skel qt;`;

const options = {
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Got elements:', parsed.elements ? parsed.elements.length : 'none');
      const names = parsed.elements.filter(e => e.tags && e.tags.name).map(e => e.tags.name).slice(0, 10);
      console.log('Names:', names);
      fs.writeFileSync('osm_data.json', data);
    } catch(e) { console.error('Error parsing JSON', data.substring(0, 100)); }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write('data=' + encodeURIComponent(query));
req.end();
