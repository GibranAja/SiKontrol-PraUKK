<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Katalog Alat - SiKontrol',
})

const authStore = useAuthStore()
const isLoading = ref(false)
const equipment = ref<any[]>([])
const categories = ref<any[]>([])
const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
})

// Filters
const search = ref('')
const kategoriFilter = ref<string | undefined>(undefined)
const kondisiFilter = ref<string | undefined>(undefined)

// Detail modal
const isDetailModalOpen = ref(false)
const selectedEquipment = ref<any>(null)
const detailData = ref<any>(null)
const isDetailLoading = ref(false)

const kondisiOptions = [
  { label: 'Baik', value: 'BAIK' },
  { label: 'Rusak Ringan', value: 'RUSAK_RINGAN' },
  { label: 'Rusak Berat', value: 'RUSAK_BERAT' },
  { label: 'Hilang', value: 'HILANG' },
  { label: 'Perbaikan', value: 'PERBAIKAN' },
]

// Fetch categories
async function fetchCategories() {
  try {
    const response = await $fetch('/api/kategori', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      categories.value = response.data.map((cat: any) => ({
        label: cat.nama_kategori,
        value: cat.id_kategori,
      }))
    }
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

// Fetch equipment
async function fetchEquipment() {
  isLoading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }
    if (search.value) params.search = search.value
    if (kategoriFilter.value && kategoriFilter.value !== 'ALL') params.id_kategori = kategoriFilter.value
    if (kondisiFilter.value && kondisiFilter.value !== 'ALL') params.kondisi = kondisiFilter.value

    const response = await $fetch('/api/alat', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      equipment.value = response.data
      if (response.meta) {
        pagination.value = {
          page: response.meta.page || 1,
          limit: response.meta.limit || 12,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch equipment error:', error)
  } finally {
    isLoading.value = false
  }
}

// View detail
async function openDetail(item: any) {
  selectedEquipment.value = item
  isDetailModalOpen.value = true
  isDetailLoading.value = true
  try {
    const response = await $fetch(`/api/alat/${item.id_alat}`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) {
      detailData.value = response.data
    }
  } catch (error) {
    console.error('Fetch detail error:', error)
  } finally {
    isDetailLoading.value = false
  }
}

function getConditionColor(kondisi: string) {
  switch (kondisi) {
    case 'BAIK': return 'bg-green-100 text-green-700'
    case 'RUSAK_RINGAN': return 'bg-yellow-100 text-yellow-700'
    case 'RUSAK_BERAT': return 'bg-orange-100 text-orange-700'
    case 'HILANG': return 'bg-red-100 text-red-700'
    case 'PERBAIKAN': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatKondisi(kondisi: string) {
  return kondisi.replace(/_/g, ' ')
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

// Watchers
watch([search, kategoriFilter, kondisiFilter], () => {
  pagination.value.page = 1
  fetchEquipment()
})

watch(() => pagination.value.page, fetchEquipment)

onMounted(() => {
  fetchCategories()
  fetchEquipment()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Katalog Alat</h1>
      <p class="text-slate-600 mt-1">Lihat daftar dan detail alat yang tersedia</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UInput
          v-model="search"
          placeholder="Cari nama, kode alat..."
          icon="i-lucide-search"
          size="lg"
        />
        <USelect
          v-model="kategoriFilter"
          :items="[{ label: 'Semua Kategori', value: 'ALL' }, ...categories]"
          placeholder="Filter Kategori"
          size="lg"
        />
        <USelect
          v-model="kondisiFilter"
          :items="[{ label: 'Semua Kondisi', value: 'ALL' }, ...kondisiOptions]"
          placeholder="Filter Kondisi"
          size="lg"
        />
        <UButton variant="outline" icon="i-lucide-refresh-cw" @click="fetchEquipment" size="lg" class="font-semibold">
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="bg-white rounded-xl p-4 shadow-md animate-pulse">
        <div class="h-48 bg-slate-200 rounded-lg mb-4"></div>
        <div class="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="equipment.length === 0" class="bg-white rounded-xl p-12 shadow-md border border-slate-100 text-center">
      <EmptyState message="Tidak ada alat ditemukan" icon="i-lucide-package" />
    </div>

    <!-- Equipment Grid (view only for petugas) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in equipment"
        :key="item.id_alat"
        class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100 overflow-hidden group cursor-pointer"
        @click="openDetail(item)"
      >
        <!-- Equipment Image -->
        <div class="relative h-48 bg-slate-100 overflow-hidden">
          <img
            v-if="item.gambar"
            :src="item.gambar"
            :alt="item.nama_alat"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-package" class="text-6xl text-slate-300" />
          </div>

          <!-- Stock Badge -->
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span class="text-xs font-bold text-slate-700">Stok: {{ item.stok }}</span>
          </div>
        </div>

        <!-- Equipment Info -->
        <div class="p-4">
          <div class="mb-3">
            <h3 class="font-heading font-bold text-slate-900 mb-1 line-clamp-1">{{ item.nama_alat }}</h3>
            <p class="text-xs text-slate-500 font-mono">{{ item.kode_alat }}</p>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
              {{ item.kategori?.nama_kategori }}
            </span>
            <span :class="['px-2 py-1 rounded-md text-xs font-semibold', getConditionColor(item.kondisi)]">
              {{ formatKondisi(item.kondisi) }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-teal-600">{{ formatRupiah(item.harga || 0) }}</span>
            <UButton size="xs" variant="soft" color="primary" icon="i-lucide-eye">Detail</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="bg-white rounded-xl p-4 shadow-md border border-slate-100 flex items-center justify-between">
      <p class="text-sm text-slate-600">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }} ({{ pagination.total }} total)
      </p>
      <div class="flex items-center space-x-2">
        <UButton icon="i-lucide-chevron-left" size="sm" variant="outline" :disabled="pagination.page === 1" @click="pagination.page--" />
        <UButton icon="i-lucide-chevron-right" size="sm" variant="outline" :disabled="pagination.page === pagination.totalPages" @click="pagination.page++" />
      </div>
    </div>

    <!-- Detail Modal (Lazy) -->
    <LazyUModal v-model:open="isDetailModalOpen">
      <template #content>
        <div class="w-full max-w-2xl mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-package" class="text-xl text-teal-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Detail Alat</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedEquipment?.nama_alat }}</p>
            </div>
          </div>

          <div v-if="isDetailLoading" class="p-6">
            <LoadingState />
          </div>

          <div v-else-if="detailData" class="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
            <!-- Image -->
            <div v-if="detailData.gambar" class="h-56 bg-slate-100 rounded-xl overflow-hidden">
              <img :src="detailData.gambar" :alt="detailData.nama_alat" class="w-full h-full object-contain" />
            </div>

            <!-- Info grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Kode Alat</p>
                <p class="font-semibold text-slate-900 font-mono">{{ detailData.kode_alat }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Kategori</p>
                <p class="font-semibold text-slate-900">{{ detailData.kategori?.nama_kategori }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Stok</p>
                <p class="font-semibold text-slate-900">{{ detailData.stok }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Kondisi</p>
                <span :class="['px-2 py-1 rounded-md text-xs font-semibold', getConditionColor(detailData.kondisi)]">
                  {{ formatKondisi(detailData.kondisi) }}
                </span>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Harga</p>
                <p class="font-semibold text-slate-900">{{ formatRupiah(detailData.harga || 0) }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Peminjaman Aktif</p>
                <p class="font-semibold text-slate-900">{{ detailData.statistics?.peminjaman_aktif || 0 }}</p>
              </div>
            </div>

            <!-- Spesifikasi -->
            <div v-if="detailData.spesifikasi" class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">Spesifikasi</p>
              <p class="text-sm text-slate-700 whitespace-pre-line">{{ detailData.spesifikasi }}</p>
            </div>

            <!-- Recent loans -->
            <div v-if="detailData.recent_peminjaman?.length" class="space-y-2">
              <h4 class="font-heading font-bold text-sm text-slate-900">Riwayat Peminjaman Terakhir</h4>
              <div v-for="p in detailData.recent_peminjaman" :key="p.id_peminjaman"
                class="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ p.user?.nama_lengkap }}</p>
                  <p class="text-xs text-slate-500">{{ p.kode_peminjaman }}</p>
                </div>
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold',
                  p.status_peminjaman === 'DIPINJAM' ? 'bg-blue-100 text-blue-700' :
                  p.status_peminjaman === 'DIKEMBALIKAN' ? 'bg-green-100 text-green-700' :
                  p.status_peminjaman === 'MENUNGGU_PERSETUJUAN' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                ]">
                  {{ p.status_peminjaman.replace(/_/g, ' ') }}
                </span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50">
            <UButton variant="outline" @click="isDetailModalOpen = false">Tutup</UButton>
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
