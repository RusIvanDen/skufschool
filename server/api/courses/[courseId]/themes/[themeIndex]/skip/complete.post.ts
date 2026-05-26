import { createError, readBody } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { requireUser, readSignedToken } from '../../../../../../utils/security'
import { intId } from '../../../../../../utils/validate'
import { findThemeByIndex } from '../../../../../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')
  const body = await readBody(event)
  const theme = await findThemeByIndex(courseId, themeIndex)
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const token = readSignedToken<{ userId: number; courseId: number; themeId: number; themeIndex: number; taskIds: number[]; exp: number }>(String(body.token || ''))
  if (!token || token.userId !== user.id || token.courseId !== courseId || token.themeId !== theme.id || token.themeIndex !== themeIndex || token.exp < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Проверочный урок устарел' })
  }

  const ok = await prisma.taskProgress.count({ where: { userId: user.id, taskId: { in: token.taskIds }, status: 'SUCCESS' } })
  if (ok !== token.taskIds.length) throw createError({ statusCode: 400, statusMessage: 'Не все задания выполнены верно' })

  await prisma.themeProgress.upsert({
    where: { userId_themeId: { userId: user.id, themeId: theme.id } },
    create: { userId: user.id, themeId: theme.id },
    update: {}
  })

  return { ok: true }
})
