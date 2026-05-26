import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-05',
  devtools: { enabled: true },
  css: ['~/assets/scss/main.scss'],
  runtimeConfig: {
    public: { siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000' }
  },
  typescript: { strict: true, typeCheck: false },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit']
    }
  }
})
