<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Manajemen Perpanjangan - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const perpanjangan = ref<any[]>([])
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

// Filters
const statusFilter = ref<string | undefined>(undefined)

const statusOptions = [
  { label: 'Menunggu', value: 'MENUNGGU' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
]

// Modal states
const isVerifyModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const selectedItem = ref<any>(null)

// Reject form
const rejectForm = reactive({
  alasan_ditolak_admin: '',
})

async function fetchPerpanjangan() {
  isLoading.value = true
  try {
    const params: any = { page: pagination.value.page, limit: pagination.value.limit }
    if (statusFilter.value && statusFilter.value !== 'ALL') params.status = statusFilter.value

    const response = await $fetch('/api/perpanjangan', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      perpanjangan.value = response.data
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
    console.error('Fetch perpanjangan error:', error)
  } finally {
    isLoading.value = false
  }
}

function openVerifyModal(item: any) {
  selectedItem.value = item
  isVerifyModalOpen.value = true
}

function openRejectModal(item: any) {
  selectedItem.value = item
  rejectForm.alasan_ditolak_admin = ''
  isRejectModalOpen.value = true
}

async function handleApprove() {
  if (!selectedItem.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/perpanjangan/${selectedItem.value.id_perpanjangan}/verify`, {
      method: 'POST',
      body: { action: 'DISETUJUI' },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Perpanjangan disetujui', color: 'success' })
      isVerifyModalOpen.value = false
      selectedItem.value = null
      await fetchPerpanjangan()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

async function handleReject() {
  if (!selectedItem.value || !rejectForm.alasan_ditolak_admin) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/perpanjangan/${selectedItem.value.id_perpanjangan}/verify`, {
      method: 'POST',
      body: {
        action: 'DITOLAK',
        alasan_ditolak_admin: rejectForm.alasan_ditolak_admin,
      },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Perpanjangan ditolak', color: 'success' })
      isRejectModalOpen.value = false
      selectedItem.value = null
      await fetchPerpanjangan()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'MENUNGGU': return 'bg-orange-100 text-orange-700'
    case 'DISETUJUI': return 'bg-green-100 text-green-700'
    case 'DITOLAK': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
  }
  return map[status] || status
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}

watch(statusFilter, () => {
  pagination.value.page = 1
  fetchPerpanjangan()
})

watch(() => pagination.value.page, fetchPerpanjangan)

onMounted(() => fetchPerpanjangan())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Manajemen Perpanjangan</h1>
      <p class="text-slate-600 mt-1">Verifikasi pengajuan perpanjangan peminjaman</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <USelect
          v-model="statusFilter"
          :items="[{ label: 'Semua Status', value: 'ALL' }, ...statusOptions]"
          placeholder="Filter Status"
          size="lg"
        />
        <UButton variant="outline" icon="i-lucide-refresh-cw" @click="fetchPerpanjangan" size="lg" class="font-semibold">
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
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Peminjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode Peminjaman</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Alasan</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Durasi</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tgl Pengajuan</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="7" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <tr v-else-if="perpanjangan.length === 0">
              <td colspan="7" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-calendar-plus" class="text-5xl text-slate-300 mx-auto mb-3" />
                <p class="text-slate-500">Tidak ada pengajuan perpanjangan</p>
              </td>
            </tr>
            <tr v-else v-for="item in perpanjangan" :key="item.id_perpanjangan" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.pengaju?.nama_lengkap || '-' }}</p>
                  <p class="text-xs text-slate-500">{{ item.pengaju?.kelas || '-' }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-mono font-semibold text-slate-700">{{ item.peminjaman?.kode_peminjaman || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-slate-700 max-w-xs truncate" :title="item.alasan_permintaan">{{ item.alasan_permintaan || '-' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ item.durasi_tambahan_hari || '-' }} hari</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ formatDate(item.tanggal_pengajuan) }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(item.status_perpanjangan)]">
                  {{ formatStatus(item.status_perpanjangan) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <template v-if="item.status_perpanjangan === 'MENUNGGU'">
                    <UButton icon="i-lucide-check" size="sm" color="success" variant="soft" @click="openVerifyModal(item)" title="Setujui" />
                    <UButton icon="i-lucide-x" size="sm" color="error" variant="soft" @click="openRejectModal(item)" title="Tolak" />
                  </template>
                  <span v-else class="text-xs text-slate-400 italic">Sudah diproses</span>
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

    <!-- Approve Modal -->
    <LazyUModal v-model:open="isVerifyModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-check-circle" class="text-xl text-green-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Setujui Perpanjangan</h3>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
              <p class="text-sm text-slate-700"><strong>Peminjam:</strong> {{ selectedItem?.pengaju?.nama_lengkap }}</p>
              <p class="text-sm text-slate-700"><strong>Kode Pinjam:</strong> {{ selectedItem?.peminjaman?.kode_peminjaman }}</p>
              <p class="text-sm text-slate-700"><strong>Durasi:</strong> {{ selectedItem?.durasi_tambahan_hari }} hari</p>
              <p class="text-sm text-slate-700"><strong>Alasan:</strong> {{ selectedItem?.alasan_permintaan }}</p>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p class="text-sm text-yellow-700">
                <UIcon name="i-lucide-info" class="mr-1 inline" />
                Tanggal pengembalian akan diperpanjang otomatis setelah disetujui.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isVerifyModalOpen = false">Batal</UButton>
              <UButton color="success" :loading="isLoading" @click="handleApprove" class="font-semibold">
                <UIcon name="i-lucide-check" class="mr-1" /> Setujui
              </UButton>
            </div>
          </div>
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
              <h3 class="font-heading font-bold text-lg text-slate-900">Tolak Perpanjangan</h3>
            </div>
          </div>

          <form @submit.prevent="handleReject" class="p-6 space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p class="text-sm text-slate-700"><strong>Peminjam:</strong> {{ selectedItem?.pengaju?.nama_lengkap }}</p>
              <p class="text-sm text-slate-700"><strong>Alasan Pengajuan:</strong> {{ selectedItem?.alasan_permintaan }}</p>
            </div>

            <UFormField label="Alasan Penolakan" required>
              <UTextarea v-model="rejectForm.alasan_ditolak_admin" placeholder="Wajib isi alasan penolakan..." :rows="3" size="lg" class="w-full" />
            </UFormField>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isRejectModalOpen = false">Batal</UButton>
              <UButton type="submit" color="error" :loading="isLoading" :disabled="!rejectForm.alasan_ditolak_admin" class="font-semibold">
                <UIcon name="i-lucide-x" class="mr-1" /> Tolak
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
