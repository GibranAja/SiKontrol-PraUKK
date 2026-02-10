<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Manajemen Peminjaman - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const peminjaman = ref<any[]>([])
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

// Filters
const search = ref('')
const statusFilter = ref<string | undefined>(undefined)

const statusOptions = [
  { label: 'Menunggu Persetujuan', value: 'MENUNGGU_PERSETUJUAN' },
  { label: 'Dipinjam', value: 'DIPINJAM' },
  { label: 'Dikembalikan', value: 'DIKEMBALIKAN' },
  { label: 'Ditolak', value: 'DITOLAK' },
]

// Modal states
const isDetailModalOpen = ref(false)
const isVerifyModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const selectedItem = ref<any>(null)
const detailData = ref<any>(null)
const isDetailLoading = ref(false)

// Verify form
const verifyForm = reactive({
  durasi_pinjam_hari: 7,
  catatan_petugas: '',
})

// Reject form
const rejectForm = reactive({
  alasan_ditolak: '',
  catatan_petugas: '',
})

// Fetch peminjaman
async function fetchPeminjaman() {
  isLoading.value = true
  try {
    const params: any = { page: pagination.value.page, limit: pagination.value.limit }
    if (search.value) params.search = search.value
    if (statusFilter.value && statusFilter.value !== 'ALL') params.status = statusFilter.value

    const response = await $fetch('/api/peminjaman', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      peminjaman.value = response.data
      if (response.meta) {
        pagination.value = {
          page: response.meta.page || 1,
          limit: response.meta.limit || 10,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch peminjaman error:', error)
  } finally {
    isLoading.value = false
  }
}

// View detail (no id in url)
async function openDetail(item: any) {
  selectedItem.value = item
  isDetailModalOpen.value = true
  isDetailLoading.value = true
  try {
    const response = await $fetch(`/api/peminjaman/${item.id_peminjaman}`, {
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

// Open approve modal
function openVerifyModal(item: any) {
  selectedItem.value = item
  verifyForm.durasi_pinjam_hari = 7
  verifyForm.catatan_petugas = ''
  isVerifyModalOpen.value = true
}

// Open reject modal
function openRejectModal(item: any) {
  selectedItem.value = item
  rejectForm.alasan_ditolak = ''
  rejectForm.catatan_petugas = ''
  isRejectModalOpen.value = true
}

// Approve
async function handleApprove() {
  if (!selectedItem.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/peminjaman/${selectedItem.value.id_peminjaman}/verify`, {
      method: 'POST',
      body: {
        action: 'DISETUJUI',
        durasi_pinjam_hari: verifyForm.durasi_pinjam_hari,
        catatan_petugas: verifyForm.catatan_petugas || undefined,
      },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Peminjaman berhasil disetujui', color: 'success' })
      isVerifyModalOpen.value = false
      selectedItem.value = null
      await fetchPeminjaman()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Reject
async function handleReject() {
  if (!selectedItem.value || !rejectForm.alasan_ditolak) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/peminjaman/${selectedItem.value.id_peminjaman}/verify`, {
      method: 'POST',
      body: {
        action: 'DITOLAK',
        alasan_ditolak: rejectForm.alasan_ditolak,
        catatan_petugas: rejectForm.catatan_petugas || undefined,
      },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Peminjaman ditolak', color: 'success' })
      isRejectModalOpen.value = false
      selectedItem.value = null
      await fetchPeminjaman()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'MENUNGGU_PERSETUJUAN': return 'bg-orange-100 text-orange-700'
    case 'DIPINJAM': return 'bg-blue-100 text-blue-700'
    case 'DIKEMBALIKAN': return 'bg-green-100 text-green-700'
    case 'DITOLAK': return 'bg-red-100 text-red-700'
    case 'DISETUJUI': return 'bg-teal-100 text-teal-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
    DIPINJAM: 'Sedang Dipinjam',
    DIKEMBALIKAN: 'Dikembalikan',
    DITOLAK: 'Ditolak',
    DISETUJUI: 'Disetujui',
  }
  return map[status] || status
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}

watch([search, statusFilter], () => {
  pagination.value.page = 1
  fetchPeminjaman()
})

watch(() => pagination.value.page, fetchPeminjaman)

onMounted(() => fetchPeminjaman())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Manajemen Peminjaman</h1>
      <p class="text-slate-600 mt-1">Verifikasi dan kelola pengajuan peminjaman alat</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UInput v-model="search" placeholder="Cari kode, nama alat, peminjam..." icon="i-lucide-search" size="lg" />
        <USelect
          v-model="statusFilter"
          :items="[{ label: 'Semua Status', value: 'ALL' }, ...statusOptions]"
          placeholder="Filter Status"
          size="lg"
        />
        <UButton variant="outline" icon="i-lucide-refresh-cw" @click="fetchPeminjaman" size="lg" class="font-semibold">
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Peminjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Alat</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tgl Pengajuan</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <tr v-else-if="peminjaman.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-hand-helping" class="text-5xl text-slate-300 mx-auto mb-3" />
                <p class="text-slate-500">Tidak ada data peminjaman</p>
              </td>
            </tr>
            <tr v-else v-for="item in peminjaman" :key="item.id_peminjaman" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <span class="text-sm font-mono font-semibold text-slate-900">{{ item.kode_peminjaman }}</span>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.user?.nama_lengkap }}</p>
                  <p class="text-xs text-slate-500">{{ item.user?.kelas }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.alat?.nama_alat }}</p>
                  <p class="text-xs text-slate-500 font-mono">{{ item.alat?.kode_alat }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ formatDate(item.tanggal_pengajuan) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span :class="['px-3 py-1 rounded-full text-xs font-semibold w-fit', getStatusColor(item.status_peminjaman)]">
                    {{ formatStatus(item.status_peminjaman) }}
                  </span>
                  <span v-if="item.is_overdue" class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white w-fit">
                    OVERDUE
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <UButton icon="i-lucide-eye" size="sm" color="primary" variant="soft" @click="openDetail(item)" title="Detail" />
                  <template v-if="item.status_peminjaman === 'MENUNGGU_PERSETUJUAN'">
                    <UButton icon="i-lucide-check" size="sm" color="success" variant="soft" @click="openVerifyModal(item)" title="Setujui" />
                    <UButton icon="i-lucide-x" size="sm" color="error" variant="soft" @click="openRejectModal(item)" title="Tolak" />
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <p class="text-sm text-slate-600">Halaman {{ pagination.page }} dari {{ pagination.totalPages }} ({{ pagination.total }} total)</p>
        <div class="flex items-center space-x-2">
          <UButton icon="i-lucide-chevron-left" size="sm" variant="outline" :disabled="pagination.page === 1" @click="pagination.page--" />
          <UButton icon="i-lucide-chevron-right" size="sm" variant="outline" :disabled="pagination.page === pagination.totalPages" @click="pagination.page++" />
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <LazyUModal v-model:open="isDetailModalOpen">
      <template #content>
        <div class="w-full max-w-2xl mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-hand-helping" class="text-xl text-teal-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Detail Peminjaman</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedItem?.kode_peminjaman }}</p>
            </div>
          </div>

          <div v-if="isDetailLoading" class="p-6"><LoadingState /></div>

          <div v-else-if="detailData" class="p-6 space-y-5 max-h-[calc(90vh-100px)] overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Peminjam</p>
                <p class="font-semibold text-slate-900">{{ detailData.user?.nama_lengkap }}</p>
                <p class="text-xs text-slate-500">{{ detailData.user?.kelas }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Alat</p>
                <p class="font-semibold text-slate-900">{{ detailData.alat?.nama_alat }}</p>
                <p class="text-xs text-slate-500 font-mono">{{ detailData.alat?.kode_alat }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Tgl Pengajuan</p>
                <p class="font-semibold text-slate-900">{{ formatDate(detailData.tanggal_pengajuan) }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Tgl Pinjam</p>
                <p class="font-semibold text-slate-900">{{ formatDate(detailData.tanggal_pinjam) }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Harus Kembali</p>
                <p class="font-semibold text-slate-900">{{ formatDate(detailData.tanggal_harus_kembali) }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-xs text-slate-500 mb-1">Status</p>
                <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(detailData.status_peminjaman)]">
                  {{ formatStatus(detailData.status_peminjaman) }}
                </span>
              </div>
            </div>

            <div v-if="detailData.alasan_peminjaman" class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">Alasan Peminjaman</p>
              <p class="text-sm text-slate-700">{{ detailData.alasan_peminjaman }}</p>
            </div>

            <div v-if="detailData.alasan_ditolak" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-xs text-red-500 mb-1">Alasan Ditolak</p>
              <p class="text-sm text-red-700">{{ detailData.alasan_ditolak }}</p>
            </div>

            <div v-if="detailData.catatan_petugas" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-xs text-blue-500 mb-1">Catatan Petugas</p>
              <p class="text-sm text-blue-700">{{ detailData.catatan_petugas }}</p>
            </div>

            <!-- Overdue info -->
            <div v-if="detailData.computed?.is_overdue" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="text-red-600" />
                <p class="font-semibold text-red-700">Terlambat {{ detailData.computed.days_overdue }} hari</p>
              </div>
            </div>

            <!-- Pengembalian info -->
            <div v-if="detailData.pengembalian" class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p class="font-semibold text-green-700 text-sm">Info Pengembalian</p>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p class="text-xs text-slate-500">Tgl Dikembalikan</p>
                  <p class="text-slate-700">{{ formatDate(detailData.pengembalian.tanggal_kembali_actual) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Denda</p>
                  <p class="text-slate-700">Rp {{ (detailData.pengembalian.denda || 0).toLocaleString('id-ID') }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50">
            <UButton variant="outline" @click="isDetailModalOpen = false">Tutup</UButton>
          </div>
        </div>
      </template>
    </LazyUModal>

    <!-- Approve Modal -->
    <LazyUModal v-model:open="isVerifyModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-check-circle" class="text-xl text-green-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Setujui Peminjaman</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedItem?.kode_peminjaman }}</p>
            </div>
          </div>

          <form @submit.prevent="handleApprove" class="p-6 space-y-4">
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p class="text-sm text-slate-700">
                <strong>Peminjam:</strong> {{ selectedItem?.user?.nama_lengkap }} ({{ selectedItem?.user?.kelas }})
              </p>
              <p class="text-sm text-slate-700 mt-1">
                <strong>Alat:</strong> {{ selectedItem?.alat?.nama_alat }}
              </p>
            </div>

            <UFormField label="Durasi Peminjaman (hari)" required>
              <UInput v-model.number="verifyForm.durasi_pinjam_hari" type="number" min="1" max="30" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Catatan Petugas">
              <UTextarea v-model="verifyForm.catatan_petugas" placeholder="Catatan opsional..." :rows="3" size="lg" class="w-full" />
            </UFormField>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isVerifyModalOpen = false">Batal</UButton>
              <UButton type="submit" color="success" :loading="isLoading" class="font-semibold">
                <UIcon name="i-lucide-check" class="mr-1" /> Setujui
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </LazyUModal>

    <!-- Reject Modal -->
    <LazyUModal v-model:open="isRejectModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-x-circle" class="text-xl text-red-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Tolak Peminjaman</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedItem?.kode_peminjaman }}</p>
            </div>
          </div>

          <form @submit.prevent="handleReject" class="p-6 space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-slate-700">
                <strong>Peminjam:</strong> {{ selectedItem?.user?.nama_lengkap }}
              </p>
              <p class="text-sm text-slate-700 mt-1">
                <strong>Alat:</strong> {{ selectedItem?.alat?.nama_alat }}
              </p>
            </div>

            <UFormField label="Alasan Penolakan" required>
              <UTextarea v-model="rejectForm.alasan_ditolak" placeholder="Wajib isi alasan penolakan..." :rows="3" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Catatan Petugas">
              <UTextarea v-model="rejectForm.catatan_petugas" placeholder="Catatan opsional..." :rows="2" size="lg" class="w-full" />
            </UFormField>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isRejectModalOpen = false">Batal</UButton>
              <UButton type="submit" color="error" :loading="isLoading" :disabled="!rejectForm.alasan_ditolak" class="font-semibold">
                <UIcon name="i-lucide-x" class="mr-1" /> Tolak
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
