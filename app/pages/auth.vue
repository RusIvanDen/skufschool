<script setup lang="ts">
const { user, fetchMe } = useAuth()

await fetchMe()

if (user.value) {
  await navigateTo(`/user/${user.value.login}`)
}

const form = reactive({
  email: '',
  password: ''
})

const errorMessage = ref('')

async function login() {
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form
    })

    await fetchMe(true)
    await navigateTo(`/user/${user.value?.login}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Ошибка авторизации'
  }
}
</script>

<template>
  <section class="auth card stack">
    <h1>Вход</h1>

    <form class="stack" @submit.prevent="login">
      <input v-model="form.email" type="email" placeholder="Почта">
      <PasswordInput
        v-model="form.password"
        placeholder="Пароль"
        autocomplete="current-password"
      />
      <NuxtLink to="/auth">Забыли пароль?</NuxtLink>
      <button>Войти</button>
    </form>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </section>
</template>
