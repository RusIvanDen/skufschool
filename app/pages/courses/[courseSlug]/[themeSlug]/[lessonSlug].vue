<script setup lang="ts">
definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const requestHeaders = useRequestHeaders(['cookie'])

function parseSlugNumber(value: unknown, prefix: string) {
  const raw = Array.isArray(value) ? value[0] : String(value || '')
  const match = raw.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? Number(match[1]) : 0
}

const courseId = computed(() => parseSlugNumber(route.params.courseSlug, 'course'))
const themeIndex = computed(() => parseSlugNumber(route.params.themeSlug, 'theme'))
const lessonIndex = computed(() => parseSlugNumber(route.params.lessonSlug, 'lesson'))
const data = ref<any | null>(null)
const tasks = ref<any[]>([])

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
const pending = ref(false)
const errorMessage = ref('')
const newTaskType = ref('LECTURE')

async function loadLesson() {
  if (!courseId.value || !themeIndex.value || !lessonIndex.value) {
    data.value = null
    tasks.value = []
    errorMessage.value = 'Некорректный адрес урока.'
    return
  }

  pending.value = true
  errorMessage.value = ''
  data.value = null
  tasks.value = []

  try {
    const endpoint = `/api/courses/${courseId.value}/themes/${themeIndex.value}/lessons/${lessonIndex.value}`

    data.value = await $fetch<any>(endpoint, {
      headers: import.meta.server ? requestHeaders : undefined
    })
    tasks.value = cloneJson(data.value?.tasks || [])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message || 'Не удалось загрузить урок.'
  } finally {
    pending.value = false
  }
}

await loadLesson()

watch(
  () => route.fullPath,
  () => loadLesson()
)

const nextUrl = computed(() => {
  if (!data.value?.nextLesson) return null
  return `/courses/course-${courseId.value}/theme-${themeIndex.value}/lesson-${data.value.nextLesson.index}`
})

const finishUrl = computed(() => `/courses/course-${courseId.value}`)

async function addTask() {
  const lessonId = data.value?.lesson?.id
  if (!lessonId) return

  const response = await $fetch<any>(`/api/lessons/${lessonId}/tasks`, {
    method: 'POST',
    body: { type: newTaskType.value }
  })

  tasks.value.push({ ...response.task, status: null })
  await loadLesson()
}
</script>

<template>
  <section class="stack">
    <NuxtLink :to="`/courses/course-${courseId}/theme-${themeIndex}`">← Уроки темы</NuxtLink>

    <p v-if="pending" class="muted">Загрузка урока...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <template v-else-if="data">
      <div>
        <h1>{{ data.lesson?.title }}</h1>
        <p class="muted">{{ data.lesson?.description }}</p>
      </div>

      <form v-if="data.isAdmin" class="card row" @submit.prevent="addTask">
        <select v-model="newTaskType">
          <option value="LECTURE">Лекция</option>
          <option value="QUESTION">Вопрос</option>
          <option value="SINGLE_CHOICE">Тест с 1 ответом</option>
          <option value="MULTI_CHOICE">Тест с множеством ответов</option>
          <option value="CODE">Код</option>
          <option value="MARKUP">Вёрстка</option>
        </select>
        <button>Добавить новое задание</button>
      </form>

      <TaskRunner
        :key="route.fullPath"
        :tasks="tasks"
        :is-admin="data.isAdmin"
        :next-url="nextUrl"
        :finish-url="finishUrl"
        @updated="tasks = $event"
      />
    </template>
  </section>
</template>
