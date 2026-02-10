<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'peminjam',
})

useHead({
  title: 'Katalog Alat - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(true)
const alatList = ref<any[]>([])
const kategoriList = ref<any[]>([])
const searchQuery = ref('')
const selectedKategori = ref<number | null>(null)
const filterTersedia = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 12

// Detail Modal State
const showDetailModal = ref(false)
const selectedAlat = ref<any>(null)
const isLoadingDetail = ref(false)

// Borrowing Modal State
const showBorrowModal = ref(false)
const borrowForm = ref({
  alasan_peminjaman: '',
  keperluan_lainnya: '',
})
const isBorrowing = ref(false)

// Profile for borrow permission check
const profileData = ref<any>(null)

// Fetch profile
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

// Fetch categories for filter
async function fetchKategori() {
  try {
    const response = await $fetch<any>('/api/kategori', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      kategoriList.value = response.data
    }
  } catch (error) {
    console.error('Fetch kategori error:', error)
  }
}

// Fetch equipment list
async function fetchAlat() {
  isLoading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (selectedKategori.value) params.id_kategori = selectedKategori.value
    if (filterTersedia.value) params.tersedia = true

    const response = await $fetch<any>('/api/alat', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      params,
    })
    if (response.success) {
      alatList.value = response.data
      totalPages.value = response.meta?.totalPages || 1
      totalItems.value = response.meta?.total || 0
    }
  } catch (error) {
    console.error('Fetch alat error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat katalog alat.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch detail alat (by ID, sent in body-like approach via API param, not in URL bar)
async function openDetail(alat: any) {
  showDetailModal.value = true
  isLoadingDetail.value = true
  try {
    const response = await $fetch<any>(`/api/alat/${alat.id_alat}`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      selectedAlat.value = response.data
    }
  } catch (error) {
    console.error('Fetch detail error:', error)
    toast.add({
      title: 'Gagal Memuat',
      description: 'Tidak dapat memuat detail alat.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
    showDetailModal.value = false
  } finally {
    isLoadingDetail.value = false
  }
}

// Open borrow modal
function openBorrowModal() {
  borrowForm.value = { alasan_peminjaman: '', keperluan_lainnya: '' }
  showBorrowModal.value = true
}

// Submit borrow request
async function submitBorrow() {
  if (!selectedAlat.value || !borrowForm.value.alasan_peminjaman.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Alasan peminjaman wajib diisi.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
    return
  }

  isBorrowing.value = true
  try {
    const body: any = {
      id_alat: selectedAlat.value.id_alat,
      alasan_peminjaman: borrowForm.value.alasan_peminjaman.trim(),
    }
    if (borrowForm.value.keperluan_lainnya.trim()) {
      body.keperluan_lainnya = borrowForm.value.keperluan_lainnya.trim()
    }

    const response = await $fetch<any>('/api/peminjaman', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
      body,
    })

    if (response.success) {
      toast.add({
        title: 'Berhasil!',
        description: 'Pengajuan peminjaman berhasil dikirim. Menunggu persetujuan petugas.',
        color: 'primary',
        icon: 'i-lucide-check-circle',
      })
      showBorrowModal.value = false
      showDetailModal.value = false
      await fetchAlat()
      await fetchProfile()
    }
  } catch (error: any) {
    const msg = error?.data?.error?.message || 'Gagal mengajukan peminjaman.'
    toast.add({
      title: 'Gagal',
      description: msg,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isBorrowing.value = false
  }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchAlat()
  }, 400)
}

function onFilterChange() {
  currentPage.value = 1
  fetchAlat()
}

function goToPage(page: number) {
  currentPage.value = page
  fetchAlat()
}

// Can user borrow?
const canBorrow = computed(() => {
  if (!profileData.value) return false
  return (
    profileData.value.status_akun === 'AKTIF' &&
    (profileData.value.statistics?.total_denda_belum_bayar || 0) === 0
  )
})

// Helpers
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

function isAvailable(alat: any) {
  return alat.stok > 0 && ['BAIK', 'RUSAK_RINGAN'].includes(alat.kondisi)
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

onMounted(async () => {
  await Promise.all([fetchKategori(), fetchProfile()])
  await fetchAlat()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Katalog Alat</h1>
        <p class="text-slate-500 text-sm mt-1">Telusuri dan temukan alat yang kamu butuhkan</p>
      </div>
      <div class="text-sm text-slate-500">
        {{ totalItems }} alat ditemukan
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Cari nama alat, kode, atau spesifikasi..."
            icon="i-lucide-search"
            size="lg"
            @input="onSearch"
            class="w-full"
          />
        </div>
        <!-- Category Filter -->
        <div class="w-full md:w-56">
          <USelect
            v-model="selectedKategori"
            :items="[
              { label: 'Semua Kategori', value: null },
              ...kategoriList.map((k: any) => ({ label: k.nama_kategori, value: k.id_kategori })),
            ]"
            placeholder="Pilih Kategori"
            size="lg"
            @update:modelValue="onFilterChange"
          />
        </div>
        <!-- Available Only Toggle -->
        <div class="flex items-center gap-2">
          <USwitch
            v-model="filterTersedia"
            @update:modelValue="onFilterChange"
          />
          <span class="text-sm text-slate-600 whitespace-nowrap">Tersedia saja</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="bg-white rounded-xl shadow-md animate-pulse overflow-hidden">
        <div class="h-48 bg-slate-200"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
          <div class="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="alatList.length === 0"
      message="Tidak ada alat yang ditemukan"
      icon="i-lucide-search-x"
    />

    <!-- Equipment Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="alat in alatList"
        :key="alat.id_alat"
        class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-200 group cursor-pointer"
        @click="openDetail(alat)"
      >
        <!-- Image -->
        <div class="relative h-48 bg-slate-100 overflow-hidden">
          <img
            v-if="alat.gambar"
            :src="alat.gambar"
            :alt="alat.nama_alat"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-package" class="text-5xl text-slate-300" />
          </div>
          <!-- Availability Badge -->
          <div class="absolute top-3 right-3">
            <span
              :class="[
                'text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm',
                isAvailable(alat)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white',
              ]"
            >
              {{ isAvailable(alat) ? 'Tersedia' : 'Tidak Tersedia' }}
            </span>
          </div>
          <!-- Stock Badge -->
          <div class="absolute top-3 left-3">
            <span class="text-xs font-medium px-2 py-1 bg-white/90 text-slate-700 rounded-full shadow-sm">
              Stok: {{ alat.stok }}
            </span>
          </div>
        </div>
        <!-- Info -->
        <div class="p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">
              {{ alat.nama_alat }}
            </h3>
          </div>
          <p class="text-xs text-slate-500 mb-2">{{ alat.kode_alat }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
              {{ alat.kategori?.nama_kategori }}
            </span>
            <span
              :class="[
                'inline-block text-xs font-medium px-2 py-0.5 rounded-md whitespace-normal break-words max-w-[65px]',
                getKondisiColor(alat.kondisi),
              ]"
            >
              {{ getKondisiLabel(alat.kondisi) }}
            </span>
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

    <!-- Detail Modal (Lazy loaded) -->
    <LazyUModal v-model:open="showDetailModal">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <!-- Loading -->
          <div v-if="isLoadingDetail" class="flex items-center justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="text-4xl text-teal-600 animate-spin" />
          </div>

          <div v-else-if="selectedAlat" class="space-y-6">
            <!-- Close -->
            <div class="flex items-center justify-between">
              <h2 class="font-heading font-bold text-xl text-slate-900">Detail Alat</h2>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showDetailModal = false"
              />
            </div>

            <!-- Image -->
            <div class="rounded-xl overflow-hidden bg-slate-100">
              <img
                v-if="selectedAlat.gambar"
                :src="selectedAlat.gambar"
                :alt="selectedAlat.nama_alat"
                class="w-full max-h-80 object-contain bg-white"
              />
              <div v-else class="w-full h-64 flex items-center justify-center">
                <UIcon name="i-lucide-package" class="text-6xl text-slate-300" />
              </div>
            </div>

            <!-- Info Grid -->
            <div class="space-y-4">
              <div>
                <h3 class="font-heading font-bold text-lg text-slate-900">
                  {{ selectedAlat.nama_alat }}
                </h3>
                <p class="text-sm text-slate-500">{{ selectedAlat.kode_alat }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 mb-1">Kategori</p>
                  <p class="text-sm font-semibold text-slate-800">
                    {{ selectedAlat.kategori?.nama_kategori }}
                  </p>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 mb-1">Kondisi</p>
                  <span
                    :class="[
                      'inline-block text-xs font-semibold px-2 py-0.5 rounded-md whitespace-normal break-words max-w-[65px]',
                      getKondisiColor(selectedAlat.kondisi),
                    ]"
                  >
                    {{ getKondisiLabel(selectedAlat.kondisi) }}
                  </span>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 mb-1">Stok Tersedia</p>
                  <p class="text-sm font-semibold text-slate-800">
                    {{ selectedAlat.stok }} unit
                  </p>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 mb-1">Harga Penggantian</p>
                  <p class="text-sm font-semibold text-slate-800">
                    {{ formatRupiah(selectedAlat.harga || 0) }}
                  </p>
                </div>
              </div>

              <!-- Spesifikasi -->
              <div v-if="selectedAlat.spesifikasi" class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Spesifikasi</p>
                <p class="text-sm text-slate-700 whitespace-pre-line">
                  {{ selectedAlat.spesifikasi }}
                </p>
              </div>

              <!-- Statistics -->
              <div v-if="selectedAlat.statistics" class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <UIcon name="i-lucide-bar-chart-3" class="text-teal-500" />
                  <span>{{ selectedAlat.statistics.total_peminjaman }}x dipinjam</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <UIcon name="i-lucide-clock" class="text-blue-500" />
                  <span>{{ selectedAlat.statistics.peminjaman_aktif }} sedang dipinjam</span>
                </div>
              </div>

              <!-- Availability Status -->
              <div
                :class="[
                  'rounded-lg p-4 flex items-center gap-3',
                  isAvailable(selectedAlat)
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200',
                ]"
              >
                <UIcon
                  :name="isAvailable(selectedAlat) ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                  :class="isAvailable(selectedAlat) ? 'text-emerald-600 text-xl' : 'text-red-600 text-xl'"
                />
                <div>
                  <p :class="isAvailable(selectedAlat) ? 'text-emerald-700 font-semibold text-sm' : 'text-red-700 font-semibold text-sm'">
                    {{ isAvailable(selectedAlat) ? 'Alat Tersedia untuk Dipinjam' : 'Alat Tidak Tersedia' }}
                  </p>
                  <p :class="isAvailable(selectedAlat) ? 'text-emerald-600 text-xs' : 'text-red-600 text-xs'">
                    {{
                      isAvailable(selectedAlat)
                        ? `${selectedAlat.stok} unit tersedia`
                        : selectedAlat.stok <= 0
                          ? 'Stok habis'
                          : 'Kondisi alat tidak memungkinkan'
                    }}
                  </p>
                </div>
              </div>

              <!-- Borrow Button (hidden if blocked or has fines) -->
              <UButton
                v-if="canBorrow && isAvailable(selectedAlat)"
                icon="i-lucide-hand-helping"
                label="Ajukan Peminjaman"
                color="primary"
                size="lg"
                block
                class="font-semibold"
                @click="openBorrowModal"
              />
            </div>
          </div>
        </div>
      </template>
    </LazyUModal>

    <!-- Borrow Form Modal (Lazy loaded) -->
    <LazyUModal v-model:open="showBorrowModal">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="font-heading font-bold text-xl text-slate-900">Ajukan Peminjaman</h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showBorrowModal = false"
            />
          </div>

          <!-- Selected Equipment Info -->
          <div v-if="selectedAlat" class="bg-teal-50 rounded-lg p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-package" class="text-xl text-teal-600" />
            </div>
            <div>
              <p class="font-semibold text-teal-800 text-sm">{{ selectedAlat.nama_alat }}</p>
              <p class="text-xs text-teal-600">{{ selectedAlat.kode_alat }}</p>
            </div>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Alasan Peminjaman <span class="text-red-500">*</span>
              </label>
              <UTextarea
                v-model="borrowForm.alasan_peminjaman"
                placeholder="Jelaskan alasan kamu meminjam alat ini..."
                :rows="3"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Keperluan Lainnya <span class="text-slate-400">(opsional)</span>
              </label>
              <UTextarea
                v-model="borrowForm.keperluan_lainnya"
                placeholder="Keterangan tambahan jika ada..."
                :rows="2"
                class="w-full"
              />
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
            <UIcon name="i-lucide-info" class="text-blue-500 text-lg shrink-0 mt-0.5" />
            <p class="text-xs text-blue-700">
              Pengajuan akan ditinjau oleh petugas. Anda akan mendapat notifikasi setelah disetujui atau ditolak.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton
              label="Batal"
              variant="outline"
              color="neutral"
              class="flex-1"
              @click="showBorrowModal = false"
            />
            <UButton
              label="Kirim Pengajuan"
              icon="i-lucide-send"
              color="primary"
              class="flex-1 font-semibold"
              :loading="isBorrowing"
              :disabled="!borrowForm.alasan_peminjaman.trim()"
              @click="submitBorrow"
            />
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
