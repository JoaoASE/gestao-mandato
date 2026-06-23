const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const perfilFile = path.join(__dirname, '../Perfil Eleitorado por Local Uberlandia.csv');
const detalhesFile = path.join(__dirname, '../Detalhes Secao Eleitoral Uberlandia.csv');
const outputFile = path.join(__dirname, '../public/bairros_eleitoral_stats.json');

const normalizeString = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

async function process() {
    console.log("1. Lendo Perfil Eleitorado para mapear Zona+Secao -> Bairro...");
    const secaoBairroMap = new Map();
    
    await new Promise((resolve, reject) => {
        fs.createReadStream(perfilFile)
            .pipe(csv())
            .on('data', (row) => {
                if (row.zona && row.secao && row.bairro) {
                    const key = `${row.zona}_${row.secao}`;
                    secaoBairroMap.set(key, normalizeString(row.bairro));
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });
    
    console.log(`Mapeadas ${secaoBairroMap.size} seções para seus bairros.`);

    console.log("2. Lendo Detalhes Secao Eleitoral para agregar dados por Bairro...");
    
    const statsByBairro = {}; // Bairro -> { aptos, comparecimento, abstencoes, votos_nominais, votos_nulos, votos_brancos }
    
    // We will only consider the most recent year available in the data, e.g., 2022 or 2016.
    // To do this, we track data by year as well, or just take everything if it's overall history.
    // But elections happen in different years. The user wants realistic "número de eleitores". 
    // Usually "aptos" is the number of voters. We will sum up the max year's "aptos" for each section.
    
    const secaoLatestYear = {};
    const secaoStats = {};

    await new Promise((resolve, reject) => {
        fs.createReadStream(detalhesFile)
            .pipe(csv())
            .on('data', (row) => {
                const year = parseInt(row.ano);
                const zona = row.zona;
                const secao = row.secao;
                const key = `${zona}_${secao}`;
                
                if (!secaoLatestYear[key] || year > secaoLatestYear[key]) {
                    secaoLatestYear[key] = year;
                    secaoStats[key] = {
                        aptos: parseInt(row.aptos || 0),
                        comparecimento: parseInt(row.comparecimento || 0),
                        abstencoes: parseInt(row.abstencoes || 0),
                        votos_nominais: parseInt(row.votos_nominais || 0),
                        votos_brancos: parseInt(row.votos_brancos || 0),
                        votos_nulos: parseInt(row.votos_nulos || 0)
                    };
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log("Agregando por bairro...");
    for (const [key, stats] of Object.entries(secaoStats)) {
        const bairro = secaoBairroMap.get(key);
        if (bairro) {
            if (!statsByBairro[bairro]) {
                statsByBairro[bairro] = {
                    aptos: 0, comparecimento: 0, abstencoes: 0, votos_nominais: 0, votos_brancos: 0, votos_nulos: 0
                };
            }
            statsByBairro[bairro].aptos += stats.aptos;
            statsByBairro[bairro].comparecimento += stats.comparecimento;
            statsByBairro[bairro].abstencoes += stats.abstencoes;
            statsByBairro[bairro].votos_nominais += stats.votos_nominais;
            statsByBairro[bairro].votos_brancos += stats.votos_brancos;
            statsByBairro[bairro].votos_nulos += stats.votos_nulos;
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(statsByBairro, null, 2));
    console.log(`Dados agregados salvos em ${outputFile}`);
}

process().catch(console.error);
