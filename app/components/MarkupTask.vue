<script setup lang="ts">
const props = defineProps<{
  taskId: number
  content: any
}>()

const emit = defineEmits<{
  answered: [ok: boolean]
}>()

const activeTab = ref<'task' | 'html' | 'css' | 'js'>('task')
const html = ref(props.content.html || '')
const css = ref(props.content.css || '')
const js = ref(props.content.js || '')
const result = ref<any>(null)

let timer: ReturnType<typeof setTimeout> | null = null

const cssLinkRe = /<link\b(?=[^>]*rel=["']stylesheet["'])(?=[^>]*href=["']style\.css["'])[^>]*>/i
const jsScriptRe = /<script\b(?=[^>]*src=["']script\.js["'])[^>]*>\s*<\/script>/i

const htmlWithoutComments = computed(() => html.value.replace(/<!--[\s\S]*?-->/g, ''))
const cssLinked = computed(() => cssLinkRe.test(htmlWithoutComments.value))
const jsLinked = computed(() => jsScriptRe.test(htmlWithoutComments.value))

const srcdoc = computed(() => {
  let documentText = html.value

  if (cssLinked.value) {
    documentText = documentText.replace(cssLinkRe, `<style>${css.value}</style>`)
  }

  if (jsLinked.value) {
    documentText = documentText.replace(jsScriptRe, `<script>${js.value}<\/script>`)
  }

  return documentText
})

watch(
  () => props.taskId,
  () => {
    activeTab.value = 'task'
    html.value = props.content.html || ''
    css.value = props.content.css || ''
    js.value = props.content.js || ''
    result.value = null
  }
)

watch([html, css, js], () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => check('check'), 450)
})

async function check(mode: 'check' | 'answer') {
  const response = await $fetch<any>(`/api/tasks/${props.taskId}/answer`, {
    method: 'POST',
    body: {
      mode,
      answer: {
        html: html.value,
        css: css.value,
        js: js.value
      }
    }
  })

  result.value = response

  if (mode === 'answer') {
    emit('answered', Boolean(response.correct))
  }
}
</script>

<template>
  <div class="split">
    <section class="pane markup">
      <div class="tabs">
        <button :class="{ active: activeTab === 'task' }" @click="activeTab = 'task'">
          задание.md
        </button>
        <button :class="{ active: activeTab === 'html' }" @click="activeTab = 'html'">
          index.html
        </button>
        <button :class="{ active: activeTab === 'css' }" @click="activeTab = 'css'">
          style.css
        </button>
        <button :class="{ active: activeTab === 'js' }" @click="activeTab = 'js'">
          script.js
        </button>
      </div>

      <div v-if="activeTab === 'task'" class="theory">
        <h2>{{ content.title }}</h2>
        <p>{{ content.text }}</p>
        <p class="muted">
          CSS и JS работают только если строки подключения не удалены и не закомментированы.
        </p>
      </div>

      <textarea v-else-if="activeTab === 'html'" v-model="html" class="editor" />
      <textarea v-else-if="activeTab === 'css'" v-model="css" class="editor" />
      <textarea v-else v-model="js" class="editor" />
    </section>

    <section class="pane right">
      <iframe sandbox="allow-scripts" :srcdoc="srcdoc" />

      <div class="result">
        <h3>Задачи</h3>

        <ul>
          <li
            v-for="checkItem in result?.checks || content.checks || []"
            :key="checkItem.id"
            :class="{ green: checkItem.ok === true }"
          >
            {{ checkItem.title }}
          </li>
        </ul>

        <button @click="check('answer')">Ответить</button>
      </div>
    </section>
  </div>
</template>
