import { createError } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { requireAdmin } from '../../../../../../utils/security'
import { intId } from '../../../../../../utils/validate'
import { findThemeByIndex } from '../../../../../../utils/progress'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')
  const lessonIndex = intId(getRouterParam(event, 'lessonIndex'), 'lessonIndex')
  const theme = await findThemeByIndex(courseId, themeIndex)
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  await prisma.lesson.delete({ where: { themeId_index: { themeId: theme.id, index: lessonIndex } } })

  const rest = await prisma.lesson.findMany({ where: { themeId: theme.id }, orderBy: { index: 'asc' }, select: { id: true } })
  for (const [position, lesson] of rest.entries()) {
    await prisma.lesson.update({ where: { id: lesson.id }, data: { index: position + 1 } })
  }

  return { ok: true }
})
