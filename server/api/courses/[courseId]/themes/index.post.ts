import { readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/security'
import { intId, str } from '../../../../utils/validate'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const body = await readBody(event)
  const last = await prisma.theme.findFirst({ where: { courseId }, orderBy: { index: 'desc' } })
  return {
    theme: await prisma.theme.create({
      data: {
        courseId,
        title: str(body.title, 'Название', 2, 200),
        description: str(body.description, 'Описание', 1, 5000),
        index: (last?.index || 0) + 1
      }
    })
  }
})
