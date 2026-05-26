<script setup lang="ts">
const route = useRoute()
const requestHeaders = useRequestHeaders(['cookie'])

function parseSlugNumber(value: unknown, prefix: string) {
  const raw = Array.isArray(value) ? value[0] : String(value || '')
  const match = raw.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? Number(match[1]) : 0
}

const courseId = computed(() => parseSlugNumber(route.params.courseSlug, 'course'))
const isNestedRoute = computed(() => Boolean(route.params.themeSlug))

const data = ref<any | null>(null)
const pending = ref(false)
const errorMessage = ref('')

async function loadCourseThemes() {
  if (isNestedRoute.value) return

  if (!courseId.value) {
    data.value = null
    errorMessage.value = 'Некорректный адрес курса.'
    return
  }

  pending.value = true
  errorMessage.value = ''
  data.value = null

  try {
    data.value = await $fetch<any>(`/api/courses/${courseId.value}/themes`, {
      headers: import.meta.server ? requestHeaders : undefined
    })
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      'Не удалось загрузить темы.'
  } finally {
    pending.value = false
  }
}

await loadCourseThemes()

watch(
  () => route.fullPath,
  async () => {
    if (!isNestedRoute.value) {
      await loadCourseThemes()
    }
  }
)

const form = reactive({
  title: '',
  description: ''
})

async function addTheme() {
  await $fetch(`/api/courses/${courseId.value}/themes`, {
    method: 'POST',
    body: form
  })

  form.title = ''
  form.description = ''
  await loadCourseThemes()
}

async function editTheme(themeIndex: number, payload: { title: string; description: string }) {
  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex}`, {
    method: 'PATCH',
    body: payload
  })

  await loadCourseThemes()
}

async function deleteTheme(themeIndex: number) {
  if (!confirm('Удалить тему?')) return

  await $fetch(`/api/courses/${courseId.value}/themes/${themeIndex}`, {
    method: 'DELETE'
  })

  await loadCourseThemes()
}

async function skipTheme(themeIndex: number) {
  await navigateTo(`/courses/course-${courseId.value}/theme-${themeIndex}/skip`)
}
</script>

<template>
  <NuxtPage v-if="isNestedRoute" />

  <section v-else class="stack">
    <NuxtLink to="/courses">← Курсы</NuxtLink>

    <p v-if="pending" class="muted">Загрузка тем...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <template v-else-if="data">
      <div>
        <h1>{{ data.course?.title }}</h1>
        <p class="muted">{{ data.course?.description }}</p>
      </div>

      <form v-if="data.isAdmin" class="card stack" @submit.prevent="addTheme">
        <h2>Добавить тему</h2>
        <input v-model="form.title" placeholder="Название темы">
        <textarea v-model="form.description" placeholder="Описание темы" />
        <button>Добавить</button>
      </form>

      <EntityCard
        v-for="theme in data.themes || []"
        :key="theme.id"
        :entity="theme"
        :editable="data.isAdmin"
        :locked="!theme.available"
        :show-skip="!data.isAdmin"
        :link="`/courses/course-${courseId}/theme-${theme.index}`"
        @skip="skipTheme(theme.index)"
        @edit="editTheme(theme.index, $event)"
        @delete="deleteTheme(theme.index)"
      />
    </template>
  </section>
</template>
