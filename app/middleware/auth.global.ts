import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
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
      return navigateTo(roleRoutes[authStore.userRole] || '/')
    }
    return
  }

  // Protected routes - redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  // Role-based access control
  const role = authStore.userRole

  if (to.path.startsWith('/admin') && role !== 'ADMIN') {
    return navigateTo('/auth/login')
  }

  if (to.path.startsWith('/petugas') && role !== 'PETUGAS') {
    return navigateTo('/auth/login')
  }

  if (to.path.startsWith('/peminjam') && role !== 'PEMINJAM') {
    return navigateTo('/auth/login')
  }
})
