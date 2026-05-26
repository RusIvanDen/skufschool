<script setup lang="ts">
type VisibleCodeTest = {
  args: unknown[]
  expected: unknown
}

type CodeTestResult = VisibleCodeTest & {
  actual: unknown
  ok: boolean
}

const props = defineProps<{
  taskId: number
  content: any
}>()

const emit = defineEmits<{
  answered: [ok: boolean]
}>()

const code = ref(props.content.starterCode || '')
const result = ref<any>(null)
const visibleResults = ref<CodeTestResult[] | null>(null)

const visibleTests = computed<VisibleCodeTest[]>(() => {
  const limit = Number(props.content.visibleTests || 5)
  return (props.content.tests || []).slice(0, limit)
})

const totalTestsCount = computed(() => {
  if (result.value) {
    return Number(result.value.passedCount || 0) + Number(result.value.failedCount || 0)
  }

  return props.content.tests?.length || 0
})

watch(
  () => props.taskId,
  () => {
    code.value = props.content.starterCode || ''
    result.value = null
    visibleResults.value = null
  }
)

function getTestResult(index: number) {
  return visibleResults.value?.[index]
}

function testLineClass(index: number) {
  const testResult = getTestResult(index)

  return {
    ok: testResult?.ok === true,
    fail: testResult?.ok === false
  }
}

function displayValue(value: unknown) {
  if (typeof value === 'undefined') return '—'
  if (typeof value === 'string') return value

  return JSON.stringify(value)
}

async function check(mode: 'check' | 'answer') {
  const response = await $fetch<any>(`/api/tasks/${props.taskId}/answer`, {
    method: 'POST',
    body: {
      mode,
      answer: {
        code: code.value
      }
    }
  })

  result.value = response
  visibleResults.value = response.visibleResults || []

  if (mode === 'answer') {
    emit('answered', Boolean(response.correct))

    if (response.correct) {
      code.value = props.content.starterCode || ''
    } else {
      alert(`Ошибка! ${response.failedCount} тестов пройдено ошибочно!`)
    }
  }
}

function handleTab(event: KeyboardEvent) {
  event.preventDefault()

  const target = event.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd

  code.value = `${code.value.slice(0, start)}\t${code.value.slice(end)}`

  nextTick(() => {
    target.selectionStart = start + 1
    target.selectionEnd = start + 1
  })
}
</script>

<template>
  <div class="code-task">
    <aside class="card stack resizable">
      <h2>{{ content.title }}</h2>
      <p>{{ content.text }}</p>
    </aside>

    <section class="stack grow">
      <textarea
        v-model="code"
        class="code-editor"
        spellcheck="false"
        @keydown.tab="handleTab"
      />

      <div class="card stack">
        <div class="row">
          <button class="secondary" @click="check('check')">
            Проверить
          </button>
          <button @click="check('answer')">
            Ответить
          </button>
        </div>

        <div
          v-for="(test, index) in visibleTests"
          :key="`${index}-${JSON.stringify(test.args)}`"
          class="testline"
          :class="testLineClass(index)"
        >
          <div>
            <b>Вход:</b> {{ displayValue(test.args) }}
          </div>
          <div>
            <b>Ожидание:</b> {{ displayValue(test.expected) }}
          </div>
          <div>
            <b>Ваш результат:</b> {{ displayValue(getTestResult(index)?.actual) }}
          </div>
        </div>

        <p v-if="result">
          Пройдено тестов: {{ result.passedCount }} / {{ totalTestsCount }}
        </p>
      </div>
    </section>
  </div>
</template>
