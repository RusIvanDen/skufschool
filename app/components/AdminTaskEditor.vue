<script setup lang="ts">
const props = defineProps<{ task: any }>()
const emit = defineEmits<{ saved: [task: any]; deleted: [] }>()

const type = ref(props.task.type)
const title = ref(props.task.title)

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

const content = ref<any>(cloneJson(props.task.content || {}))
const jsonError = ref('')

watch(() => props.task, (task) => {
  type.value = task.type
  title.value = task.title
  content.value = cloneJson(task.content || {})
}, { deep: true })

const answersText = computed({
  get: () => (content.value.answers || []).join('\n'),
  set: (value: string) => { content.value.answers = value.split('\n').map(x => x.trim()).filter(Boolean) }
})
const testsJson = computed({
  get: () => JSON.stringify(content.value.tests || [], null, 2),
  set: (value: string) => setJson('tests', value)
})
const checksJson = computed({
  get: () => JSON.stringify(content.value.checks || [], null, 2),
  set: (value: string) => setJson('checks', value)
})

function addOption() {
  if (!Array.isArray(content.value.options)) content.value.options = []
  content.value.options.push({ id: crypto.randomUUID(), text: 'Вариант', correct: false })
}
function removeOption(id: string) {
  content.value.options = (content.value.options || []).filter((option: any) => option.id !== id)
}
function setJson(field: string, value: string) {
  try {
    content.value[field] = JSON.parse(value)
    jsonError.value = ''
  } catch {
    jsonError.value = 'JSON заполнен неверно'
  }
}
async function save() {
  const response = await $fetch<any>(`/api/tasks/${props.task.id}`, {
    method: 'PATCH',
    body: { type: type.value, title: title.value, content: content.value }
  })
  emit('saved', response.task)
}
async function del() {
  await $fetch(`/api/tasks/${props.task.id}`, { method: 'DELETE' })
  emit('deleted')
}
</script>

<template>
  <section class="card soft stack">
    <h3>Конструктор задания</h3>
    <div class="grid">
      <label>Тип
        <select v-model="type">
          <option value="LECTURE">Лекция</option>
          <option value="QUESTION">Вопрос</option>
          <option value="SINGLE_CHOICE">Тест с 1 ответом</option>
          <option value="MULTI_CHOICE">Тест с множеством ответов</option>
          <option value="CODE">Код</option>
          <option value="MARKUP">Вёрстка</option>
        </select>
      </label>
      <label>Название<input v-model="title"></label>
    </div>

    <label>Заголовок<input v-model="content.title"></label>
    <label>Текст<textarea v-model="content.text" /></label>

    <label v-if="type === 'QUESTION'">Верные ответы, по одному на строку
      <textarea v-model="answersText" />
    </label>

    <div v-if="type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE'" class="stack">
      <div v-for="option in content.options || []" :key="option.id" class="option">
        <input v-model="option.text">
        <label><input type="checkbox" v-model="option.correct"> верный</label>
        <button class="danger" type="button" @click="removeOption(option.id)">Удалить</button>
      </div>
      <button class="secondary" type="button" @click="addOption">Добавить вариант</button>
    </div>

    <div v-if="type === 'CODE'" class="stack">
      <label>Имя функции<input v-model="content.functionName"></label>
      <label>Стартовый код<textarea class="codearea" v-model="content.starterCode" /></label>
      <label>Видимых тестов<input type="number" v-model.number="content.visibleTests"></label>
      <label>Тесты JSON<textarea class="codearea" v-model="testsJson" /></label>
    </div>

    <div v-if="type === 'MARKUP'" class="stack">
      <label>index.html<textarea class="codearea" v-model="content.html" /></label>
      <label>style.css<textarea class="codearea" v-model="content.css" /></label>
      <label>script.js<textarea class="codearea" v-model="content.js" /></label>
      <label>Проверки JSON<textarea class="codearea" v-model="checksJson" /></label>
    </div>

    <p class="err" v-if="jsonError">{{ jsonError }}</p>
    <div class="row">
      <button type="button" @click="save">Сохранить</button>
      <button type="button" class="danger" @click="del">Удалить задание</button>
    </div>
  </section>
</template>
