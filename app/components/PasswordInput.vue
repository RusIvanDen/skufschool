<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  autocomplete?: string
  name?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="password-field">
    <input
      :name="name"
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      @input="updateValue"
    >

    <button
      class="password-toggle"
      type="button"
      :aria-label="visible ? 'Скрыть пароль' : 'Показать пароль'"
      :title="visible ? 'Скрыть пароль' : 'Показать пароль'"
      @click="visible = !visible"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z"
        />
        <circle cx="12" cy="12" r="3.25" />
        <path v-if="visible" class="eye-slash" d="M4 4l16 16" />
      </svg>
    </button>
  </div>
</template>
