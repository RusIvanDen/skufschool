<script setup lang="ts">
const { user, fetchMe, logout } = useAuth()

await fetchMe()
</script>

<template>
  <header class="header">
    <NuxtLink class="brand" to="/">SkufSchool</NuxtLink>

    <nav v-if="user" class="nav">
      <NuxtLink to="/courses">Курсы</NuxtLink>
      <NuxtLink :to="`/user/${user.login}`">Профиль</NuxtLink>
      <button class="link-button" @click="logout">Выйти</button>
    </nav>

    <nav v-else class="nav">
      <NuxtLink to="/courses">Курсы</NuxtLink>
      <NuxtLink to="/auth">Вход</NuxtLink>
      <NuxtLink to="/reg">Регистрация</NuxtLink>
    </nav>
  </header>
</template>
