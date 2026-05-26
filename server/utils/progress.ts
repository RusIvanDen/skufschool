import { prisma } from './prisma'

export async function findThemeByIndex(courseId: number, themeIndex: number) {
  return prisma.theme.findUnique({ where: { courseId_index: { courseId, index: themeIndex } } })
}

export async function findLessonByIndex(themeId: number, lessonIndex: number) {
  return prisma.lesson.findUnique({ where: { themeId_index: { themeId, index: lessonIndex } } })
}

export async function canOpenTheme(userId: number, isAdmin: boolean, courseId: number, themeIndex: number) {
  if (isAdmin) return true
  const theme = await findThemeByIndex(courseId, themeIndex)
  if (!theme) return false
  const prev = await prisma.theme.findFirst({ where: { courseId, index: { lt: theme.index } }, orderBy: { index: 'desc' } })
  if (!prev) return true
  return Boolean(await prisma.themeProgress.findUnique({ where: { userId_themeId: { userId, themeId: prev.id } } }))
}

export async function refreshProgress(userId: number, lessonId: number) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { tasks: { select: { id: true } }, theme: { include: { lessons: { select: { id: true } } } } }
  })
  if (!lesson) return

  const taskIds = lesson.tasks.map(t => t.id)
  if (taskIds.length) {
    const ok = await prisma.taskProgress.count({ where: { userId, taskId: { in: taskIds }, status: 'SUCCESS' } })
    if (ok === taskIds.length) await prisma.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } }, create: { userId, lessonId }, update: {} })
  }

  const lessonIds = lesson.theme.lessons.map(l => l.id)
  const doneLessons = await prisma.lessonProgress.count({ where: { userId, lessonId: { in: lessonIds } } })
  if (lessonIds.length && doneLessons === lessonIds.length) {
    await prisma.themeProgress.upsert({ where: { userId_themeId: { userId, themeId: lesson.themeId } }, create: { userId, themeId: lesson.themeId }, update: {} })
  }
}
