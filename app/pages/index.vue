<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
})

// Redirect based on auth state immediately (no onMounted delay)
if (import.meta.client) {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  if (authStore.isAuthenticated && authStore.userRole) {
    const roleRoutes: Record<string, string> = {
      ADMIN: '/admin',
      PETUGAS: '/petugas',
      PEMINJAM: '/peminjam',
    }
    await navigateTo(roleRoutes[authStore.userRole] || '/auth/login', { replace: true })
  } else {
    await navigateTo('/auth/login', { replace: true })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-600 mb-3">
        <svg class="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <p class="text-sm text-slate-600">Memuat...</p>
    </div>
  </div>
</template>
