import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'
import { currentUser } from '../../utils/security'

export default defineEventHandler(async (event) => {
  const viewer = await currentUser(event)
  const login = String(getRouterParam(event, 'login'))

  const profile = await prisma.user.findUnique({
    where: { login },
    select: {
      id: true,
      name: true,
      login: true,
      role: true,
      createdAt: true
    }
  })

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  return {
    profile,
    user: profile,
    isOwner: viewer?.login === profile.login
  }
})
