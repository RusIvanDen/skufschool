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
const data = ref<any | null>(null)
const tasks = ref<any[]>([])

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
const pending = ref(false)
const errorMessage = ref('')

async function loadSkipLesson() {
  if (!courseId.value || !themeIndex.value) {
    data.value = null
    tasks.value = []
    errorMessage.value = 'Некорректный адрес проверочного урока.'
    return
  }

  pending.value = true
  errorMessage.value = ''
  data.value = null
  tasks.value = []

  try {
    data.value = await $fetch<any>(`/api/courses/${courseId.value}/themes/${themeIndex.value}/skip`, {
      headers: import.meta.server ? requestHeaders : undefined
    })
    tasks.value = cloneJson(data.value?.tasks || [])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message || 'Не удалось загрузить проверочный урок.'
  } finally {
    pending.value = false
  }
}

await loadSkipLesson()

watch(
  () => route.fullPath,
  () => loadSkipLesson()
)

async function completeTheme() {
  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex.value}/skip/complete`, {
    method: 'POST',
    body: { token: data.value?.token }
  })

  await navigateTo(`/courses/course-${courseId.value}`)
}
</script>

<template>
  <section class="stack">
    <NuxtLink :to="`/courses/course-${courseId}`">← Темы курса</NuxtLink>

    <p v-if="pending" class="muted">Загрузка проверочного урока...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <template v-else-if="data">
      <div>
        <h1>Проверочный урок: {{ data.theme?.title }}</h1>
        <p class="muted">Виртуальный урок из случайных практических заданий темы. В базе не сохраняется.</p>
      </div>

      <TaskRunner
        :key="route.fullPath"
        :tasks="tasks"
        :virtual-complete="completeTheme"
        :finish-url="`/courses/course-${courseId}`"
        @updated="tasks = $event"
      />
    </template>
  </section>
</template>
