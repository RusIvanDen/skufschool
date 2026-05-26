import { createError, readBody } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { requireAdmin } from '../../../../../../utils/security'
import { intId, str } from '../../../../../../utils/validate'
import { findThemeByIndex } from '../../../../../../utils/progress'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')
  const body = await readBody(event)
  const theme = await findThemeByIndex(courseId, themeIndex)
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const last = await prisma.lesson.findFirst({ where: { themeId: theme.id }, orderBy: { index: 'desc' } })
  return {
    lesson: await prisma.lesson.create({
      data: {
        themeId: theme.id,
        title: str(body.title, 'Название', 2, 200),
        description: str(body.description, 'Описание', 1, 5000),
        index: (last?.index || 0) + 1
      }
    })
  }
})
