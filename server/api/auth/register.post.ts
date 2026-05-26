import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { createSession, hashPassword, safeUser } from '../../utils/security'
import { email, login, str } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = str(body.name, 'Имя', 2, 80)
  const userLogin = login(str(body.login, 'Логин', 3, 32))
  const userEmail = email(str(body.email, 'Почта', 5, 200))
  const password = str(body.password, 'Пароль', 8, 200)
  if (password !== str(body.repeatPassword, 'Повтор пароля', 8, 200)) throw createError({ statusCode: 400, statusMessage: 'Пароли не совпадают' })
  if (await prisma.user.findFirst({ where: { OR: [{ login: userLogin }, { email: userEmail }] } })) throw createError({ statusCode: 409, statusMessage: 'Такой логин или почта уже заняты' })
  const user = await prisma.user.create({ data: { name, login: userLogin, email: userEmail, passwordHash: await hashPassword(password) } })
  await createSession(event, user.id)
  return { user: safeUser(user) }
})
