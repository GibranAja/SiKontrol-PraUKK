<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'peminjam',
})

useHead({
  title: 'Dashboard Peminjam - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const isLoading = ref(true)
const profileData = ref<any>(null)
const recentPeminjaman = ref<any[]>([])

// Fetch profile with statistics
async function fetchProfile() {
  try {
    const response = await $fetch<any>('/api/auth/me', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      profileData.value = response.data
    }
  } catch (error) {
    console.error('Fetch profile error:', error)
  }
}

// Fetch recent peminjaman
async function fetchRecentPeminjaman() {
  try {
    const response = await $fetch<any>('/api/peminjaman/me', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      params: { limit: 5, page: 1 },
    })
    if (response.success) {
      recentPeminjaman.value = response.data
    }
  } catch (error) {
    console.error('Fetch recent peminjaman error:', error)
  }
}

async function loadDashboard() {
  isLoading.value = true
  await Promise.all([fetchProfile(), fetchRecentPeminjaman()])
  isLoading.value = false
}

onMounted(() => {
  loadDashboard()
})

// Helper functions
function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    MENUNGGU_PERSETUJUAN: 'bg-amber-100 text-amber-700',
    DISETUJUI: 'bg-blue-100 text-blue-700',
    DITOLAK: 'bg-red-100 text-red-700',
    DIPINJAM: 'bg-teal-100 text-teal-700',
    DIKEMBALIKAN: 'bg-slate-100 text-slate-600',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    MENUNGGU_PERSETUJUAN: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    DIPINJAM: 'Dipinjam',
    DIKEMBALIKAN: 'Dikembalikan',
  }
  return labels[status] || status
}

// Check if user can borrow (not blocked and no unpaid fines)
const canBorrow = computed(() => {
  if (!profileData.value) return false
  return (
    profileData.value.status_akun === 'AKTIF' &&
    profileData.value.statistics?.total_denda_belum_bayar === 0
  )
})

const isBlocked = computed(() => {
  return profileData.value?.status_akun === 'DIBLOKIR'
})

const hasUnpaidFines = computed(() => {
  return (profileData.value?.statistics?.total_denda_belum_bayar || 0) > 0
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-linear-to-br from-teal-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading font-bold text-2xl md:text-3xl mb-2">
            Halo, {{ user?.nama_lengkap }}! 👋
          </h1>
          <p class="text-teal-100 text-base">
            Telusuri dan pinjam alat yang kamu butuhkan
          </p>
          <div class="flex items-center gap-3 mt-4">
            <span class="bg-white/20 backdrop-blur-sm text-sm px-3 py-1 rounded-full">
              {{ user?.kelas }}
            </span>
            <span
              :class="[
                'text-sm px-3 py-1 rounded-full',
                isBlocked ? 'bg-red-500/30 text-red-100' : 'bg-emerald-500/30 text-emerald-100',
              ]"
            >
              {{ isBlocked ? 'Diblokir' : 'Aktif' }}
            </span>
          </div>
        </div>
        <div class="hidden md:block">
          <div class="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <UIcon name="i-lucide-user-circle" class="text-6xl text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Alert: Blocked Account -->
    <div
      v-if="isBlocked"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
    >
      <UIcon name="i-lucide-shield-x" class="text-red-500 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-red-700">Akun Diblokir</p>
        <p class="text-sm text-red-600">
          Akun Anda sedang diblokir. Anda tidak dapat mengajukan peminjaman baru.
          Silakan hubungi petugas untuk informasi lebih lanjut.
        </p>
      </div>
    </div>

    <!-- Alert: Unpaid Fines -->
    <div
      v-if="hasUnpaidFines && !isBlocked"
      class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
    >
      <UIcon name="i-lucide-alert-triangle" class="text-amber-500 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-amber-700">Denda Belum Lunas</p>
        <p class="text-sm text-amber-600">
          Anda memiliki denda sebesar
          <strong>{{ formatRupiah(profileData?.statistics?.total_denda_belum_bayar || 0) }}</strong>.
          Tombol pengajuan peminjaman tidak tersedia sampai denda dilunasi.
        </p>
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
      <!-- Total Peminjaman -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clipboard-list" class="text-2xl text-teal-600" />
          </div>
          <span class="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Total
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Peminjaman</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ profileData?.statistics?.total_peminjaman || 0 }}
        </p>
      </div>

      <!-- Peminjaman Aktif -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="text-2xl text-blue-600" />
          </div>
          <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Aktif
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Sedang Dipinjam</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ profileData?.statistics?.peminjaman_aktif || 0 }}
        </p>
      </div>

      <!-- Terlambat -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="text-2xl text-red-600" />
          </div>
          <span class="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
            Perhatian
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Terlambat</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ profileData?.statistics?.peminjaman_terlambat || 0 }}
        </p>
      </div>

      <!-- Denda -->
      <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-banknote" class="text-2xl text-amber-600" />
          </div>
          <span class="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            Denda
          </span>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Denda Belum Lunas</h3>
        <p class="text-2xl font-heading font-bold text-slate-900">
          {{ formatRupiah(profileData?.statistics?.total_denda_belum_bayar || 0) }}
        </p>
      </div>
    </div>

    <!-- Quick Actions & Recent Activity -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Quick Links -->
      <div class="bg-white rounded-xl shadow-md border border-slate-100 p-6">
        <h2 class="font-heading font-bold text-lg text-slate-900 mb-4">Aksi Cepat</h2>
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            to="/peminjam/katalog"
            class="flex flex-col items-center gap-2 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors text-center group"
          >
            <div class="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-search" class="text-2xl text-white" />
            </div>
            <span class="text-sm font-medium text-teal-700">Katalog Alat</span>
          </NuxtLink>

          <NuxtLink
            to="/peminjam/peminjaman"
            class="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center group"
          >
            <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-clipboard-list" class="text-2xl text-white" />
            </div>
            <span class="text-sm font-medium text-blue-700">Peminjaman Saya</span>
          </NuxtLink>

          <NuxtLink
            to="/peminjam/perpanjangan"
            class="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center group"
          >
            <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-calendar-plus" class="text-2xl text-white" />
            </div>
            <span class="text-sm font-medium text-purple-700">Perpanjangan</span>
          </NuxtLink>

          <NuxtLink
            to="/peminjam/denda"
            class="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-center group"
          >
            <div class="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-receipt" class="text-2xl text-white" />
            </div>
            <span class="text-sm font-medium text-amber-700">Denda & Riwayat</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-xl shadow-md border border-slate-100 p-6">
        <h2 class="font-heading font-bold text-lg text-slate-900 mb-4">Peminjaman Terakhir</h2>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
              <div class="h-2 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
        <div v-else-if="recentPeminjaman.length === 0" class="text-center py-8">
          <UIcon name="i-lucide-inbox" class="text-4xl text-slate-300 mx-auto mb-2" />
          <p class="text-slate-400 text-sm">Belum ada peminjaman</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in recentPeminjaman"
            :key="item.kode_peminjaman"
            class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-package" class="text-lg text-teal-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">
                {{ item.alat?.nama_alat }}
              </p>
              <p class="text-xs text-slate-500">
                {{ item.kode_peminjaman }} &bull; {{ formatDate(item.tanggal_pengajuan) }}
              </p>
            </div>
            <span
              :class="[
                'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
                getStatusColor(item.status_peminjaman),
              ]"
            >
              {{ getStatusLabel(item.status_peminjaman) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
