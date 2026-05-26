<script setup lang="ts">
const { data, refresh } = await useFetch<any>('/api/courses')

const form = reactive({
  title: '',
  description: ''
})

async function addCourse() {
  await $fetch('/api/courses', {
    method: 'POST',
    body: form
  })

  form.title = ''
  form.description = ''
  await refresh()
}

async function editCourse(id: number, payload: { title: string; description: string }) {
  await $fetch(`/api/courses/${id}`, {
    method: 'PATCH',
    body: payload
  })

  await refresh()
}

async function deleteCourse(id: number) {
  if (!confirm('Удалить курс?')) return

  await $fetch(`/api/courses/${id}`, {
    method: 'DELETE'
  })

  await refresh()
}
</script>

<template>
  <section class="stack">
    <div>
      <h1>Курсы</h1>
      <p class="muted">Все курсы выводятся строго по индексу.</p>
    </div>

    <form v-if="data?.isAdmin" class="card stack" @submit.prevent="addCourse">
      <h2>Добавить курс</h2>
      <input v-model="form.title" placeholder="Название">
      <textarea v-model="form.description" placeholder="Описание" />
      <button>Добавить</button>
    </form>

    <EntityCard
      v-for="course in data?.courses || []"
      :key="course.id"
      :entity="course"
      :editable="data?.isAdmin"
      :link="`/courses/course-${course.id}`"
      @edit="editCourse(course.id, $event)"
      @delete="deleteCourse(course.id)"
    />
  </section>
</template>
