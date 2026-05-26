import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireUser, safeUser } from '../../utils/security'
import { str } from '../../utils/validate'
export default defineEventHandler(async (event) => {
  const u = await requireUser(event)
  if (u.login !== String(getRouterParam(event,'login'))) throw createError({statusCode:403,statusMessage:'Можно менять только свой профиль'})
  const body = await readBody(event)
  const user = await prisma.user.update({ where:{id:u.id}, data:{ name: str(body.name,'Имя',2,80) } })
  return { user: safeUser(user) }
})
