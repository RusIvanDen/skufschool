<script setup lang="ts">
const props = defineProps<{
  entity: any
  editable?: boolean
  locked?: boolean
  link?: string
  showSkip?: boolean
}>()

const emit = defineEmits<{
  edit: [payload: { title: string; description: string }]
  delete: []
  skip: []
}>()

const editing = ref(false)
const title = ref(props.entity.title)
const description = ref(props.entity.description)

watch(
  () => props.entity,
  entity => {
    title.value = entity.title
    description.value = entity.description
  },
  { deep: true }
)

function submitEdit() {
  emit('edit', {
    title: title.value,
    description: description.value
  })

  editing.value = false
}
</script>

<template>
  <article class="card entity" :class="{ locked }">
    <div class="row between">
      <NuxtLink v-if="link && !locked" class="entity-title" :to="link">
        {{ entity.title }}
      </NuxtLink>

      <span v-else class="entity-title">
        {{ entity.title }}
      </span>

      <span v-if="entity.completed" class="pill ok">пройдено</span>
      <span v-if="locked" class="pill">закрыто</span>
    </div>

    <p>{{ entity.description }}</p>

    <button v-if="showSkip && !locked" class="secondary" @click="emit('skip')">
      Пропустить
    </button>

    <div v-if="editable" class="row">
      <button class="secondary" @click="editing = !editing">
        {{ editing ? 'Скрыть' : 'Редактировать' }}
      </button>
      <button class="danger" @click="emit('delete')">Удалить</button>
    </div>

    <form v-if="editable && editing" class="stack" @submit.prevent="submitEdit">
      <input v-model="title">
      <textarea v-model="description" />
      <button>Подтвердить изменение</button>
    </form>
  </article>
</template>
