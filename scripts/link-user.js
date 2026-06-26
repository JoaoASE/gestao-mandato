const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const clerkUserId = 'user_3FgATfNRYXVr9MMvb0Kq953uW6X'
  const email = 'jvomacedo.udi@gmail.com'

  // Verificar candidatos existentes
  const candidates = await sql`SELECT id, name, "clerkUserId" FROM "Candidate"`
  console.log('Candidatos no banco:', candidates)

  if (candidates.length === 0) {
    // Criar candidato novo
    const city = await sql`SELECT id FROM "City" LIMIT 1`
    await sql`
      INSERT INTO "Candidate" (id, "clerkUserId", name, "cityId", slug, plan)
      VALUES ('cand-jvo', ${clerkUserId}, 'João Vitor', ${city[0].id}, 'joao-vitor', 'campanha')
      ON CONFLICT (id) DO UPDATE SET "clerkUserId" = ${clerkUserId}
    `
    console.log('✅ Candidato criado e vinculado')
  } else {
    // Vincular ao primeiro candidato
    await sql`
      UPDATE "Candidate" SET "clerkUserId" = ${clerkUserId}
      WHERE id = ${candidates[0].id}
    `
    console.log(`✅ ${candidates[0].name} vinculado ao usuário ${email}`)
  }

  const result = await sql`SELECT id, name, "clerkUserId", plan FROM "Candidate"`
  console.log('Estado atual:', result)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
