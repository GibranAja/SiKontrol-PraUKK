<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'peminjam',
})

useHead({
  title: 'Perpanjangan - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(true)
const perpanjanganList = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10
const statusFilter = ref('')

const statusOptions = [
  { label: 'Menunggu', value: 'MENUNGGU' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
]

async function fetchPerpanjangan() {
  isLoading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit,
    }
    if (statusFilter.value) params.status = statusFilter.value

    const response = await $fetch<any>('/api/perpanjangan', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      params,
    })
    if (response.success) {
      perpanjanganList.value = response.data
      totalPages.value = response.meta?.totalPages || 1
      totalItems.value = response.meta?.total || 0
    }
  } catch (error) {
    console.error('Fetch perpanjangan error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat data perpanjangan.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isLoading.value = false
  }
}

function onFilterChange() {
  currentPage.value = 1
  fetchPerpanjangan()
}

function goToPage(page: number) {
  currentPage.value = page
  fetchPerpanjangan()
}

// Helpers
function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    MENUNGGU: 'bg-amber-100 text-amber-700',
    DISETUJUI: 'bg-emerald-100 text-emerald-700',
    DITOLAK: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
  }
  return labels[status] || status
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    MENUNGGU: 'i-lucide-hourglass',
    DISETUJUI: 'i-lucide-check-circle',
    DITOLAK: 'i-lucide-x-circle',
  }
  return icons[status] || 'i-lucide-circle'
}

function getStatusBorderColor(status: string) {
  const colors: Record<string, string> = {
    MENUNGGU: '#f59e0b',
    DISETUJUI: '#10b981',
    DITOLAK: '#ef4444',
  }
  return colors[status] || '#94a3b8'
}

// Count by status
const countByStatus = computed(() => {
  const all = perpanjanganList.value
  return {
    menunggu: all.filter(p => p.status_perpanjangan === 'MENUNGGU').length,
    disetujui: all.filter(p => p.status_perpanjangan === 'DISETUJUI').length,
    ditolak: all.filter(p => p.status_perpanjangan === 'DITOLAK').length,
  }
})

onMounted(() => {
  fetchPerpanjangan()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Perpanjangan</h1>
        <p class="text-slate-500 text-sm mt-1">Pantau status pengajuan perpanjangan peminjaman</p>
      </div>
      <div class="flex items-center gap-3">
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Filter Status"
          size="md"
          class="w-48"
          @update:modelValue="onFilterChange"
        />
      </div>
    </div>

    <!-- Info Card -->
    <div class="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
      <UIcon name="i-lucide-info" class="text-purple-500 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-purple-700 text-sm">Cara Mengajukan Perpanjangan</p>
        <p class="text-xs text-purple-600 mt-1">
          Buka halaman <strong>Peminjaman Saya</strong>, klik peminjaman yang berstatus <strong>Dipinjam</strong>,
          lalu tekan tombol "Ajukan Perpanjangan". Perpanjangan hanya bisa diajukan 3 hari sebelum jatuh tempo.
        </p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingState v-if="isLoading" message="Memuat data perpanjangan..." />

    <!-- Empty -->
    <EmptyState
      v-else-if="perpanjanganList.length === 0"
      message="Belum ada pengajuan perpanjangan"
      icon="i-lucide-calendar-plus"
    />

    <!-- Perpanjangan List -->
    <div v-else class="space-y-4">
      <div
        v-for="item in perpanjanganList"
        :key="item.id_perpanjangan"
        class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden"
      >
        <!-- Status Bar -->
        <div
          class="h-1"
          :style="{ backgroundColor: getStatusBorderColor(item.status_perpanjangan) }"
        ></div>

        <div class="p-5">
          <div class="flex flex-col md:flex-row md:items-start gap-4">
            <!-- Icon -->
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                item.status_perpanjangan === 'MENUNGGU' ? 'bg-amber-100' :
                item.status_perpanjangan === 'DISETUJUI' ? 'bg-emerald-100' : 'bg-red-100',
              ]"
            >
              <UIcon
                :name="getStatusIcon(item.status_perpanjangan)"
                :class="[
                  'text-xl',
                  item.status_perpanjangan === 'MENUNGGU' ? 'text-amber-600' :
                  item.status_perpanjangan === 'DISETUJUI' ? 'text-emerald-600' : 'text-red-600',
                ]"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 space-y-3">
              <!-- Equipment & Code -->
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">
                  {{ item.peminjaman?.alat?.nama_alat }}
                </h3>
                <p class="text-xs text-slate-500">
                  Kode Peminjaman: {{ item.peminjaman?.kode_peminjaman }}
                </p>
              </div>

              <!-- Details Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p class="text-xs text-slate-500">Diajukan</p>
                  <p class="text-sm font-medium text-slate-800">{{ formatDate(item.tanggal_pengajuan) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Durasi Tambahan</p>
                  <p class="text-sm font-medium text-slate-800">+{{ item.durasi_tambahan_hari }} hari</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Batas Kembali Saat Ini</p>
                  <p class="text-sm font-medium text-slate-800">
                    {{ formatDate(item.peminjaman?.tanggal_harus_kembali) }}
                  </p>
                </div>
                <div v-if="item.tgl_disetujui">
                  <p class="text-xs text-slate-500">Disetujui Pada</p>
                  <p class="text-sm font-medium text-emerald-700">{{ formatDate(item.tgl_disetujui) }}</p>
                </div>
              </div>

              <!-- Reason -->
              <div class="bg-slate-50 rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Alasan</p>
                <p class="text-sm text-slate-700">{{ item.alasan_permintaan }}</p>
              </div>

              <!-- Rejection Reason -->
              <div v-if="item.alasan_ditolak_admin" class="bg-red-50 rounded-lg p-3">
                <p class="text-xs text-red-600 mb-1">Alasan Ditolak</p>
                <p class="text-sm text-red-700">{{ item.alasan_ditolak_admin }}</p>
              </div>

              <!-- Verifikator -->
              <div v-if="item.petugas_verifikator" class="flex items-center gap-2 text-xs text-slate-500">
                <UIcon name="i-lucide-user-check" class="text-slate-400" />
                <span>Diverifikasi oleh: {{ item.petugas_verifikator.nama_lengkap }}</span>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="shrink-0">
              <span
                :class="[
                  'text-xs font-semibold px-3 py-1.5 rounded-full',
                  getStatusColor(item.status_perpanjangan),
                ]"
              >
                {{ getStatusLabel(item.status_perpanjangan) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        variant="outline"
        color="neutral"
        size="sm"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      />
      <template v-for="page in totalPages" :key="page">
        <UButton
          v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
          :label="String(page)"
          :variant="page === currentPage ? 'solid' : 'outline'"
          :color="page === currentPage ? 'primary' : 'neutral'"
          size="sm"
          @click="goToPage(page)"
        />
        <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="text-slate-400">...</span>
      </template>
      <UButton
        icon="i-lucide-chevron-right"
        variant="outline"
        color="neutral"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      />
    </div>
  </div>
</template>
