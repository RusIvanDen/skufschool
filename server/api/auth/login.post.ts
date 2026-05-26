import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { createSession, safeUser, verifyPassword } from '../../utils/security'
import { email, str } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user = await prisma.user.findUnique({ where: { email: email(str(body.email, 'Почта', 5, 200)) } })
  if (!user || !user.passwordHash || !(await verifyPassword(str(body.password, 'Пароль', 1, 200), user.passwordHash))) throw createError({ statusCode: 401, statusMessage: 'Неверная почта или пароль' })
  await createSession(event, user.id)
  return { user: safeUser(user) }
})
