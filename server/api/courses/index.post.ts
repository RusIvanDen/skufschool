import { readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/security'
import { str } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const last = await prisma.course.findFirst({ orderBy: { sortIndex: 'desc' } })
  const course = await prisma.course.create({
    data: {
      title: str(body.title, 'Название', 2, 200),
      description: str(body.description, 'Описание', 1, 5000),
      sortIndex: (last?.sortIndex || 0) + 1
    }
  })
  return { course: { ...course, index: course.sortIndex } }
})
