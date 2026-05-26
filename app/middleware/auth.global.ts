const publicRoutes = new Set(['/', '/auth', '/reg'])
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchMe } = useAuth(); await fetchMe()
  if (!user.value && !publicRoutes.has(to.path)) return navigateTo('/auth')
  if (user.value && (to.path === '/auth' || to.path === '/reg')) return navigateTo(`/user/${user.value.login}`)
})
