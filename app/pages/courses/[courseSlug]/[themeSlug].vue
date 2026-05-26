<script setup lang="ts">
const route = useRoute()
const requestHeaders = useRequestHeaders(['cookie'])

function parseSlugNumber(value: unknown, prefix: string) {
  const raw = Array.isArray(value) ? value[0] : String(value || '')
  const match = raw.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? Number(match[1]) : 0
}

const courseId = computed(() => parseSlugNumber(route.params.courseSlug, 'course'))
const themeIndex = computed(() => parseSlugNumber(route.params.themeSlug, 'theme'))
const isNestedRoute = computed(() => Boolean(route.params.lessonSlug) || route.path.endsWith('/skip'))

const data = ref<any | null>(null)
const pending = ref(false)
const errorMessage = ref('')

async function loadThemeLessons() {
  if (isNestedRoute.value) return

  if (!courseId.value || !themeIndex.value) {
    data.value = null
    errorMessage.value = 'Некорректный адрес темы.'
    return
  }

  pending.value = true
  errorMessage.value = ''
  data.value = null

  try {
    data.value = await $fetch<any>(`/api/courses/${courseId.value}/themes/${themeIndex.value}/lessons`, {
      headers: import.meta.server ? requestHeaders : undefined
    })
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      'Не удалось загрузить уроки.'
  } finally {
    pending.value = false
  }
}

await loadThemeLessons()

watch(
  () => route.fullPath,
  async () => {
    if (!isNestedRoute.value) {
      await loadThemeLessons()
    }
  }
)

const form = reactive({
  title: '',
  description: ''
})

async function addLesson() {
  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex.value}/lessons`, {
    method: 'POST',
    body: form
  })

  form.title = ''
  form.description = ''
  await loadThemeLessons()
}

async function editLesson(lessonIndex: number, payload: { title: string; description: string }) {
  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex.value}/lessons/${lessonIndex}`, {
    method: 'PATCH',
    body: payload
  })

  await loadThemeLessons()
}

async function deleteLesson(lessonIndex: number) {
  if (!confirm('Удалить урок?')) return

  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex.value}/lessons/${lessonIndex}`, {
    method: 'DELETE'
  })

  await loadThemeLessons()
}
</script>

<template>
  <NuxtPage v-if="isNestedRoute" />

  <section v-else class="stack">
    <NuxtLink :to="`/courses/course-${courseId}`">← Темы курса</NuxtLink>

    <p v-if="pending" class="muted">Загрузка уроков...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <template v-else-if="data">
      <div>
        <h1>{{ data.theme?.title }}</h1>
        <p class="muted">{{ data.theme?.description }}</p>
      </div>

      <form v-if="data.isAdmin" class="card stack" @submit.prevent="addLesson">
        <h2>Добавить урок</h2>
        <input v-model="form.title" placeholder="Название урока">
        <textarea v-model="form.description" placeholder="Описание урока" />
        <button>Добавить</button>
      </form>

      <EntityCard
        v-for="lesson in data.lessons || []"
        :key="lesson.id"
        :entity="lesson"
        :editable="data.isAdmin"
        :link="`/courses/course-${courseId}/theme-${themeIndex}/lesson-${lesson.index}`"
        @edit="editLesson(lesson.index, $event)"
        @delete="deleteLesson(lesson.index)"
      />
    </template>
  </section>
</template>
