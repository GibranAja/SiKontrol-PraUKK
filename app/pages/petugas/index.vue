<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Dashboard Petugas - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const isLoading = ref(true)
const dashboardData = ref<any>(null)

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
            Kelola peminjaman dan pengembalian alat dengan efisien
          </p>
        </div>
        <div class="hidden md:block">
          <div class="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <UIcon name="i-lucide-clipboard-check" class="text-6xl text-white" />
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
      <!-- Pending Peminjaman -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="text-2xl text-orange-600" />
          </div>
          <span class="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            Menunggu
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Menunggu Persetujuan</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.peminjaman?.pending || 0 }}
        </p>
      </div>

      <!-- Active Peminjaman -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-hand-helping" class="text-2xl text-blue-600" />
          </div>
          <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Aktif
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Peminjaman Aktif</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.peminjaman?.active || 0 }}
        </p>
      </div>

      <!-- Overdue -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-alert-triangle" class="text-2xl text-red-600" />
          </div>
          <span class="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
            Terlambat
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Overdue</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.peminjaman?.overdue || 0 }}
        </p>
      </div>

      <!-- Pending Perpanjangan -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-calendar-plus" class="text-2xl text-purple-600" />
          </div>
          <span class="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Perpanjangan
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Permintaan Perpanjangan</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.peminjaman?.pending_perpanjangan || 0 }}
        </p>
      </div>
    </div>

    <!-- Second Row Stats -->
    <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Total Alat -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-package" class="text-2xl text-teal-600" />
          </div>
          <span class="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Inventaris
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Alat Tersedia</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ dashboardData?.alat?.available || 0 }}
          <span class="text-base font-normal text-slate-400">/ {{ dashboardData?.alat?.total || 0 }}</span>
        </p>
      </div>

      <!-- Unpaid Denda -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-banknote" class="text-2xl text-yellow-600" />
          </div>
          <span class="text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
            Denda
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Denda Belum Dibayar</h3>
        <p class="text-2xl font-heading font-bold text-slate-900">
          Rp {{ (dashboardData?.pengembalian?.unpaid_denda || 0).toLocaleString('id-ID') }}
        </p>
      </div>

      <!-- Monthly Stats -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-trending-up" class="text-2xl text-green-600" />
          </div>
          <span class="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Bulan Ini
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Transaksi Bulan Ini</h3>
        <div class="flex items-center space-x-4">
          <div>
            <p class="text-2xl font-heading font-bold text-slate-900">
              {{ dashboardData?.monthly?.peminjaman || 0 }}
            </p>
            <p class="text-xs text-slate-500">Peminjaman</p>
          </div>
          <div class="w-px h-10 bg-slate-200"></div>
          <div>
            <p class="text-2xl font-heading font-bold text-slate-900">
              {{ dashboardData?.monthly?.pengembalian || 0 }}
            </p>
            <p class="text-xs text-slate-500">Pengembalian</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <h2 class="font-heading font-bold text-xl text-slate-900 mb-6">Aksi Cepat</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NuxtLink
          to="/petugas/borrowings"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200"
        >
          <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-hand-helping" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Verifikasi Peminjaman</p>
            <p class="text-sm text-slate-600">Setujui/tolak pengajuan</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/petugas/returns"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
        >
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-undo-2" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Proses Pengembalian</p>
            <p class="text-sm text-slate-600">Input pengembalian alat</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/petugas/extensions"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
        >
          <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-calendar-plus" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Perpanjangan</p>
            <p class="text-sm text-slate-600">Kelola permintaan</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/petugas/reports"
          class="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 transition-all duration-200 border border-teal-200"
        >
          <div class="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-file-bar-chart" class="text-2xl text-white" />
          </div>
          <div>
            <p class="font-semibold text-slate-900">Laporan</p>
            <p class="text-sm text-slate-600">Cetak laporan transaksi</p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Top Borrowed Equipment -->
    <div v-if="!isLoading && dashboardData?.top_alat?.length" class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <h2 class="font-heading font-bold text-xl text-slate-900 mb-6">Alat Terpopuler</h2>
      <div class="space-y-3">
        <div
          v-for="(item, idx) in dashboardData.top_alat"
          :key="item.id_alat"
          class="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="font-heading font-bold text-teal-600">{{ idx + 1 }}</span>
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ item.nama_alat }}</p>
              <p class="text-sm text-slate-500">{{ item.kategori?.nama_kategori || item.kode_alat }}</p>
            </div>
          </div>
          <span class="px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
            {{ item.peminjaman_count }}x dipinjam
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
