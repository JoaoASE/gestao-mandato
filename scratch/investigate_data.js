const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const DIR = path.join(__dirname, '..');

async function analyze() {
  console.log("--- Candidatos Uberlandia.csv ---");
  const yearsCandidatos = new Set();
  await new Promise(resolve => {
    fs.createReadStream(path.join(DIR, 'Candidatos Uberlandia.csv'))
      .pipe(csv())
      .on('data', row => yearsCandidatos.add(row.ano))
      .on('end', resolve);
  });
  console.log("Anos em Candidatos:", Array.from(yearsCandidatos));

  console.log("--- Resultado Candidato por Secao Uberlandia.csv ---");
  const yearsResultados = new Set();
  await new Promise(resolve => {
    fs.createReadStream(path.join(DIR, 'Resultado Candidato por Secao Uberlandia.csv'))
      .pipe(csv())
      .on('data', row => yearsResultados.add(row.ano))
      .on('end', resolve);
  });
  console.log("Anos em Resultados:", Array.from(yearsResultados));

  console.log("--- Perfil Eleitorado ---");
  let totalEleitores = 0;
  const bairros = new Set();
  await new Promise(resolve => {
    fs.createReadStream(path.join(DIR, 'Perfil Eleitorado por Local Uberlandia.csv'))
      .pipe(csv())
      .on('data', row => {
        bairros.add(row.bairro);
        totalEleitores += parseInt(row.eleitores_secao || 0);
      })
      .on('end', resolve);
  });
  console.log("Total Bairros:", bairros.size);
  console.log("Total Eleitores Bruto:", totalEleitores);
}

analyze();
