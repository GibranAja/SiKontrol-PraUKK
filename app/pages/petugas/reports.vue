<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Laporan - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

// Active report tab
const activeReport = ref<'peminjaman' | 'denda' | 'alat-terbanyak'>('peminjaman')

// Loading state
const isLoading = ref(false)
const isExporting = ref(false)

// Date filters
const dateFrom = ref('')
const dateTo = ref('')
const statusFilter = ref<string | undefined>(undefined)
const dendaStatusFilter = ref<string | undefined>(undefined)
const periodeFilter = ref('all')

const statusOptions = [
  { label: 'Menunggu', value: 'MENUNGGU_PERSETUJUAN' },
  { label: 'Dipinjam', value: 'DIPINJAM' },
  { label: 'Dikembalikan', value: 'DIKEMBALIKAN' },
  { label: 'Ditolak', value: 'DITOLAK' },
]

const dendaStatusOptions = [
  { label: 'Belum Bayar', value: 'BELUM_BAYAR' },
  { label: 'Lunas', value: 'LUNAS' },
  { label: 'Dicicil', value: 'DICICIL' },
  { label: 'Dibebaskan', value: 'WAIVED' },
]

const periodeOptions = [
  { label: 'Semua Waktu', value: 'all' },
  { label: 'Bulan Ini', value: 'month' },
  { label: 'Tahun Ini', value: 'year' },
]

// Report data
const peminjamanData = ref<any[]>([])
const dendaData = ref<any>(null)
const alatTerbanyakData = ref<any>(null)

// Fetch peminjaman report
async function fetchPeminjamanReport() {
  isLoading.value = true
  try {
    const params: any = {}
    if (dateFrom.value) params.tanggal_dari = dateFrom.value
    if (dateTo.value) params.tanggal_sampai = dateTo.value
    if (statusFilter.value && statusFilter.value !== 'ALL') params.status = statusFilter.value

    const response = await $fetch('/api/laporan/peminjaman', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      peminjamanData.value = response.data
    }
  } catch (error) {
    console.error('Fetch peminjaman report error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch denda report
async function fetchDendaReport() {
  isLoading.value = true
  try {
    const params: any = {}
    if (dateFrom.value) params.tanggal_dari = dateFrom.value
    if (dateTo.value) params.tanggal_sampai = dateTo.value
    if (dendaStatusFilter.value && dendaStatusFilter.value !== 'ALL') params.status_denda = dendaStatusFilter.value

    const response = await $fetch('/api/laporan/denda', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      dendaData.value = response.data
    }
  } catch (error) {
    console.error('Fetch denda report error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch alat terbanyak report
async function fetchAlatTerbanyakReport() {
  isLoading.value = true
  try {
    const params: any = { limit: 20 }
    if (periodeFilter.value !== 'all') params.periode = periodeFilter.value

    const response = await $fetch('/api/laporan/alat-terbanyak', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      alatTerbanyakData.value = response.data
    }
  } catch (error) {
    console.error('Fetch alat terbanyak report error:', error)
  } finally {
    isLoading.value = false
  }
}

function fetchCurrentReport() {
  if (activeReport.value === 'peminjaman') fetchPeminjamanReport()
  else if (activeReport.value === 'denda') fetchDendaReport()
  else fetchAlatTerbanyakReport()
}

// ========== EXCEL EXPORT (pure client-side) ==========
function exportToExcel(sheetName: string, headers: string[], rows: (string | number)[][]) {
  isExporting.value = true
  try {
    // Build CSV with BOM for Excel compat
    const BOM = '\ufeff'
    const csvContent = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.download = `${sheetName}_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.add({ title: 'Berhasil', description: 'Laporan berhasil diekspor', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Gagal', description: 'Gagal mengekspor laporan', color: 'error' })
  } finally {
    isExporting.value = false
  }
}

function exportPeminjaman() {
  const headers = ['No', 'Kode Peminjaman', 'Nama Peminjam', 'Kelas', 'Nama Alat', 'Kode Alat', 'Kategori', 'Tgl Pengajuan', 'Tgl Pinjam', 'Tgl Harus Kembali', 'Tgl Dikembalikan', 'Status', 'Denda', 'Status Denda']
  const rows = peminjamanData.value.map((p: any, i: number) => [
    i + 1,
    p.kode_peminjaman || '',
    p.user?.nama_lengkap || '',
    p.user?.kelas || '',
    p.alat?.nama_alat || '',
    p.alat?.kode_alat || '',
    p.alat?.kategori?.nama_kategori || '',
    formatDate(p.tanggal_pengajuan),
    formatDate(p.tanggal_pinjam),
    formatDate(p.tanggal_harus_kembali),
    p.pengembalian ? formatDate(p.pengembalian.tanggal_kembali_actual) : '',
    formatStatus(p.status_peminjaman),
    p.pengembalian?.denda || 0,
    p.pengembalian?.status_denda ? formatDendaStatus(p.pengembalian.status_denda) : '',
  ])
  exportToExcel('Laporan_Peminjaman', headers, rows)
}

function exportDenda() {
  if (!dendaData.value?.detail) return
  const headers = ['No', 'Kode Peminjaman', 'Nama Peminjam', 'Kelas', 'Nama Alat', 'Hari Terlambat', 'Jumlah Denda', 'Status Denda', 'Tgl Kembali']
  const rows = dendaData.value.detail.map((d: any, i: number) => [
    i + 1,
    d.kode_peminjaman || '',
    d.nama_peminjam || '',
    d.kelas || '',
    d.nama_alat || '',
    d.hari_terlambat || 0,
    d.denda || 0,
    d.status_denda_display || formatDendaStatus(d.status_denda),
    formatDate(d.tanggal_kembali),
  ])
  exportToExcel('Laporan_Denda', headers, rows)
}

function exportAlatTerbanyak() {
  if (!alatTerbanyakData.value?.ranking) return
  const headers = ['Rank', 'Kode Alat', 'Nama Alat', 'Kategori', 'Total Peminjaman', 'Persentase (%)']
  const rows = alatTerbanyakData.value.ranking.map((a: any) => [
    a.rank,
    a.kode_alat || '',
    a.nama_alat || '',
    a.kategori || '',
    a.total_peminjaman || 0,
    a.persentase || 0,
  ])
  exportToExcel('Laporan_Alat_Terbanyak', headers, rows)
}

// Helper functions
function formatDate(d: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}

function formatStatus(s: string) {
  const map: Record<string, string> = {
    MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
    DIPINJAM: 'Sedang Dipinjam',
    DIKEMBALIKAN: 'Dikembalikan',
    DITOLAK: 'Ditolak',
    DISETUJUI: 'Disetujui',
  }
  return map[s] || s
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

function getStatusColor(s: string) {
  switch (s) {
    case 'MENUNGGU_PERSETUJUAN': return 'bg-orange-100 text-orange-700'
    case 'DIPINJAM': return 'bg-blue-100 text-blue-700'
    case 'DIKEMBALIKAN': return 'bg-green-100 text-green-700'
    case 'DITOLAK': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
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

function formatCurrency(val: number) {
  return `Rp ${val.toLocaleString('id-ID')}`
}

// Watch tab changes
watch(activeReport, fetchCurrentReport)

onMounted(() => {
  fetchPeminjamanReport()
  fetchDendaReport()
  fetchAlatTerbanyakReport()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Laporan</h1>
      <p class="text-slate-600 mt-1">Cetak laporan peminjaman, denda, dan alat terbanyak ke Excel</p>
    </div>

    <!-- Report Tabs -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in [
            { key: 'peminjaman', label: 'Laporan Peminjaman', icon: 'i-lucide-hand-helping' },
            { key: 'denda', label: 'Rekap Denda', icon: 'i-lucide-banknote' },
            { key: 'alat-terbanyak', label: 'Alat Terbanyak', icon: 'i-lucide-trophy' },
          ]"
          :key="tab.key"
          @click="activeReport = tab.key as any"
          :class="[
            'flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeReport === tab.key
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
          ]"
        >
          <UIcon :name="tab.icon" class="text-lg" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ========== Peminjaman Report ========== -->
      <div v-if="activeReport === 'peminjaman'" class="p-6 space-y-6">
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UFormField label="Dari Tanggal">
            <UInput v-model="dateFrom" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Sampai Tanggal">
            <UInput v-model="dateTo" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Status">
            <USelect v-model="statusFilter" :items="[{ label: 'Semua', value: 'ALL' }, ...statusOptions]" size="lg" class="w-full" />
          </UFormField>
          <div class="flex items-end gap-2">
            <UButton icon="i-lucide-search" color="primary" size="lg" @click="fetchPeminjamanReport" class="font-semibold flex-1">
              Tampilkan
            </UButton>
            <UButton
              icon="i-lucide-file-spreadsheet"
              color="success"
              variant="soft"
              size="lg"
              @click="exportPeminjaman"
              :loading="isExporting"
              :disabled="peminjamanData.length === 0"
              title="Export Excel/CSV"
            >
              Export
            </UButton>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="!isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-slate-900">{{ peminjamanData.length }}</p>
            <p class="text-xs text-slate-500 mt-1">Total Data</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{{ peminjamanData.filter((p: any) => p.status_peminjaman === 'DIPINJAM').length }}</p>
            <p class="text-xs text-slate-500 mt-1">Sedang Dipinjam</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{{ peminjamanData.filter((p: any) => p.status_peminjaman === 'DIKEMBALIKAN').length }}</p>
            <p class="text-xs text-slate-500 mt-1">Dikembalikan</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-orange-600">{{ peminjamanData.filter((p: any) => p.status_peminjaman === 'MENUNGGU_PERSETUJUAN').length }}</p>
            <p class="text-xs text-slate-500 mt-1">Menunggu</p>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kode</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Peminjam</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Alat</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tgl Pinjam</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Denda</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-if="isLoading">
                <td colspan="7" class="px-4 py-12 text-center">
                  <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                  <p class="text-slate-500 mt-2">Memuat data...</p>
                </td>
              </tr>
              <tr v-else-if="peminjamanData.length === 0">
                <td colspan="7" class="px-4 py-12 text-center text-slate-500">Tidak ada data</td>
              </tr>
              <tr v-else v-for="(item, idx) in peminjamanData" :key="item.id_peminjaman" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-slate-600">{{ idx + 1 }}</td>
                <td class="px-4 py-3 font-mono font-semibold text-slate-900">{{ item.kode_peminjaman }}</td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-slate-900">{{ item.user?.nama_lengkap }}</p>
                  <p class="text-xs text-slate-500">{{ item.user?.kelas }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-900">{{ item.alat?.nama_alat }}</p>
                  <p class="text-xs text-slate-500">{{ item.alat?.kategori?.nama_kategori }}</p>
                </td>
                <td class="px-4 py-3 text-slate-700">{{ formatDate(item.tanggal_pinjam) }}</td>
                <td class="px-4 py-3">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-semibold', getStatusColor(item.status_peminjaman)]">
                    {{ formatStatus(item.status_peminjaman) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span v-if="item.pengembalian?.denda" class="font-semibold text-red-600">
                    {{ formatCurrency(item.pengembalian.denda) }}
                  </span>
                  <span v-else class="text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========== Denda Report ========== -->
      <div v-if="activeReport === 'denda'" class="p-6 space-y-6">
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UFormField label="Dari Tanggal">
            <UInput v-model="dateFrom" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Sampai Tanggal">
            <UInput v-model="dateTo" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Status Denda">
            <USelect v-model="dendaStatusFilter" :items="[{ label: 'Semua', value: 'ALL' }, ...dendaStatusOptions]" size="lg" class="w-full" />
          </UFormField>
          <div class="flex items-end gap-2">
            <UButton icon="i-lucide-search" color="primary" size="lg" @click="fetchDendaReport" class="font-semibold flex-1">
              Tampilkan
            </UButton>
            <UButton
              icon="i-lucide-file-spreadsheet"
              color="success"
              variant="soft"
              size="lg"
              @click="exportDenda"
              :loading="isExporting"
              :disabled="!dendaData?.detail?.length"
              title="Export Excel/CSV"
            >
              Export
            </UButton>
          </div>
        </div>

        <!-- Summary Cards -->
        <div v-if="dendaData?.summary" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-slate-900">{{ formatCurrency(dendaData.summary.total_denda || 0) }}</p>
            <p class="text-xs text-slate-500 mt-1">Total Denda</p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-red-600">{{ formatCurrency(dendaData.summary.by_status?.BELUM_BAYAR?.total || 0) }}</p>
            <p class="text-xs text-slate-500 mt-1">Belum Bayar ({{ dendaData.summary.by_status?.BELUM_BAYAR?.jumlah || 0 }})</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(dendaData.summary.by_status?.LUNAS?.total || 0) }}</p>
            <p class="text-xs text-slate-500 mt-1">Lunas ({{ dendaData.summary.by_status?.LUNAS?.jumlah || 0 }})</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-yellow-600">{{ dendaData.summary.total_transaksi || 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Total Transaksi</p>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kode Pinjam</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Peminjam</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Alat</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Terlambat</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Denda</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-if="isLoading">
                <td colspan="7" class="px-4 py-12 text-center">
                  <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                  <p class="text-slate-500 mt-2">Memuat data...</p>
                </td>
              </tr>
              <tr v-else-if="!dendaData?.detail?.length">
                <td colspan="7" class="px-4 py-12 text-center text-slate-500">Tidak ada data denda</td>
              </tr>
              <tr v-else v-for="(item, idx) in dendaData.detail" :key="item.id_pengembalian" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-slate-600">{{ idx + 1 }}</td>
                <td class="px-4 py-3 font-mono font-semibold text-slate-900">{{ item.kode_peminjaman }}</td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-slate-900">{{ item.nama_peminjam }}</p>
                  <p class="text-xs text-slate-500">{{ item.kelas }}</p>
                </td>
                <td class="px-4 py-3 text-slate-700">{{ item.nama_alat }}</td>
                <td class="px-4 py-3">
                  <span v-if="item.hari_terlambat > 0" class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{{ item.hari_terlambat }} hari</span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="px-4 py-3 text-right font-semibold text-red-600">{{ item.denda_formatted || formatCurrency(item.denda) }}</td>
                <td class="px-4 py-3">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-semibold', getDendaStatusColor(item.status_denda)]">
                    {{ item.status_denda_display || formatDendaStatus(item.status_denda) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========== Alat Terbanyak Report ========== -->
      <div v-if="activeReport === 'alat-terbanyak'" class="p-6 space-y-6">
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Periode">
            <USelect v-model="periodeFilter" :items="periodeOptions" size="lg" class="w-full" />
          </UFormField>
          <div class="flex items-end">
            <UButton icon="i-lucide-search" color="primary" size="lg" @click="fetchAlatTerbanyakReport" class="font-semibold">
              Tampilkan
            </UButton>
          </div>
          <div class="flex items-end justify-end">
            <UButton
              icon="i-lucide-file-spreadsheet"
              color="success"
              variant="soft"
              size="lg"
              @click="exportAlatTerbanyak"
              :loading="isExporting"
              :disabled="!alatTerbanyakData?.ranking?.length"
            >
              Export Excel
            </UButton>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="alatTerbanyakData?.summary" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-slate-900">{{ alatTerbanyakData.summary.total_peminjaman || 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Total Peminjaman</p>
          </div>
          <div class="bg-teal-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-teal-600">{{ alatTerbanyakData.summary.total_alat_dipinjam || 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Alat Berbeda</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-purple-600">{{ alatTerbanyakData.summary.total_kategori || 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Kategori</p>
          </div>
        </div>

        <!-- Ranking Table -->
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Alat</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kategori</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Total Pinjam</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Persentase</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-if="isLoading">
                <td colspan="5" class="px-4 py-12 text-center">
                  <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                  <p class="text-slate-500 mt-2">Memuat data...</p>
                </td>
              </tr>
              <tr v-else-if="!alatTerbanyakData?.ranking?.length">
                <td colspan="5" class="px-4 py-12 text-center text-slate-500">Tidak ada data</td>
              </tr>
              <tr v-else v-for="item in alatTerbanyakData.ranking" :key="item.id_alat" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-center">
                  <span v-if="item.rank <= 3" :class="[
                    'w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-sm',
                    item.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                    'bg-amber-600 text-white'
                  ]">{{ item.rank }}</span>
                  <span v-else class="text-slate-600">{{ item.rank }}</span>
                </td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-slate-900">{{ item.nama_alat }}</p>
                  <p class="text-xs text-slate-500 font-mono">{{ item.kode_alat }}</p>
                </td>
                <td class="px-4 py-3 text-slate-700">{{ item.kategori }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-900">{{ item.total_peminjaman }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-200 rounded-full h-2 max-w-[120px]">
                      <div class="bg-teal-500 h-2 rounded-full" :style="{ width: `${Math.min(item.persentase || 0, 100)}%` }"></div>
                    </div>
                    <span class="text-xs text-slate-600">{{ item.persentase }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Category Breakdown -->
        <div v-if="alatTerbanyakData?.category_breakdown?.length" class="bg-slate-50 rounded-lg p-6">
          <h3 class="font-heading font-bold text-lg text-slate-900 mb-4">Per Kategori</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="cat in alatTerbanyakData.category_breakdown" :key="cat.kategori" class="bg-white rounded-lg p-4 border border-slate-200">
              <p class="text-sm font-semibold text-slate-900">{{ cat.kategori }}</p>
              <p class="text-xl font-bold text-teal-600 mt-1">{{ cat.total_peminjaman }}</p>
              <p class="text-xs text-slate-500">peminjaman</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
