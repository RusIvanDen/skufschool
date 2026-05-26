import { prisma } from '../../utils/prisma'
import { currentUser } from '../../utils/security'

export default defineEventHandler(async (event) => {
  const user = await currentUser(event)
  const courses = await prisma.course.findMany({ orderBy: { sortIndex: 'asc' } })
  return {
    courses: courses.map(course => ({ ...course, index: course.sortIndex })),
    isAdmin: user?.role === 'ADMIN'
  }
})
