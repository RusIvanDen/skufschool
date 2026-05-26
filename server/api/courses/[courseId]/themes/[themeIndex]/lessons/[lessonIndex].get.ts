import { createError } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { requireUser } from '../../../../../../utils/security'
import { intId } from '../../../../../../utils/validate'
import { canOpenTheme, findThemeByIndex } from '../../../../../../utils/progress'
import { publicContent } from '../../../../../../utils/task'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const courseId = intId(getRouterParam(event, 'courseId'), 'courseId')
  const themeIndex = intId(getRouterParam(event, 'themeIndex'), 'themeIndex')
  const lessonIndex = intId(getRouterParam(event, 'lessonIndex'), 'lessonIndex')

  if (!(await canOpenTheme(user.id, user.role === 'ADMIN', courseId, themeIndex))) {
    throw createError({ statusCode: 403, statusMessage: 'Эта тема пока закрыта' })
  }

  const theme = await findThemeByIndex(courseId, themeIndex)
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })

  const lesson = await prisma.lesson.findUnique({
    where: { themeId_index: { themeId: theme.id, index: lessonIndex } },
    include: { tasks: { orderBy: { sortIndex: 'asc' } } }
  })
  if (!lesson) throw createError({ statusCode: 404, statusMessage: 'Урок не найден' })

  const progress = await prisma.taskProgress.findMany({ where: { userId: user.id, taskId: { in: lesson.tasks.map(task => task.id) } } })
  const map = new Map(progress.map(progressItem => [progressItem.taskId, progressItem.status]))
  const nextLesson = await prisma.lesson.findFirst({ where: { themeId: theme.id, index: { gt: lesson.index } }, orderBy: { index: 'asc' } })

  return {
    lesson,
    nextLesson,
    isAdmin: user.role === 'ADMIN',
    tasks: lesson.tasks.map(task => ({
      ...task,
      content: user.role === 'ADMIN' ? task.content : publicContent(task.type, task.content),
      status: map.get(task.id) || null
    }))
  }
})
