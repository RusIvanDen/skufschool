import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/security'
import { intId } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = intId(getRouterParam(event, 'courseId'), 'courseId')
  await prisma.course.delete({ where: { id } })

  const rest = await prisma.course.findMany({ orderBy: { sortIndex: 'asc' }, select: { id: true } })
  for (const [position, course] of rest.entries()) {
    await prisma.course.update({ where: { id: course.id }, data: { sortIndex: position + 1 } })
  }

  return { ok: true }
})
