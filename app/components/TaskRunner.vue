<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  tasks: any[]
  isAdmin?: boolean
  nextUrl?: string | null
  finishUrl?: string | null
  virtualComplete?: null | (() => Promise<void>)
}>()

const emit = defineEmits<{
  updated: [tasks: any[]]
}>()

const activeIndex = ref(0)
const answerText = ref('')
const singleChoice = ref('')
const multiChoice = ref<string[]>([])
const editorOpened = ref(false)

const activeTask = computed(() => props.tasks[activeIndex.value])
const allTasksCompleted = computed(() => props.tasks.length > 0 && props.tasks.every(task => task.status === 'SUCCESS'))

const taskTypeLabels: Record<string, string> = {
  LECTURE: 'Лекция',
  QUESTION: 'Вопрос',
  SINGLE_CHOICE: '1 ответ',
  MULTI_CHOICE: 'Много',
  CODE: 'Код',
  MARKUP: 'Вёрстка'
}

watch(
  () => route.fullPath,
  () => {
    activeIndex.value = 0
    clearAnswerForm()
    editorOpened.value = false
  }
)

function clearAnswerForm() {
  answerText.value = ''
  singleChoice.value = ''
  multiChoice.value = []
}

function taskLabel(task: any, index: number) {
  const fallback = taskTypeLabels[task.type] || task.type
  return `${index + 1}. ${task.title || fallback}`
}

function setTaskStatus(taskId: number, ok: boolean) {
  const updatedTasks = props.tasks.map(task => {
    if (task.id !== taskId) return task
    return { ...task, status: ok ? 'SUCCESS' : 'FAILED' }
  })

  emit('updated', updatedTasks)

  if (ok && activeIndex.value < props.tasks.length - 1) {
    activeIndex.value += 1
  }
}

async function answerCurrentTask() {
  if (!activeTask.value) return

  let answer: any = {}

  if (activeTask.value.type === 'LECTURE') {
    answer = { read: true }
  }

  if (activeTask.value.type === 'QUESTION') {
    answer = { text: answerText.value }
  }

  if (activeTask.value.type === 'SINGLE_CHOICE') {
    answer = { optionId: singleChoice.value }
  }

  if (activeTask.value.type === 'MULTI_CHOICE') {
    answer = { optionIds: multiChoice.value }
  }

  const response = await $fetch<any>(`/api/tasks/${activeTask.value.id}/answer`, {
    method: 'POST',
    body: {
      mode: 'answer',
      answer
    }
  })

  if (!response.correct) {
    alert(response.message || 'Ответ неверный')
  }

  setTaskStatus(activeTask.value.id, Boolean(response.correct))
  clearAnswerForm()
}

function saveEditedTask(task: any) {
  const updatedTasks = props.tasks.map(item => {
    if (item.id !== task.id) return item
    return { ...item, ...task }
  })

  emit('updated', updatedTasks)
  editorOpened.value = false
}

function deleteCurrentTask() {
  if (!activeTask.value) return

  const taskId = activeTask.value.id
  const updatedTasks = props.tasks.filter(task => task.id !== taskId)

  emit('updated', updatedTasks)
  activeIndex.value = Math.max(0, activeIndex.value - 1)
  editorOpened.value = false
}
</script>

<template>
  <section v-if="activeTask" class="stack">
    <div class="tasknav">
      <button
        v-for="(task, index) in tasks"
        :key="task.id"
        class="round"
        :class="{
          active: index === activeIndex,
          success: task.status === 'SUCCESS',
          failed: task.status === 'FAILED'
        }"
        @click="activeIndex = index"
      >
        {{ taskLabel(task, index) }}
      </button>
    </div>

    <article class="card stack">
      <div v-if="activeTask.type === 'LECTURE'" class="stack">
        <h2>{{ activeTask.content.title }}</h2>
        <p>{{ activeTask.content.text }}</p>
        <button @click="answerCurrentTask">Прочитал</button>
      </div>

      <div v-else-if="activeTask.type === 'QUESTION'" class="stack">
        <h2>{{ activeTask.content.title }}</h2>
        <p>{{ activeTask.content.text }}</p>
        <input v-model="answerText" @keyup.enter="answerCurrentTask">
        <button @click="answerCurrentTask">Ответить</button>
      </div>

      <div v-else-if="activeTask.type === 'SINGLE_CHOICE'" class="stack">
        <h2>{{ activeTask.content.title }}</h2>
        <p>{{ activeTask.content.text }}</p>

        <label v-for="option in activeTask.content.options" :key="option.id">
          <input v-model="singleChoice" type="radio" :value="option.id">
          {{ option.text }}
        </label>

        <button @click="answerCurrentTask">Ответить</button>
      </div>

      <div v-else-if="activeTask.type === 'MULTI_CHOICE'" class="stack">
        <h2>{{ activeTask.content.title }}</h2>
        <p>{{ activeTask.content.text }}</p>

        <label v-for="option in activeTask.content.options" :key="option.id">
          <input v-model="multiChoice" type="checkbox" :value="option.id">
          {{ option.text }}
        </label>

        <button @click="answerCurrentTask">Ответить</button>
      </div>

      <CodeTask
        v-else-if="activeTask.type === 'CODE'"
        :task-id="activeTask.id"
        :content="activeTask.content"
        @answered="setTaskStatus(activeTask.id, $event)"
      />

      <MarkupTask
        v-else
        :task-id="activeTask.id"
        :content="activeTask.content"
        @answered="setTaskStatus(activeTask.id, $event)"
      />

      <div v-if="isAdmin" class="row">
        <button class="secondary" @click="editorOpened = !editorOpened">
          {{ editorOpened ? 'Скрыть редактор' : 'Изменить' }}
        </button>
      </div>

      <AdminTaskEditor
        v-if="isAdmin && editorOpened"
        :task="activeTask"
        @saved="saveEditedTask"
        @deleted="deleteCurrentTask"
      />
    </article>

    <div v-if="allTasksCompleted" class="card row between">
      <b>Все задания выполнены успешно.</b>

      <button v-if="virtualComplete" @click="virtualComplete && virtualComplete()">
        Засчитать тему
      </button>

      <NuxtLink v-else-if="nextUrl" class="button" :to="nextUrl">
        Следующий урок
      </NuxtLink>

      <NuxtLink v-else-if="finishUrl" class="button" :to="finishUrl">
        К темам
      </NuxtLink>
    </div>

    <CommentsBlock :task-id="activeTask.id" />
  </section>

  <section v-else class="card">
    В этом уроке пока нет заданий.
  </section>
</template>
