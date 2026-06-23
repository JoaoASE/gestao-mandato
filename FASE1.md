# Fase 1 — Fundação (Autenticação + Dados Reais)

## O que foi feito nesta branch

### 🔐 Autenticação real com Clerk
- `middleware.ts` — protege todas as rotas, redireciona para `/login` sem sessão
- `app/layout.tsx` — envolto com `<ClerkProvider>`
- `app/login/page.tsx` — substituído por `<SignIn />` do Clerk (formulário real)

### 👥 Multi-tenancy
- `prisma/schema.prisma` — campo `clerkUserId` adicionado ao modelo `Candidate`
- `lib/getCurrentCandidate.ts` — helper que extrai o candidato da sessão atual
- `app/api/demandas/route.ts` — usa `getCurrentCandidate()` em vez de `findFirst()`
- `app/api/chat/route.ts` — verifica autenticação antes de chamar o LLM

### 📊 Dados reais (sem Math.random)
- `app/api/bairro/route.ts` — reescrito sem aleatoriedade; dados ausentes retornam `null`
- `prisma/schema.prisma` — campos de Neighborhood agora nullable (dado ausente ≠ zero)
- `scripts/import-leisure.js` — importa praças/parques do CSV para o banco (rodar uma vez)

### 🗄 Schema atualizado
- Modelo `LeisureArea` adicionado
- Campos `plan` e `planExpiresAt` em `Candidate` (preparação para billing)
- `.env.example` documentado

---

## Como configurar depois do merge

### 1. Instalar dependência do Clerk
```bash
pnpm add @clerk/nextjs
```

### 2. Criar conta no Clerk
- Acesse https://clerk.com → crie um app
- Copie as chaves para `.env.local` (veja `.env.example`)

### 3. Rodar a migration do banco
```bash
npx prisma migrate dev --name fase1_clerk_multitenancy
```

### 4. Importar praças e parques para o banco
```bash
node scripts/import-leisure.js
```

### 5. Vincular candidatos existentes ao Clerk
Após criar os usuários no Clerk, atualize o campo `clerkUserId`:
```sql
UPDATE "Candidate" SET "clerkUserId" = 'user_clerk_id_aqui' WHERE id = 'cand-01';
```

---

## Checklist de validação

- [ ] Acesso sem login redireciona para `/login`
- [ ] Dois candidatos diferentes não veem dados um do outro
- [ ] Nenhum `Math.random()` nas APIs (grep: `grep -r "Math.random" app/api/`)
- [ ] Valores nulos aparecem como "—" na UI
- [ ] `node scripts/import-leisure.js` roda sem erro
