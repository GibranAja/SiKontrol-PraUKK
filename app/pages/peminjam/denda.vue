<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'peminjam',
})

useHead({
  title: 'Denda & Riwayat - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(true)
const pengembalianList = ref<any[]>([])
const profileData = ref<any>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

// Detail Modal
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

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

async function fetchPengembalian() {
  isLoading.value = true
  try {
    const response = await $fetch<any>('/api/pengembalian', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      params: {
        page: currentPage.value,
        limit,
      },
    })
    if (response.success) {
      pengembalianList.value = response.data
      totalPages.value = response.meta?.totalPages || 1
      totalItems.value = response.meta?.total || 0
    }
  } catch (error) {
    console.error('Fetch pengembalian error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat data pengembalian.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isLoading.value = false
  }
}

function openDetail(item: any) {
  selectedItem.value = item
  showDetailModal.value = true
}

function goToPage(page: number) {
  currentPage.value = page
  fetchPengembalian()
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

function getDendaStatusIcon(status: string) {
  const icons: Record<string, string> = {
    BELUM_BAYAR: 'i-lucide-alert-circle',
    LUNAS: 'i-lucide-check-circle',
    DICICIL: 'i-lucide-clock',
    WAIVED: 'i-lucide-badge-check',
  }
  return icons[status] || 'i-lucide-circle'
}

function getKondisiColor(kondisi: string) {
  const colors: Record<string, string> = {
    BAIK: 'bg-emerald-100 text-emerald-700',
    RUSAK_RINGAN: 'bg-amber-100 text-amber-700',
    RUSAK_BERAT: 'bg-red-100 text-red-700',
    HILANG: 'bg-slate-100 text-slate-600',
    PERBAIKAN: 'bg-blue-100 text-blue-700',
  }
  return colors[kondisi] || 'bg-slate-100 text-slate-600'
}

function getKondisiLabel(kondisi: string) {
  const labels: Record<string, string> = {
    BAIK: 'Baik',
    RUSAK_RINGAN: 'Rusak Ringan',
    RUSAK_BERAT: 'Rusak Berat',
    HILANG: 'Hilang',
    PERBAIKAN: 'Perbaikan',
  }
  return labels[kondisi] || kondisi
}

function isLate(item: any) {
  if (!item.peminjaman?.tanggal_harus_kembali || !item.tanggal_kembali_actual) return false
  return new Date(item.tanggal_kembali_actual) > new Date(item.peminjaman.tanggal_harus_kembali)
}

function getDaysLate(item: any) {
  if (!isLate(item)) return 0
  const due = new Date(item.peminjaman.tanggal_harus_kembali)
  const actual = new Date(item.tanggal_kembali_actual)
  return Math.ceil((actual.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

// Computed
const totalDenda = computed(() => {
  return profileData.value?.statistics?.total_denda_belum_bayar || 0
})

const hasUnpaidFines = computed(() => totalDenda.value > 0)

const itemsWithDenda = computed(() => {
  return pengembalianList.value.filter(item => item.denda > 0)
})

const itemsWithoutDenda = computed(() => {
  return pengembalianList.value.filter(item => item.denda === 0)
})

onMounted(async () => {
  await fetchProfile()
  await fetchPengembalian()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Denda & Riwayat Pengembalian</h1>
      <p class="text-slate-500 text-sm mt-1">Pantau denda dan riwayat pengembalian alat</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Total Denda Belum Bayar -->
      <div
        :class="[
          'rounded-xl p-6 shadow-md border transition-all duration-200',
          hasUnpaidFines
            ? 'bg-red-50 border-red-200'
            : 'bg-emerald-50 border-emerald-200',
        ]"
      >
        <div class="flex items-center gap-3 mb-3">
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              hasUnpaidFines ? 'bg-red-100' : 'bg-emerald-100',
            ]"
          >
            <UIcon
              :name="hasUnpaidFines ? 'i-lucide-alert-triangle' : 'i-lucide-check-circle'"
              :class="hasUnpaidFines ? 'text-2xl text-red-600' : 'text-2xl text-emerald-600'"
            />
          </div>
          <div>
            <p :class="hasUnpaidFines ? 'text-xs text-red-600' : 'text-xs text-emerald-600'">
              Total Denda Belum Lunas
            </p>
            <p
              :class="[
                'text-2xl font-heading font-bold',
                hasUnpaidFines ? 'text-red-700' : 'text-emerald-700',
              ]"
            >
              {{ formatRupiah(totalDenda) }}
            </p>
          </div>
        </div>
        <p :class="hasUnpaidFines ? 'text-xs text-red-600' : 'text-xs text-emerald-600'">
          {{ hasUnpaidFines ? 'Segera lunasi denda untuk bisa meminjam kembali' : 'Tidak ada denda yang belum lunas' }}
        </p>
      </div>

      <!-- Total Pengembalian -->
      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-undo-2" class="text-2xl text-teal-600" />
          </div>
          <div>
            <p class="text-xs text-slate-500">Total Pengembalian</p>
            <p class="text-2xl font-heading font-bold text-slate-900">
              {{ totalItems }}
            </p>
          </div>
        </div>
        <p class="text-xs text-slate-500">Semua riwayat pengembalian alat</p>
      </div>

      <!-- Status Akun -->
      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center gap-3 mb-3">
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              profileData?.status_akun === 'AKTIF' ? 'bg-emerald-100' : 'bg-red-100',
            ]"
          >
            <UIcon
              :name="profileData?.status_akun === 'AKTIF' ? 'i-lucide-shield-check' : 'i-lucide-shield-x'"
              :class="profileData?.status_akun === 'AKTIF' ? 'text-2xl text-emerald-600' : 'text-2xl text-red-600'"
            />
          </div>
          <div>
            <p class="text-xs text-slate-500">Status Akun</p>
            <p
              :class="[
                'text-lg font-heading font-bold',
                profileData?.status_akun === 'AKTIF' ? 'text-emerald-700' : 'text-red-700',
              ]"
            >
              {{ profileData?.status_akun === 'AKTIF' ? 'Aktif' : profileData?.status_akun === 'DIBLOKIR' ? 'Diblokir' : 'Nonaktif' }}
            </p>
          </div>
        </div>
        <p class="text-xs text-slate-500">
          {{
            profileData?.status_akun === 'AKTIF'
              ? hasUnpaidFines ? 'Aktif tapi tidak bisa pinjam (ada denda)' : 'Bisa mengajukan peminjaman'
              : 'Tidak bisa mengajukan peminjaman'
          }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingState v-if="isLoading" message="Memuat riwayat pengembalian..." />

    <!-- Empty -->
    <EmptyState
      v-else-if="pengembalianList.length === 0"
      message="Belum ada riwayat pengembalian"
      icon="i-lucide-receipt"
    />

    <!-- Return List -->
    <div v-else class="space-y-4">
      <div
        v-for="item in pengembalianList"
        :key="item.id_pengembalian"
        class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
        @click="openDetail(item)"
      >
        <!-- Denda indicator bar -->
        <div
          v-if="item.denda > 0"
          class="h-1"
          :style="{ backgroundColor: item.status_denda === 'LUNAS' || item.status_denda === 'WAIVED' ? '#10b981' : '#ef4444' }"
        ></div>

        <div class="p-5">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Icon -->
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                item.denda > 0 && item.status_denda === 'BELUM_BAYAR'
                  ? 'bg-red-100'
                  : 'bg-teal-100',
              ]"
            >
              <UIcon
                :name="item.denda > 0 && item.status_denda === 'BELUM_BAYAR' ? 'i-lucide-banknote' : 'i-lucide-undo-2'"
                :class="item.denda > 0 && item.status_denda === 'BELUM_BAYAR' ? 'text-xl text-red-600' : 'text-xl text-teal-600'"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-900 text-sm truncate">
                {{ item.peminjaman?.alat?.nama_alat }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ item.peminjaman?.kode_peminjaman }}
              </p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-slate-400">
                  Dikembalikan: {{ formatDate(item.tanggal_kembali_actual) }}
                </span>
                <span
                  v-if="isLate(item)"
                  class="text-xs text-red-600 font-medium"
                >
                  (Terlambat {{ getDaysLate(item) }} hari)
                </span>
              </div>
            </div>

            <!-- Kondisi & Denda -->
            <div class="flex items-center gap-3 shrink-0">
              <span
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  getKondisiColor(item.kondisi_alat_saat_kembali),
                ]"
              >
                {{ getKondisiLabel(item.kondisi_alat_saat_kembali) }}
              </span>

              <div v-if="item.denda > 0" class="text-right">
                <p class="text-sm font-bold text-red-600">{{ formatRupiah(item.denda) }}</p>
                <span
                  :class="[
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    getDendaStatusColor(item.status_denda),
                  ]"
                >
                  {{ getDendaStatusLabel(item.status_denda) }}
                </span>
              </div>
              <div v-else>
                <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tanpa Denda
                </span>
              </div>

              <UIcon name="i-lucide-chevron-right" class="text-slate-400" />
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

    <!-- Detail Modal (Lazy) -->
    <LazyUModal v-model:open="showDetailModal">
      <template #content>
        <div v-if="selectedItem" class="p-6 space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="font-heading font-bold text-xl text-slate-900">Detail Pengembalian</h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showDetailModal = false"
            />
          </div>

          <!-- Equipment -->
          <div class="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
            <div class="w-14 h-14 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
              <UIcon name="i-lucide-package" class="text-2xl text-teal-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">{{ selectedItem.peminjaman?.alat?.nama_alat }}</h3>
              <p class="text-xs text-slate-500">{{ selectedItem.peminjaman?.alat?.kode_alat }}</p>
              <p class="text-xs text-slate-400">Kode: {{ selectedItem.peminjaman?.kode_peminjaman }}</p>
            </div>
          </div>

          <!-- Timeline -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <p class="text-xs text-blue-600 mb-1">Tanggal Pinjam</p>
              <p class="text-sm font-semibold text-blue-800">
                {{ formatDate(selectedItem.peminjaman?.tanggal_pinjam) }}
              </p>
            </div>
            <div class="bg-amber-50 rounded-lg p-3 text-center">
              <p class="text-xs text-amber-600 mb-1">Batas Kembali</p>
              <p class="text-sm font-semibold text-amber-800">
                {{ formatDate(selectedItem.peminjaman?.tanggal_harus_kembali) }}
              </p>
            </div>
            <div
              :class="[
                'rounded-lg p-3 text-center',
                isLate(selectedItem) ? 'bg-red-50' : 'bg-emerald-50',
              ]"
            >
              <p :class="isLate(selectedItem) ? 'text-xs text-red-600 mb-1' : 'text-xs text-emerald-600 mb-1'">
                Dikembalikan
              </p>
              <p :class="isLate(selectedItem) ? 'text-sm font-semibold text-red-800' : 'text-sm font-semibold text-emerald-800'">
                {{ formatDate(selectedItem.tanggal_kembali_actual) }}
              </p>
              <p v-if="isLate(selectedItem)" class="text-xs text-red-600 mt-0.5">
                Terlambat {{ getDaysLate(selectedItem) }} hari
              </p>
            </div>
          </div>

          <!-- Kondisi -->
          <div class="bg-slate-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-500 mb-1">Kondisi Alat Saat Kembali</p>
                <span
                  :class="[
                    'text-sm font-semibold px-3 py-1 rounded-full',
                    getKondisiColor(selectedItem.kondisi_alat_saat_kembali),
                  ]"
                >
                  {{ getKondisiLabel(selectedItem.kondisi_alat_saat_kembali) }}
                </span>
              </div>
              <div v-if="selectedItem.verifikator" class="text-right">
                <p class="text-xs text-slate-500 mb-1">Diverifikasi Oleh</p>
                <p class="text-sm font-medium text-slate-800">{{ selectedItem.verifikator?.nama_lengkap }}</p>
              </div>
            </div>
          </div>

          <!-- Denda Info -->
          <div
            v-if="selectedItem.denda > 0"
            :class="[
              'rounded-xl p-4 border',
              selectedItem.status_denda === 'BELUM_BAYAR'
                ? 'bg-red-50 border-red-200'
                : selectedItem.status_denda === 'LUNAS'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200',
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="getDendaStatusIcon(selectedItem.status_denda)"
                  :class="[
                    'text-2xl',
                    selectedItem.status_denda === 'BELUM_BAYAR' ? 'text-red-600' :
                    selectedItem.status_denda === 'LUNAS' ? 'text-emerald-600' : 'text-amber-600',
                  ]"
                />
                <div>
                  <p class="text-sm font-semibold text-slate-800">Denda</p>
                  <p class="text-2xl font-heading font-bold text-slate-900">
                    {{ formatRupiah(selectedItem.denda) }}
                  </p>
                </div>
              </div>
              <span
                :class="[
                  'text-sm font-semibold px-3 py-1.5 rounded-full',
                  getDendaStatusColor(selectedItem.status_denda),
                ]"
              >
                {{ getDendaStatusLabel(selectedItem.status_denda) }}
              </span>
            </div>
          </div>

          <!-- No Denda -->
          <div
            v-else
            class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
          >
            <UIcon name="i-lucide-check-circle" class="text-emerald-600 text-xl" />
            <p class="text-sm font-medium text-emerald-700">Tidak ada denda untuk pengembalian ini</p>
          </div>

          <!-- Catatan -->
          <div v-if="selectedItem.catatan_pengembalian" class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Catatan Pengembalian</p>
            <p class="text-sm text-slate-700">{{ selectedItem.catatan_pengembalian }}</p>
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
