<script setup lang="ts">
const props = defineProps<{
  taskId: number
}>()

const { data, refresh } = await useFetch<any>(() => `/api/tasks/${props.taskId}/comments`, {
  watch: [() => props.taskId]
})

const text = ref('')

async function addComment() {
  if (!text.value.trim()) return

  await $fetch(`/api/tasks/${props.taskId}/comments`, {
    method: 'POST',
    body: { text: text.value }
  })

  text.value = ''
  await refresh()
}
</script>

<template>
  <section class="card stack comments">
    <h3>Комментарии</h3>

    <article v-for="comment in data?.comments || []" :key="comment.id" class="comment">
      <NuxtLink :to="`/user/${comment.user.login}`">
        {{ comment.user.name }}
      </NuxtLink>
      <p>{{ comment.text }}</p>
    </article>

    <form class="row" @submit.prevent="addComment">
      <input v-model="text" placeholder="Ваш комментарий">
      <button>Отправить</button>
    </form>
  </section>
</template>
