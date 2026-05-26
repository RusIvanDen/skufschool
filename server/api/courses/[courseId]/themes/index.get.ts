import { createError } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { currentUser } from '../../../../utils/security'
import { intId } from '../../../../utils/validate'

export default defineEventHandler(async (event) => {
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const user = await currentUser(event)
  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { themes: { orderBy: { index: 'asc' } } } })
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Курс не найден' })

  const completed = user
    ? new Set((await prisma.themeProgress.findMany({ where: { userId: user.id }, select: { themeId: true } })).map(x => x.themeId))
    : new Set<number>()

  const themes = course.themes.map((theme, position, all) => ({
    ...theme,
    completed: completed.has(theme.id),
    available: user?.role === 'ADMIN' || position === 0 || completed.has(all[position - 1]?.id)
  }))

  return { course, themes, isAdmin: user?.role === 'ADMIN' }
})
