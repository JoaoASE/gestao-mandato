const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  // 1. Caminho ajustado para o seu novo nome de arquivo
  const filePath = './data/censo2022.json';
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Erro: O arquivo ${filePath} não foi encontrado na pasta data!`);
    return;
  }

  const rawData = fs.readFileSync(filePath);
  const data = JSON.parse(rawData);

  console.log(`🚀 A iniciar importação de ${data.length} registros para o Neon...`);

  // 2. Mapeamento dos dados do BigQuery para o seu Banco de Dados
  const registros = data.map(item => ({
    municipioId: '3170206', // Uberlândia
    categoria: 'Alfabetização',
    subcategoria: item.alfabetizacao,
    grupoIdade: item.grupo_idade,
    total: parseInt(item.total_pessoas) || 0 // Garante que é um número
  }));

  // 3. Inserção em massa (Mais rápido para bases grandes)
  await prisma.dadosDemograficos.createMany({
    data: registros,
    skipDuplicates: true // Evita erro se você rodar o script duas vezes
  });

  console.log('✅ Dados demográficos importados com sucesso!');
}

main()
  .catch(e => {
    console.error('❌ Erro na importação:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });