export type AuthUser = { id:number; name:string; login:string; email:string; role:'USER'|'ADMIN' }

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const loaded = useState('auth:loaded', () => false)

  async function fetchMe(force = false) {
    if (loaded.value && !force) return user.value
    try {
      const requestFetch = import.meta.server ? useRequestFetch() : $fetch
      user.value = (await requestFetch<{ user: AuthUser | null }>('/api/auth/me')).user
    } catch {
      user.value = null
    }
    loaded.value = true
    return user.value
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    loaded.value = true
    await navigateTo('/auth')
  }

  return { user, loaded, isAdmin: computed(() => user.value?.role === 'ADMIN'), fetchMe, logout }
}
