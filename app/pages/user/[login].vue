<script setup lang="ts">
const route = useRoute()
const { user, fetchMe } = useAuth()

await fetchMe()

const login = computed(() => String(route.params.login || ''))

const { data, refresh } = await useFetch<any>(() => `/api/users/${login.value}`, {
  watch: [login]
})

const { data: coursesData, refresh: refreshCourses } = await useFetch<any>(
  () => `/api/users/${login.value}/courses`,
  {
    watch: [login]
  }
)

const profile = computed(() => data.value?.profile || data.value?.user || null)
const courseItems = computed(() => coursesData.value?.courses || [])
const name = ref('')

watchEffect(() => {
  name.value = profile.value?.name || ''
})

const isOwner = computed(() => user.value?.login === profile.value?.login)

function courseUrl(item: any) {
  return item.url || `/courses/course-${item.id}`
}

async function saveName() {
  await $fetch(`/api/users/${login.value}`, {
    method: 'PATCH',
    body: { name: name.value }
  })

  await refresh()
  await refreshCourses()

  if (isOwner.value) {
    await fetchMe(true)
  }
}
</script>

<template>
  <section class="stack">
    <div v-if="profile" class="card stack">
      <h1>{{ profile.name }}</h1>
      <p class="muted">@{{ profile.login }}</p>
    </div>

    <p v-else class="muted">Загрузка профиля...</p>

    <form v-if="isOwner" class="card stack" @submit.prevent="saveName">
      <h2>Изменить имя</h2>
      <input v-model="name">
      <button>Подтвердить изменение</button>
    </form>

    <section v-if="isOwner" class="card stack">
      <h2>Проходимые курсы</h2>

      <p v-if="!courseItems.length" class="muted">
        Курсы пока не найдены.
      </p>

      <ul v-else class="progress-list">
        <li v-for="item in courseItems" :key="item.id">
          <NuxtLink :to="courseUrl(item)">
            {{ item.title || item.course }}
          </NuxtLink>:
          {{ item.completedThemesCount ?? item.user_completed_themes_count }}/{{ item.themesCount ?? item.themes_count }}
        </li>
      </ul>
    </section>
  </section>
</template>
