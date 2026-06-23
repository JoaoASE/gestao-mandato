import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function getCurrentCandidate() {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const candidate = await prisma.candidate.findUnique({
    where: { clerkUserId: userId },
  })

  if (!candidate) throw new Error('Candidato não encontrado para este usuário')
  return candidate
}
