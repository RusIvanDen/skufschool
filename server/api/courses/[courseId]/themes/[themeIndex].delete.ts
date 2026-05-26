import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/security'
import { intId } from '../../../../utils/validate'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')

  await prisma.theme.delete({ where: { courseId_index: { courseId, index: themeIndex } } })

  const rest = await prisma.theme.findMany({ where: { courseId }, orderBy: { index: 'asc' }, select: { id: true } })
  for (const [position, theme] of rest.entries()) {
    await prisma.theme.update({ where: { id: theme.id }, data: { index: position + 1 } })
  }

  return { ok: true }
})
