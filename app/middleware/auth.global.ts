import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Server-side: redirect protected routes to login as safety net
  // (Protected routes have ssr: false, but this ensures no server-rendered protected content)
  if (import.meta.server) {
    const isProtectedRoute =
      to.path.startsWith('/admin') ||
      to.path.startsWith('/petugas') ||
      to.path.startsWith('/peminjam')

    if (isProtectedRoute) {
      return navigateTo('/auth/login', { replace: true })
    }
    return
  }

  // Client-side auth check
  const authStore = useAuthStore()

  // Load from storage if not loaded yet
  if (!authStore.isAuthenticated) {
    authStore.loadFromStorage()
  }

  // Auth pages - redirect if already logged in
  if (to.path.startsWith('/auth')) {
    if (authStore.isAuthenticated && authStore.userRole) {
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin',
        PETUGAS: '/petugas',
        PEMINJAM: '/peminjam',
      }
      return navigateTo(roleRoutes[authStore.userRole] || '/', { replace: true })
    }
    return
  }

  // Protected routes - redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Role-based access control
  const role = authStore.userRole

  if (to.path.startsWith('/admin') && role !== 'ADMIN') {
    return navigateTo('/auth/login', { replace: true })
  }

  if (to.path.startsWith('/petugas') && role !== 'PETUGAS') {
    return navigateTo('/auth/login', { replace: true })
  }

  if (to.path.startsWith('/peminjam') && role !== 'PEMINJAM') {
    return navigateTo('/auth/login', { replace: true })
  }
})
