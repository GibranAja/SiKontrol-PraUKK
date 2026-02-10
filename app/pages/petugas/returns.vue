<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Pengembalian & Denda - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// Tabs
const activeTab = ref<'returns' | 'overdue' | 'fines'>('returns')

// Loading states
const isLoading = ref(false)

// Returns data
const pengembalian = ref<any[]>([])
const returnsPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

// Overdue data
const overdueList = ref<any[]>([])
const overduePagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

// Active loans (for process return modal)
const activeLoans = ref<any[]>([])
const isLoadingLoans = ref(false)

// Modal states
const isProcessModalOpen = ref(false)
const isPayFineModalOpen = ref(false)
const selectedReturn = ref<any>(null)

// Process return form
const returnForm = reactive({
  id_peminjaman: null as number | null,
  kondisi_alat_saat_kembali: 'BAIK' as string,
  catatan_pengembalian: '',
  denda_rusak_manual: null as number | null,
  denda_rusak_display: '' as string,
})

const kondisiOptions = [
  { label: 'Baik', value: 'BAIK' },
  { label: 'Rusak Ringan', value: 'RUSAK_RINGAN' },
  { label: 'Rusak Berat', value: 'RUSAK_BERAT' },
  { label: 'Hilang', value: 'HILANG' },
]

// Pay fine form
const fineForm = reactive({
  status_denda: 'LUNAS' as string,
})

const statusDendaOptions = [
  { label: 'Lunas', value: 'LUNAS' },
  { label: 'Dicicil', value: 'DICICIL' },
]

// Computed: check if need manual fine input
const needManualFineInput = computed(() => {
  return returnForm.kondisi_alat_saat_kembali === 'RUSAK_RINGAN' || returnForm.kondisi_alat_saat_kembali === 'RUSAK_BERAT'
})

// Format number with thousand separator
function formatCurrencyInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  // Format with thousand separator
  return parseInt(digits).toLocaleString('id-ID')
}

// Parse formatted string to number
function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? parseInt(digits) : 0
}

// Handle denda input change
function handleDendaInput(event: Event) {
  const target = event.target as HTMLInputElement
  const formatted = formatCurrencyInput(target.value)
  returnForm.denda_rusak_display = formatted
  returnForm.denda_rusak_manual = parseCurrencyInput(formatted)
}

// Watch kondisi change to reset denda
watch(() => returnForm.kondisi_alat_saat_kembali, (newVal) => {
  if (newVal !== 'RUSAK_RINGAN' && newVal !== 'RUSAK_BERAT') {
    returnForm.denda_rusak_manual = null
    returnForm.denda_rusak_display = ''
  }
})

// Fetch returns list
async function fetchPengembalian() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/pengembalian', {
      query: { page: returnsPagination.value.page, limit: returnsPagination.value.limit },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      pengembalian.value = response.data
      if (response.meta) {
        returnsPagination.value = {
          page: response.meta.page || 1,
          limit: response.meta.limit || 10,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch pengembalian error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch overdue
async function fetchOverdue() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/pengembalian/overdue', {
      query: { page: overduePagination.value.page, limit: overduePagination.value.limit },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      overdueList.value = response.data
      if (response.meta) {
        overduePagination.value = {
          page: response.meta.page || 1,
          limit: response.meta.limit || 10,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch overdue error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch active loans (status DIPINJAM)
async function fetchActiveLoans() {
  isLoadingLoans.value = true
  try {
    const response = await $fetch('/api/peminjaman', {
      query: { status: 'DIPINJAM', limit: 100 },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      activeLoans.value = response.data
    }
  } catch (error) {
    console.error('Fetch active loans error:', error)
  } finally {
    isLoadingLoans.value = false
  }
}

// Open process return modal
async function openProcessModal() {
  returnForm.id_peminjaman = null
  returnForm.kondisi_alat_saat_kembali = 'BAIK'
  returnForm.catatan_pengembalian = ''
  returnForm.denda_rusak_manual = null
  returnForm.denda_rusak_display = ''
  isProcessModalOpen.value = true
  await fetchActiveLoans()
}

// Process return from overdue directly
async function processReturnFromOverdue(item: any) {
  returnForm.id_peminjaman = item.id_peminjaman
  returnForm.kondisi_alat_saat_kembali = 'BAIK'
  returnForm.catatan_pengembalian = ''
  returnForm.denda_rusak_manual = null
  returnForm.denda_rusak_display = ''
  isProcessModalOpen.value = true
  await fetchActiveLoans()
}

// Submit process return
async function handleProcessReturn() {
  if (!returnForm.id_peminjaman) return

  // Validate manual fine if needed
  if (needManualFineInput.value && (!returnForm.denda_rusak_manual || returnForm.denda_rusak_manual <= 0)) {
    toast.add({ title: 'Validasi', description: 'Masukkan nominal denda untuk kondisi rusak', color: 'warning' })
    return
  }

  isLoading.value = true
  try {
    const response: any = await $fetch('/api/pengembalian', {
      method: 'POST',
      body: {
        id_peminjaman: returnForm.id_peminjaman,
        kondisi_alat_saat_kembali: returnForm.kondisi_alat_saat_kembali,
        catatan_pengembalian: returnForm.catatan_pengembalian || undefined,
        denda_rusak_manual: returnForm.denda_rusak_manual || undefined,
      },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      const denda = response.data?.denda || 0
      let msg = 'Pengembalian berhasil diproses'
      if (denda > 0) msg += `. Denda: Rp ${denda.toLocaleString('id-ID')}`
      toast.add({ title: 'Berhasil', description: msg, color: 'success' })
      isProcessModalOpen.value = false
      fetchPengembalian()
      fetchOverdue()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open pay fine modal
function openPayFineModal(item: any) {
  selectedReturn.value = item
  fineForm.status_denda = 'LUNAS'
  isPayFineModalOpen.value = true
}

// Handle pay fine
async function handlePayFine() {
  if (!selectedReturn.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/pengembalian/${selectedReturn.value.id_pengembalian}/bayar-denda`, {
      method: 'PATCH',
      body: {
        status_denda: fineForm.status_denda,
      },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Status denda berhasil diperbarui', color: 'success' })
      isPayFineModalOpen.value = false
      selectedReturn.value = null
      fetchPengembalian()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function getKondisiColor(k: string) {
  switch (k) {
    case 'BAIK': return 'bg-green-100 text-green-700'
    case 'RUSAK_RINGAN': return 'bg-yellow-100 text-yellow-700'
    case 'RUSAK_BERAT': return 'bg-orange-100 text-orange-700'
    case 'HILANG': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatKondisi(k: string) {
  const map: Record<string, string> = {
    BAIK: 'Baik',
    RUSAK_RINGAN: 'Rusak Ringan',
    RUSAK_BERAT: 'Rusak Berat',
    HILANG: 'Hilang',
  }
  return map[k] || k
}

function getDendaStatusColor(s: string) {
  switch (s) {
    case 'LUNAS': return 'bg-green-100 text-green-700'
    case 'BELUM_BAYAR': return 'bg-red-100 text-red-700'
    case 'DICICIL': return 'bg-yellow-100 text-yellow-700'
    case 'WAIVED': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatDendaStatus(s: string) {
  const map: Record<string, string> = {
    LUNAS: 'Lunas',
    BELUM_BAYAR: 'Belum Bayar',
    DICICIL: 'Dicicil',
    WAIVED: 'Dibebaskan',
  }
  return map[s] || s
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}

function formatCurrency(val: number) {
  return `Rp ${val.toLocaleString('id-ID')}`
}

// Computed for selected loan info
const selectedLoanInfo = computed(() => {
  if (!returnForm.id_peminjaman) return null
  return activeLoans.value.find((l: any) => l.id_peminjaman === returnForm.id_peminjaman) || null
})

const loanSelectItems = computed(() => {
  return activeLoans.value.map((l: any) => ({
    label: `${l.kode_peminjaman} — ${l.user?.nama_lengkap} — ${l.alat?.nama_alat}`,
    value: l.id_peminjaman,
  }))
})

// Tab change
watch(activeTab, (tab) => {
  if (tab === 'returns') fetchPengembalian()
  else if (tab === 'overdue') fetchOverdue()
  else if (tab === 'fines') fetchPengembalian()
})

watch(() => returnsPagination.value.page, fetchPengembalian)
watch(() => overduePagination.value.page, fetchOverdue)

onMounted(() => {
  fetchPengembalian()
  fetchOverdue()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Pengembalian & Denda</h1>
        <p class="text-slate-600 mt-1">Proses pengembalian alat dan kelola denda</p>
      </div>
      <UButton icon="i-lucide-package-check" size="lg" color="primary" class="font-semibold" @click="openProcessModal">
        Proses Pengembalian
      </UButton>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in [
            { key: 'returns', label: 'Riwayat Pengembalian', icon: 'i-lucide-list' },
            { key: 'overdue', label: 'Overdue / Terlambat', icon: 'i-lucide-alert-triangle' },
            { key: 'fines', label: 'Denda Belum Bayar', icon: 'i-lucide-banknote' },
          ]"
          :key="tab.key"
          @click="activeTab = tab.key as any"
          :class="[
            'flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeTab === tab.key
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
          ]"
        >
          <UIcon :name="tab.icon" class="text-lg" />
          {{ tab.label }}
          <span v-if="tab.key === 'overdue' && overduePagination.total > 0" class="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">
            {{ overduePagination.total }}
          </span>
        </button>
      </div>

      <!-- Returns Tab -->
      <div v-if="activeTab === 'returns'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode Pinjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Peminjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Alat</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tgl Kembali</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kondisi</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Denda</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status Denda</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="8" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <tr v-else-if="pengembalian.length === 0">
              <td colspan="8" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-package-check" class="text-5xl text-slate-300 mx-auto mb-3" />
                <p class="text-slate-500">Belum ada data pengembalian</p>
              </td>
            </tr>
            <tr v-else v-for="item in pengembalian" :key="item.id_pengembalian" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <span class="text-sm font-mono font-semibold text-slate-900">{{ item.peminjaman?.kode_peminjaman }}</span>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.peminjaman?.user?.nama_lengkap }}</p>
                  <p class="text-xs text-slate-500">{{ item.peminjaman?.user?.kelas }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-slate-900">{{ item.peminjaman?.alat?.nama_alat }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ formatDate(item.tanggal_kembali_actual) }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-block px-3 py-1 rounded-md text-xs font-semibold whitespace-normal break-words max-w-[70px]', getKondisiColor(item.kondisi_alat_saat_kembali)]">
                  {{ formatKondisi(item.kondisi_alat_saat_kembali) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-semibold" :class="item.denda > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(item.denda || 0) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-block px-3 py-1 rounded-md text-xs font-semibold whitespace-normal break-words max-w-[70px]', getDendaStatusColor(item.status_denda)]">
                  {{ formatDendaStatus(item.status_denda) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center">
                  <UButton
                    v-if="item.denda > 0 && item.status_denda === 'BELUM_BAYAR'"
                    icon="i-lucide-wallet"
                    size="sm"
                    color="primary"
                    variant="soft"
                    @click="openPayFineModal(item)"
                    title="Bayar Denda"
                  />
                  <span v-else class="text-xs text-slate-400 italic">{{ item.denda === 0 ? 'Tanpa denda' : 'Selesai' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="returnsPagination.totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p class="text-sm text-slate-600">Halaman {{ returnsPagination.page }} dari {{ returnsPagination.totalPages }}</p>
          <div class="flex items-center space-x-2">
            <UButton icon="i-lucide-chevron-left" size="sm" variant="outline" :disabled="returnsPagination.page === 1" @click="returnsPagination.page--" />
            <UButton icon="i-lucide-chevron-right" size="sm" variant="outline" :disabled="returnsPagination.page === returnsPagination.totalPages" @click="returnsPagination.page++" />
          </div>
        </div>
      </div>

      <!-- Overdue Tab -->
      <div v-if="activeTab === 'overdue'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode Pinjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Peminjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Alat</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Batas Kembali</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Keterlambatan</th>
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
            <tr v-else-if="overdueList.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-400 mx-auto mb-3" />
                <p class="text-slate-500">Tidak ada keterlambatan</p>
              </td>
            </tr>
            <tr v-else v-for="item in overdueList" :key="item.id_peminjaman" class="hover:bg-red-50/50 transition-colors">
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
                <p class="text-sm text-slate-900">{{ item.alat?.nama_alat }}</p>
                <p class="text-xs text-slate-500 font-mono">{{ item.alat?.kode_alat }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ formatDate(item.tanggal_harus_kembali) }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  {{ item.days_overdue }} hari
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center">
                  <UButton icon="i-lucide-package-check" size="sm" color="primary" variant="soft" @click="processReturnFromOverdue(item)" title="Proses Pengembalian">
                    Proses
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="overduePagination.totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p class="text-sm text-slate-600">Halaman {{ overduePagination.page }} dari {{ overduePagination.totalPages }}</p>
          <div class="flex items-center space-x-2">
            <UButton icon="i-lucide-chevron-left" size="sm" variant="outline" :disabled="overduePagination.page === 1" @click="overduePagination.page--" />
            <UButton icon="i-lucide-chevron-right" size="sm" variant="outline" :disabled="overduePagination.page === overduePagination.totalPages" @click="overduePagination.page++" />
          </div>
        </div>
      </div>

      <!-- Fines Tab (reuses pengembalian data) -->
      <div v-if="activeTab === 'fines'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode Pinjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Peminjam</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jumlah Denda</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="5" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <template v-else>
              <tr v-if="pengembalian.filter(p => p.denda > 0 && p.status_denda !== 'LUNAS' && p.status_denda !== 'WAIVED').length === 0">
                <td colspan="5" class="px-6 py-12 text-center">
                  <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-400 mx-auto mb-3" />
                  <p class="text-slate-500">Tidak ada denda yang belum dibayar</p>
                </td>
              </tr>
              <tr
                v-else
                v-for="item in pengembalian.filter(p => p.denda > 0 && p.status_denda !== 'LUNAS' && p.status_denda !== 'WAIVED')"
                :key="item.id_pengembalian"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-mono font-semibold text-slate-900">{{ item.peminjaman?.kode_peminjaman }}</span>
                </td>
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ item.peminjaman?.user?.nama_lengkap }}</p>
                    <p class="text-xs text-slate-500">{{ item.peminjaman?.user?.kelas }}</p>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(item.denda) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span :class="['inline-block px-3 py-1 rounded-md text-xs font-semibold whitespace-normal break-words max-w-[70px]', getDendaStatusColor(item.status_denda)]">
                    {{ formatDendaStatus(item.status_denda) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center">
                    <UButton icon="i-lucide-wallet" size="sm" color="primary" variant="soft" @click="openPayFineModal(item)" title="Bayar Denda">
                      Bayar
                    </UButton>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Process Return Modal -->
    <LazyUModal v-model:open="isProcessModalOpen">
      <template #content>
        <div class="w-full max-w-lg mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-package-check" class="text-xl text-teal-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Proses Pengembalian</h3>
              <p class="text-sm text-slate-500">Pilih peminjaman dan kondisi alat</p>
            </div>
          </div>

          <form @submit.prevent="handleProcessReturn" class="p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">
            <UFormField label="Pilih Peminjaman" required>
              <USelect
                v-model="returnForm.id_peminjaman"
                :items="loanSelectItems"
                placeholder="Pilih peminjaman aktif..."
                size="lg"
                class="w-full"
                :loading="isLoadingLoans"
              />
            </UFormField>

            <!-- Selected loan info -->
            <div v-if="selectedLoanInfo" class="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
              <p class="text-sm text-slate-700"><strong>Peminjam:</strong> {{ selectedLoanInfo.user?.nama_lengkap }} ({{ selectedLoanInfo.user?.kelas }})</p>
              <p class="text-sm text-slate-700"><strong>Alat:</strong> {{ selectedLoanInfo.alat?.nama_alat }} ({{ selectedLoanInfo.alat?.kode_alat }})</p>
              <p class="text-sm text-slate-700"><strong>Tgl Pinjam:</strong> {{ formatDate(selectedLoanInfo.tanggal_pinjam) }}</p>
              <p class="text-sm text-slate-700"><strong>Harus Kembali:</strong> {{ formatDate(selectedLoanInfo.tanggal_harus_kembali) }}</p>
              <div v-if="selectedLoanInfo.is_overdue" class="mt-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">OVERDUE</span>
              </div>
            </div>

            <UFormField label="Kondisi Alat Saat Kembali" required>
              <USelect
                v-model="returnForm.kondisi_alat_saat_kembali"
                :items="kondisiOptions"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <!-- Manual fine input for damaged items -->
            <UFormField
              v-if="needManualFineInput"
              label="Nominal Denda Kerusakan"
              required
              description="Masukkan nominal denda sesuai tingkat kerusakan"
            >
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                <input
                  type="text"
                  v-model="returnForm.denda_rusak_display"
                  @input="handleDendaInput"
                  placeholder="0"
                  class="w-full pl-12 pr-4 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
              <p v-if="returnForm.denda_rusak_manual" class="text-sm text-teal-600 mt-1.5">
                <UIcon name="i-lucide-info" class="mr-1 inline" />
                Denda yang akan dikenakan: <strong>Rp {{ returnForm.denda_rusak_manual.toLocaleString('id-ID') }}</strong>
              </p>
            </UFormField>

            <div v-if="returnForm.kondisi_alat_saat_kembali === 'HILANG'" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-700">
                <UIcon name="i-lucide-alert-triangle" class="mr-1 inline" />
                Alat yang hilang akan dikenakan denda sesuai harga alat dan stok tidak akan dikembalikan.
              </p>
            </div>

            <UFormField label="Catatan Pengembalian">
              <UTextarea v-model="returnForm.catatan_pengembalian" placeholder="Catatan opsional..." :rows="3" size="lg" class="w-full" />
            </UFormField>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isProcessModalOpen = false">Batal</UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="!returnForm.id_peminjaman"
                class="font-semibold"
              >
                <UIcon name="i-lucide-check" class="mr-1" /> Proses
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </LazyUModal>

    <!-- Pay Fine Modal -->
    <LazyUModal v-model:open="isPayFineModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-wallet" class="text-xl text-amber-600" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">Pembayaran Denda</h3>
              <p class="text-sm text-slate-500">{{ selectedReturn?.peminjaman?.kode_peminjaman }}</p>
            </div>
          </div>

          <form @submit.prevent="handlePayFine" class="p-6 space-y-4">
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p class="text-sm text-slate-700"><strong>Peminjam:</strong> {{ selectedReturn?.peminjaman?.user?.nama_lengkap }}</p>
              <p class="text-sm text-slate-700"><strong>Jumlah Denda:</strong> <span class="text-red-600 font-bold">{{ formatCurrency(selectedReturn?.denda || 0) }}</span></p>
              <p class="text-sm text-slate-700"><strong>Kondisi Alat:</strong> {{ formatKondisi(selectedReturn?.kondisi_alat_saat_kembali) }}</p>
            </div>

            <UFormField label="Status Pembayaran" required>
              <USelect
                v-model="fineForm.status_denda"
                :items="statusDendaOptions"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton type="button" variant="outline" @click="isPayFineModalOpen = false">Batal</UButton>
              <UButton type="submit" color="primary" :loading="isLoading" class="font-semibold">
                <UIcon name="i-lucide-check" class="mr-1" /> Konfirmasi
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
