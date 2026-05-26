import { createError } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { requireUser } from '../../../../../../utils/security'
import { intId } from '../../../../../../utils/validate'
import { canOpenTheme, findThemeByIndex } from '../../../../../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')

  if (!(await canOpenTheme(user.id, user.role === 'ADMIN', courseId, themeIndex))) {
    throw createError({ statusCode: 403, statusMessage: 'Эта тема пока закрыта' })
  }

  const themeBase = await findThemeByIndex(courseId, themeIndex)
  if (!themeBase) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const theme = await prisma.theme.findUnique({
    where: { id: themeBase.id },
    include: { lessons: { orderBy: { index: 'asc' } } }
  })
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const done = new Set((await prisma.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } })).map(x => x.lessonId))
  return { theme, lessons: theme.lessons.map(lesson => ({ ...lesson, completed: done.has(lesson.id) })), isAdmin: user.role === 'ADMIN' }
})
