import { createError } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { requireUser, signedToken } from '../../../../../utils/security'
import { intId } from '../../../../../utils/validate'
import { canOpenTheme, findThemeByIndex } from '../../../../../utils/progress'
import { publicContent } from '../../../../../utils/task'

const sample = <T>(items: T[], count: number) => [...items].sort(() => Math.random() - 0.5).slice(0, count)

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
    include: { lessons: { orderBy: { index: 'asc' }, include: { tasks: { orderBy: { sortIndex: 'asc' } } } } }
  })
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const picked = theme.lessons.flatMap(lesson => sample(lesson.tasks.filter(task => task.type !== 'LECTURE'), 2))
  if (!picked.length) throw createError({ statusCode: 400, statusMessage: 'В теме нет практических заданий' })

  const taskIds = picked.map(task => task.id)
  const token = signedToken({ userId: user.id, courseId, themeId: theme.id, themeIndex, taskIds, exp: Date.now() + 3600_000 })
  const progress = await prisma.taskProgress.findMany({ where: { userId: user.id, taskId: { in: taskIds } } })
  const map = new Map(progress.map(progressItem => [progressItem.taskId, progressItem.status]))

  return {
    theme,
    token,
    tasks: picked.map(task => ({ ...task, content: publicContent(task.type, task.content), status: map.get(task.id) || null }))
  }
})
