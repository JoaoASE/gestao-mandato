/**
 * Cron job de atualização mensal de ocorrências SSP-MG
 * Configurar no Vercel: Settings → Cron Jobs → "0 6 1 * *" (todo dia 1 às 6h)
 * Protegido por CRON_SECRET no header Authorization
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Atualização manual necessária',
    instructions: [
      '1. Acesse https://dados.mg.gov.br/dataset/estatisticas-de-seguranca-publica',
      '2. Baixe o CSV do mês mais recente',
      '3. Substitua crimes-ssp-mg.csv na raiz do projeto',
      '4. Execute: node scripts/import-crimes.js',
    ],
  })
}
