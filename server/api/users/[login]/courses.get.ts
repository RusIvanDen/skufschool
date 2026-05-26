import { createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const login = String(getRouterParam(event, 'login'))
  const user = await prisma.user.findUnique({ where: { login } })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  const courses = await prisma.course.findMany({
    orderBy: { sortIndex: 'asc' },
    include: {
      themes: {
        orderBy: { index: 'asc' },
        select: {
          id: true,
          index: true
        }
      }
    }
  })

  const completedThemeIds = new Set(
    (
      await prisma.themeProgress.findMany({
        where: { userId: user.id },
        select: { themeId: true }
      })
    ).map(theme => theme.themeId)
  )

  return {
    courses: courses.map(course => {
      const completedThemesCount = course.themes.filter(theme => completedThemeIds.has(theme.id)).length
      const themesCount = course.themes.length

      return {
        id: course.id,
        title: course.title,
        course: course.title,
        url: `/courses/course-${course.id}`,
        completedThemesCount,
        themesCount,
        user_completed_themes_count: completedThemesCount,
        themes_count: themesCount
      }
    })
  }
})
