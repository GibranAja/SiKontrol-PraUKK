<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Dashboard Admin - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const isLoading = ref(true)
const dashboardData = ref<any>(null)

// Fetch dashboard statistics
async function fetchDashboard() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/laporan/dashboard', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      dashboardData.value = response.data
    }
  } catch (error) {
    console.error('Fetch dashboard error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading font-bold text-3xl mb-2">
            Selamat Datang, {{ user?.nama_lengkap }}! 👋
          </h1>
          <p class="text-teal-100 text-lg">
            Kelola sistem peminjaman alat dengan mudah dan efisien
          </p>
        </div>
        <div class="hidden md:block">
          <div class="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <UIcon name="i-lucide-shield-check" class="text-6xl text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl p-6 shadow-md animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-users" class="text-2xl text-blue-600" />
          </div>
          <span class="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            Total
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Pengguna</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.total_users || 0 }}
        </p>
      </div>

      <!-- Total Categories -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-folder" class="text-2xl text-purple-600" />
          </div>
          <span class="inline-block text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-md">
            Kategori
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Kategori</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.total_kategori || 0 }}
        </p>
      </div>

      <!-- Total Equipment -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-package" class="text-2xl text-teal-600" />
          </div>
          <span class="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-md">
            Alat
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Alat</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.total_alat || 0 }}
        </p>
      </div>

      <!-- Active Borrowings -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="text-2xl text-orange-600" />
          </div>
          <span class="inline-block text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-md">
            Aktif
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Peminjaman Aktif</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.peminjaman_aktif || 0 }}
        </p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <h2 class="font-heading font-bold text-xl text-slate-900 mb-6">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          to="/admin/users"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
        >
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-user-plus" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Kelola Pengguna</p>
            <p class="text-sm text-slate-600">Tambah & edit user</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/categories"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
        >
          <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-folder-plus" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Kelola Kategori</p>
            <p class="text-sm text-slate-600">Atur kategori alat</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/equipment"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 transition-all duration-200 border border-teal-200"
        >
          <div class="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-package-plus" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Kelola Alat</p>
            <p class="text-sm text-slate-600">Tambah & edit alat</p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Activity Preview -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-heading font-bold text-xl text-slate-900">Aktivitas Terbaru</h2>
        <NuxtLink
          to="/admin/logs"
          class="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
        >
          <span>Lihat Semua</span>
          <UIcon name="i-lucide-arrow-right" class="text-lg" />
        </NuxtLink>
      </div>
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <UIcon name="i-lucide-file-text" class="text-5xl text-slate-300 mb-3" />
          <p class="text-slate-500">Buka halaman Log Aktivitas untuk melihat detail</p>
        </div>
      </div>
    </div>
  </div>
</template>
