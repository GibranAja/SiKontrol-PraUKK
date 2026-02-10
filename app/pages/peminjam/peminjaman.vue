<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'peminjam',
})

useHead({
  title: 'Peminjaman Saya - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(true)
const peminjamanList = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10
const statusFilter = ref('')

// Detail Modal
const showDetailModal = ref(false)
const selectedPeminjaman = ref<any>(null)
const isLoadingDetail = ref(false)

// Extension Modal
const showExtensionModal = ref(false)
const extensionForm = ref({
  durasi_tambahan_hari: 3,
  alasan_permintaan: '',
})
const isSubmittingExtension = ref(false)

// Profile check
const profileData = ref<any>(null)

const statusOptions = [
  { label: 'Menunggu Persetujuan', value: 'MENUNGGU_PERSETUJUAN' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Dipinjam', value: 'DIPINJAM' },
  { label: 'Ditolak', value: 'DITOLAK' },
  { label: 'Dikembalikan', value: 'DIKEMBALIKAN' },
]

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

async function fetchPeminjaman() {
  isLoading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit,
    }
    if (statusFilter.value) params.status = statusFilter.value

    const response = await $fetch<any>('/api/peminjaman/me', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      params,
    })
    if (response.success) {
      peminjamanList.value = response.data
      totalPages.value = response.meta?.totalPages || 1
      totalItems.value = response.meta?.total || 0
    }
  } catch (error) {
    console.error('Fetch peminjaman error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat data peminjaman.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isLoading.value = false
  }
}

async function openDetail(item: any) {
  showDetailModal.value = true
  isLoadingDetail.value = true
  try {
    const response = await $fetch<any>(`/api/peminjaman/${item.id_peminjaman}`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      selectedPeminjaman.value = response.data
    }
  } catch (error) {
    console.error('Fetch detail error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat detail peminjaman.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
    showDetailModal.value = false
  } finally {
    isLoadingDetail.value = false
  }
}

function openExtensionModal() {
  extensionForm.value = { durasi_tambahan_hari: 3, alasan_permintaan: '' }
  showExtensionModal.value = true
}

async function submitExtension() {
  if (!selectedPeminjaman.value || !extensionForm.value.alasan_permintaan.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Alasan perpanjangan wajib diisi.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
    return
  }

  isSubmittingExtension.value = true
  try {
    const response = await $fetch<any>('/api/perpanjangan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      body: {
        id_peminjaman: selectedPeminjaman.value.id_peminjaman,
        durasi_tambahan_hari: extensionForm.value.durasi_tambahan_hari,
        alasan_permintaan: extensionForm.value.alasan_permintaan.trim(),
      },
    })

    if (response.success) {
      toast.add({
        title: 'Berhasil!',
        description: 'Pengajuan perpanjangan berhasil dikirim.',
        color: 'primary',
        icon: 'i-lucide-check-circle',
      })
      showExtensionModal.value = false
      // Refresh detail
      await openDetail(selectedPeminjaman.value)
      await fetchPeminjaman()
    }
  } catch (error: any) {
    const msg = error?.data?.error?.message || 'Gagal mengajukan perpanjangan.'
    toast.add({
      title: 'Gagal',
      description: msg,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSubmittingExtension.value = false
  }
}

function onFilterChange() {
  currentPage.value = 1
  fetchPeminjaman()
}

function goToPage(page: number) {
  currentPage.value = page
  fetchPeminjaman()
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
    MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    DIPINJAM: 'Sedang Dipinjam',
    DIKEMBALIKAN: 'Dikembalikan',
  }
  return labels[status] || status
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    MENUNGGU_PERSETUJUAN: 'i-lucide-hourglass',
    DISETUJUI: 'i-lucide-check-circle',
    DITOLAK: 'i-lucide-x-circle',
    DIPINJAM: 'i-lucide-hand-helping',
    DIKEMBALIKAN: 'i-lucide-undo-2',
  }
  return icons[status] || 'i-lucide-circle'
}

function getPerpanjanganStatusColor(status: string) {
  const colors: Record<string, string> = {
    MENUNGGU: 'bg-amber-100 text-amber-700',
    DISETUJUI: 'bg-emerald-100 text-emerald-700',
    DITOLAK: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

function getPerpanjanganStatusLabel(status: string) {
  const labels: Record<string, string> = {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
  }
  return labels[status] || status
}

function getDendaStatusColor(status: string) {
  const colors: Record<string, string> = {
    BELUM_BAYAR: 'bg-red-100 text-red-700',
    LUNAS: 'bg-emerald-100 text-emerald-700',
    DICICIL: 'bg-amber-100 text-amber-700',
    WAIVED: 'bg-blue-100 text-blue-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

function getDendaStatusLabel(status: string) {
  const labels: Record<string, string> = {
    BELUM_BAYAR: 'Belum Bayar',
    LUNAS: 'Lunas',
    DICICIL: 'Dicicil',
    WAIVED: 'Dibebaskan',
  }
  return labels[status] || status
}

onMounted(async () => {
  await fetchProfile()
  await fetchPeminjaman()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Peminjaman Saya</h1>
        <p class="text-slate-500 text-sm mt-1">Kelola dan pantau semua peminjaman kamu</p>
      </div>
      <div class="flex items-center gap-3">
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Filter Status"
          size="md"
          class="w-52"
          @update:modelValue="onFilterChange"
        />
      </div>
    </div>

    <!-- Loading -->
    <LoadingState v-if="isLoading" message="Memuat data peminjaman..." />

    <!-- Empty -->
    <EmptyState
      v-else-if="peminjamanList.length === 0"
      message="Belum ada data peminjaman"
      icon="i-lucide-clipboard-list"
    >
      <NuxtLink to="/peminjam/katalog">
        <UButton
          label="Cari Alat di Katalog"
          icon="i-lucide-search"
          color="primary"
          class="mt-4"
        />
      </NuxtLink>
    </EmptyState>

    <!-- Peminjaman List -->
    <div v-else class="space-y-4">
      <div
        v-for="item in peminjamanList"
        :key="item.kode_peminjaman"
        class="bg-white rounded-xl shadow-md border border-slate-100 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer"
        @click="openDetail(item)"
      >
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <!-- Icon & Info -->
          <div class="flex items-center gap-4 flex-1">
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                item.is_overdue ? 'bg-red-100' : 'bg-teal-100',
              ]"
            >
              <UIcon
                :name="item.is_overdue ? 'i-lucide-alert-triangle' : 'i-lucide-package'"
                :class="item.is_overdue ? 'text-xl text-red-600' : 'text-xl text-teal-600'"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-900 text-sm truncate">
                {{ item.alat?.nama_alat }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ item.kode_peminjaman }} &bull; {{ item.alat?.kode_alat }}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                Diajukan: {{ formatDate(item.tanggal_pengajuan) }}
              </p>
            </div>
          </div>

          <!-- Status & Dates -->
          <div class="flex items-center gap-4 md:shrink-0">
            <!-- Dates -->
            <div v-if="item.tanggal_harus_kembali" class="text-right hidden lg:block">
              <p class="text-xs text-slate-500">Batas Kembali</p>
              <p
                :class="[
                  'text-sm font-semibold',
                  item.is_overdue ? 'text-red-600' : 'text-slate-800',
                ]"
              >
                {{ formatDate(item.tanggal_harus_kembali) }}
              </p>
            </div>

            <!-- Overdue Badge -->
            <span
              v-if="item.is_overdue"
              class="text-xs font-semibold bg-red-500 text-white px-2 py-1 rounded-full animate-pulse"
            >
              Terlambat!
            </span>

            <!-- Has Pending Extension -->
            <span
              v-if="item.has_pending_perpanjangan"
              class="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
            >
              Perpanjangan Pending
            </span>

            <!-- Denda Badge -->
            <span
              v-if="item.pengembalian?.denda > 0"
              :class="[
                'text-xs font-semibold px-2 py-1 rounded-full',
                getDendaStatusColor(item.pengembalian.status_denda),
              ]"
            >
              Denda: {{ formatRupiah(item.pengembalian.denda) }}
            </span>

            <!-- Status -->
            <span
              :class="[
                'text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap',
                getStatusColor(item.status_peminjaman),
              ]"
            >
              {{ getStatusLabel(item.status_peminjaman) }}
            </span>

            <UIcon name="i-lucide-chevron-right" class="text-slate-400" />
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

    <!-- Detail Modal (Lazy) -->
    <LazyUModal v-model:open="showDetailModal">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <!-- Loading -->
          <div v-if="isLoadingDetail" class="flex items-center justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="text-4xl text-teal-600 animate-spin" />
          </div>

          <div v-else-if="selectedPeminjaman" class="space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between">
              <h2 class="font-heading font-bold text-xl text-slate-900">Detail Peminjaman</h2>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showDetailModal = false"
              />
            </div>

            <!-- Status Banner -->
            <div
              :class="[
                'rounded-xl p-4 flex items-center gap-3',
                getStatusColor(selectedPeminjaman.status_peminjaman),
              ]"
            >
              <UIcon :name="getStatusIcon(selectedPeminjaman.status_peminjaman)" class="text-2xl" />
              <div>
                <p class="font-semibold text-sm">{{ getStatusLabel(selectedPeminjaman.status_peminjaman) }}</p>
                <p class="text-xs opacity-80">Kode: {{ selectedPeminjaman.kode_peminjaman }}</p>
              </div>
            </div>

            <!-- Overdue Alert -->
            <div
              v-if="selectedPeminjaman.computed?.is_overdue"
              class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
            >
              <UIcon name="i-lucide-alert-triangle" class="text-red-500 text-xl shrink-0" />
              <div>
                <p class="font-semibold text-red-700 text-sm">Peminjaman Terlambat!</p>
                <p class="text-xs text-red-600">
                  Terlambat {{ selectedPeminjaman.computed.days_overdue }} hari. Segera kembalikan alat untuk menghindari denda yang lebih besar.
                </p>
              </div>
            </div>

            <!-- Equipment Info -->
            <div class="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
              <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                <img
                  v-if="selectedPeminjaman.alat?.gambar"
                  :src="selectedPeminjaman.alat.gambar"
                  :alt="selectedPeminjaman.alat.nama_alat"
                  class="w-full h-full object-cover"
                />
                <UIcon v-else name="i-lucide-package" class="text-2xl text-slate-300" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">{{ selectedPeminjaman.alat?.nama_alat }}</h3>
                <p class="text-xs text-slate-500">{{ selectedPeminjaman.alat?.kode_alat }}</p>
                <p class="text-xs text-teal-600">{{ selectedPeminjaman.alat?.kategori?.nama_kategori }}</p>
              </div>
            </div>

            <!-- Date Timeline -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-blue-50 rounded-lg p-3 text-center">
                <p class="text-xs text-blue-600 mb-1">Tanggal Pengajuan</p>
                <p class="text-sm font-semibold text-blue-800">
                  {{ formatDate(selectedPeminjaman.tanggal_pengajuan) }}
                </p>
              </div>
              <div class="bg-teal-50 rounded-lg p-3 text-center">
                <p class="text-xs text-teal-600 mb-1">Tanggal Pinjam</p>
                <p class="text-sm font-semibold text-teal-800">
                  {{ formatDate(selectedPeminjaman.tanggal_pinjam) }}
                </p>
              </div>
              <div
                :class="[
                  'rounded-lg p-3 text-center',
                  selectedPeminjaman.computed?.is_overdue ? 'bg-red-50' : 'bg-amber-50',
                ]"
              >
                <p :class="selectedPeminjaman.computed?.is_overdue ? 'text-xs text-red-600 mb-1' : 'text-xs text-amber-600 mb-1'">
                  Batas Kembali
                </p>
                <p :class="selectedPeminjaman.computed?.is_overdue ? 'text-sm font-semibold text-red-800' : 'text-sm font-semibold text-amber-800'">
                  {{ formatDate(selectedPeminjaman.tanggal_harus_kembali) }}
                </p>
                <p
                  v-if="selectedPeminjaman.computed?.days_until_due !== null && selectedPeminjaman.status_peminjaman === 'DIPINJAM'"
                  :class="selectedPeminjaman.computed?.is_overdue ? 'text-xs text-red-600 mt-0.5' : 'text-xs text-amber-600 mt-0.5'"
                >
                  {{
                    selectedPeminjaman.computed?.is_overdue
                      ? `Terlambat ${selectedPeminjaman.computed.days_overdue} hari`
                      : `${selectedPeminjaman.computed.days_until_due} hari lagi`
                  }}
                </p>
              </div>
            </div>

            <!-- Reason -->
            <div class="space-y-3">
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Alasan Peminjaman</p>
                <p class="text-sm text-slate-700">{{ selectedPeminjaman.alasan_peminjaman }}</p>
              </div>
              <div v-if="selectedPeminjaman.keperluan_lainnya" class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Keperluan Lainnya</p>
                <p class="text-sm text-slate-700">{{ selectedPeminjaman.keperluan_lainnya }}</p>
              </div>
              <div v-if="selectedPeminjaman.alasan_ditolak" class="bg-red-50 rounded-lg p-4">
                <p class="text-xs text-red-600 mb-1 font-semibold uppercase tracking-wide">Alasan Ditolak</p>
                <p class="text-sm text-red-700">{{ selectedPeminjaman.alasan_ditolak }}</p>
              </div>
              <div v-if="selectedPeminjaman.catatan_petugas" class="bg-blue-50 rounded-lg p-4">
                <p class="text-xs text-blue-600 mb-1 font-semibold uppercase tracking-wide">Catatan Petugas</p>
                <p class="text-sm text-blue-700">{{ selectedPeminjaman.catatan_petugas }}</p>
              </div>
            </div>

            <!-- Pengembalian Info -->
            <div v-if="selectedPeminjaman.pengembalian" class="bg-slate-50 rounded-xl p-4 space-y-3">
              <h4 class="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <UIcon name="i-lucide-undo-2" class="text-teal-600" />
                Info Pengembalian
              </h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-slate-500">Tanggal Dikembalikan</p>
                  <p class="text-sm font-medium text-slate-800">
                    {{ formatDateTime(selectedPeminjaman.pengembalian.tanggal_kembali_actual) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Kondisi Saat Kembali</p>
                  <p class="text-sm font-medium text-slate-800">
                    {{ selectedPeminjaman.pengembalian.kondisi_alat_saat_kembali }}
                  </p>
                </div>
                <div v-if="selectedPeminjaman.pengembalian.denda > 0">
                  <p class="text-xs text-slate-500">Denda</p>
                  <p class="text-sm font-semibold text-red-600">
                    {{ formatRupiah(selectedPeminjaman.pengembalian.denda) }}
                  </p>
                </div>
                <div v-if="selectedPeminjaman.pengembalian.denda > 0">
                  <p class="text-xs text-slate-500">Status Denda</p>
                  <span
                    :class="[
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      getDendaStatusColor(selectedPeminjaman.pengembalian.status_denda),
                    ]"
                  >
                    {{ getDendaStatusLabel(selectedPeminjaman.pengembalian.status_denda) }}
                  </span>
                </div>
              </div>
              <div v-if="selectedPeminjaman.pengembalian.catatan_pengembalian" class="mt-2">
                <p class="text-xs text-slate-500">Catatan</p>
                <p class="text-sm text-slate-700">{{ selectedPeminjaman.pengembalian.catatan_pengembalian }}</p>
              </div>
            </div>

            <!-- Perpanjangan History -->
            <div v-if="selectedPeminjaman.perpanjangan?.length > 0" class="space-y-3">
              <h4 class="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <UIcon name="i-lucide-calendar-plus" class="text-purple-600" />
                Riwayat Perpanjangan
              </h4>
              <div
                v-for="ext in selectedPeminjaman.perpanjangan"
                :key="ext.id_perpanjangan"
                class="bg-slate-50 rounded-lg p-3 border-l-4"
                :style="{ borderColor: ext.status_perpanjangan === 'DISETUJUI' ? '#10b981' : ext.status_perpanjangan === 'DITOLAK' ? '#ef4444' : '#f59e0b' }"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-slate-500">{{ formatDate(ext.tanggal_pengajuan) }}</span>
                  <span
                    :class="[
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      getPerpanjanganStatusColor(ext.status_perpanjangan),
                    ]"
                  >
                    {{ getPerpanjanganStatusLabel(ext.status_perpanjangan) }}
                  </span>
                </div>
                <p class="text-sm text-slate-700">+{{ ext.durasi_tambahan_hari }} hari — {{ ext.alasan_permintaan }}</p>
                <p v-if="ext.alasan_ditolak_admin" class="text-xs text-red-600 mt-1">
                  Ditolak: {{ ext.alasan_ditolak_admin }}
                </p>
              </div>
            </div>

            <!-- Extension Button -->
            <UButton
              v-if="selectedPeminjaman.computed?.can_request_perpanjangan"
              icon="i-lucide-calendar-plus"
              label="Ajukan Perpanjangan"
              color="primary"
              variant="soft"
              size="lg"
              block
              class="font-semibold"
              @click="openExtensionModal"
            />
          </div>
        </div>
      </template>
    </LazyUModal>

    <!-- Extension Modal (Lazy) -->
    <LazyUModal v-model:open="showExtensionModal">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="font-heading font-bold text-xl text-slate-900">Ajukan Perpanjangan</h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showExtensionModal = false"
            />
          </div>

          <!-- Current Loan Info -->
          <div v-if="selectedPeminjaman" class="bg-purple-50 rounded-lg p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-calendar-plus" class="text-xl text-purple-600" />
            </div>
            <div>
              <p class="font-semibold text-purple-800 text-sm">{{ selectedPeminjaman.alat?.nama_alat }}</p>
              <p class="text-xs text-purple-600">
                Batas kembali: {{ formatDate(selectedPeminjaman.tanggal_harus_kembali) }}
              </p>
            </div>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Durasi Perpanjangan (hari) <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model.number="extensionForm.durasi_tambahan_hari"
                type="number"
                :min="1"
                :max="7"
                placeholder="1-7 hari"
                class="w-full"
              />
              <p class="text-xs text-slate-400 mt-1">Maksimal 7 hari perpanjangan</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Alasan Perpanjangan <span class="text-red-500">*</span>
              </label>
              <UTextarea
                v-model="extensionForm.alasan_permintaan"
                placeholder="Jelaskan mengapa kamu perlu perpanjangan waktu..."
                :rows="3"
                class="w-full"
              />
            </div>
          </div>

          <!-- Info -->
          <div class="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
            <UIcon name="i-lucide-info" class="text-amber-500 text-lg shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700">
              Perpanjangan hanya dapat diajukan maksimal 3 hari sebelum jatuh tempo dan hanya 1x per peminjaman.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton
              label="Batal"
              variant="outline"
              color="neutral"
              class="flex-1"
              @click="showExtensionModal = false"
            />
            <UButton
              label="Kirim Pengajuan"
              icon="i-lucide-send"
              color="primary"
              class="flex-1 font-semibold"
              :loading="isSubmittingExtension"
              :disabled="!extensionForm.alasan_permintaan.trim() || extensionForm.durasi_tambahan_hari < 1"
              @click="submitExtension"
            />
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
