<script setup lang="ts">
const { user, fetchMe } = useAuth()

await fetchMe()

if (user.value) {
  await navigateTo(`/user/${user.value.login}`)
}

const form = reactive({
  name: '',
  login: '',
  email: '',
  password: '',
  repeatPassword: ''
})

const errorMessage = ref('')

async function register() {
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: form
    })

    await fetchMe(true)
    await navigateTo(`/user/${user.value?.login}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Ошибка регистрации'
  }
}
</script>

<template>
  <section class="auth card stack">
    <h1>Регистрация</h1>

    <form class="stack" @submit.prevent="register">
      <input v-model="form.name" placeholder="Имя">
      <input v-model="form.login" placeholder="Логин">
      <input v-model="form.email" type="email" placeholder="Почта">
      <PasswordInput
        v-model="form.password"
        placeholder="Пароль"
        autocomplete="new-password"
      />
      <PasswordInput
        v-model="form.repeatPassword"
        placeholder="Повторите пароль"
        autocomplete="new-password"
      />
      <button>Зарегистрироваться</button>
    </form>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </section>
</template>
