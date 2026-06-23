const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const file = path.join(__dirname, '../Populacao Uberlandia 2022.csv');
const outFile = path.join(__dirname, '../public/uberlandia_demographics.json');

let total = 0;
const raca = {};
const sexo = {};

fs.createReadStream(file)
  .pipe(csv())
  .on('data', (row) => {
    const pop = parseInt(row.populacao);
    if (!isNaN(pop)) {
        total += pop;
        const r = row.cor_raca;
        const s = row.sexo;
        if (r) raca[r] = (raca[r] || 0) + pop;
        if (s) sexo[s] = (sexo[s] || 0) + pop;
    }
  })
  .on('end', () => {
     const stats = {
         total,
         raca_percent: {},
         sexo_percent: {}
     };
     for (const r in raca) {
         stats.raca_percent[r] = raca[r] / total;
     }
     for (const s in sexo) {
         stats.sexo_percent[s] = sexo[s] / total;
     }
     fs.writeFileSync(outFile, JSON.stringify(stats, null, 2));
     console.log('Demographics saved to', outFile);
     console.log(stats);
  });
