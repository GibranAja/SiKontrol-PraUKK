<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Log Aktivitas - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const isLoading = ref(false)
const logs = ref<any[]>([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})

// Filters
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')

// Statistics
const statistics = ref<any>(null)

// Fetch logs
async function fetchLogs() {
  isLoading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }
    if (search.value) params.aktivitas = search.value
    if (dateFrom.value) params.tanggal_dari = dateFrom.value
    if (dateTo.value) params.tanggal_sampai = dateTo.value

    const response = await $fetch('/api/log-aktivitas', {
      query: params,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.data) {
      logs.value = response.data
      if (response.meta) {
        pagination.value = {
          page: response.meta.page || 1,
          limit: response.meta.limit || 20,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch logs error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch statistics
async function fetchStatistics() {
  try {
    const response = await $fetch('/api/log-aktivitas/statistics', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('Fetch statistics error:', error)
  }
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

// Get activity icon
function getActivityIcon(aktivitas: string) {
  if (aktivitas.includes('LOGIN')) return 'i-lucide-log-in'
  if (aktivitas.includes('LOGOUT')) return 'i-lucide-log-out'
  if (aktivitas.includes('CREATE') || aktivitas.includes('TAMBAH')) return 'i-lucide-plus'
  if (aktivitas.includes('UPDATE') || aktivitas.includes('EDIT')) return 'i-lucide-edit'
  if (aktivitas.includes('DELETE') || aktivitas.includes('HAPUS')) return 'i-lucide-trash-2'
  if (aktivitas.includes('APPROVE') || aktivitas.includes('SETUJU')) return 'i-lucide-check'
  if (aktivitas.includes('REJECT') || aktivitas.includes('TOLAK')) return 'i-lucide-x'
  return 'i-lucide-activity'
}

// Get activity color
function getActivityColor(aktivitas: string) {
  if (aktivitas.includes('LOGIN')) return 'bg-green-100 text-green-700'
  if (aktivitas.includes('LOGOUT')) return 'bg-slate-100 text-slate-700'
  if (aktivitas.includes('CREATE') || aktivitas.includes('TAMBAH')) return 'bg-blue-100 text-blue-700'
  if (aktivitas.includes('UPDATE') || aktivitas.includes('EDIT')) return 'bg-purple-100 text-purple-700'
  if (aktivitas.includes('DELETE') || aktivitas.includes('HAPUS')) return 'bg-red-100 text-red-700'
  if (aktivitas.includes('APPROVE') || aktivitas.includes('SETUJU')) return 'bg-teal-100 text-teal-700'
  if (aktivitas.includes('REJECT') || aktivitas.includes('TOLAK')) return 'bg-orange-100 text-orange-700'
  return 'bg-slate-100 text-slate-700'
}

// Watchers
watch([search, dateFrom, dateTo], () => {
  pagination.value.page = 1
  fetchLogs()
})

watch(() => pagination.value.page, fetchLogs)

onMounted(() => {
  fetchLogs()
  fetchStatistics()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Log Aktivitas</h1>
        <p class="text-slate-600 mt-1">Monitor jejak digital seluruh aktivitas sistem</p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        @click="fetchLogs"
        variant="outline"
        class="font-semibold"
      >
        Refresh
      </UButton>
    </div>

    <!-- Statistics Cards -->
    <div v-if="statistics" class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-activity" class="text-2xl text-blue-600" />
          </div>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Total Aktivitas</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ statistics.total_logs || 0 }}
        </p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-log-in" class="text-2xl text-green-600" />
          </div>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Login Hari Ini</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ statistics.today_logins || 0 }}
        </p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-users" class="text-2xl text-purple-600" />
          </div>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Unique Users</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ statistics.unique_users || 0 }}
        </p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="text-2xl text-teal-600" />
          </div>
        </div>
        <h3 class="text-sm font-medium text-slate-500 mb-1">Aktivitas Minggu Ini</h3>
        <p class="text-3xl font-heading font-bold text-slate-900">
          {{ statistics.week_logs || 0 }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UInput
          v-model="search"
          placeholder="Cari aktivitas..."
          icon="i-lucide-search"
          size="lg"
        />
        <UInput
          v-model="dateFrom"
          type="date"
          placeholder="Tanggal Dari"
          icon="i-lucide-calendar"
          size="lg"
        />
        <UInput
          v-model="dateTo"
          type="date"
          placeholder="Tanggal Sampai"
          icon="i-lucide-calendar"
          size="lg"
        />
      </div>
    </div>

    <!-- Logs Timeline -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div class="p-6">
        <h2 class="font-heading font-bold text-lg text-slate-900 mb-6">Timeline Aktivitas</h2>

        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-start space-x-4 animate-pulse">
            <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="logs.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-file-text" class="text-6xl text-slate-300 mx-auto mb-4" />
          <p class="text-slate-500">Tidak ada log aktivitas</p>
        </div>

        <!-- Logs List -->
        <div v-else class="space-y-4">
          <div
            v-for="log in logs"
            :key="log.id_log"
            class="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
          >
            <!-- Icon -->
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getActivityColor(log.aktivitas)]">
              <UIcon :name="getActivityIcon(log.aktivitas)" class="text-lg" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-1">
                <div class="flex-1">
                  <p class="font-semibold text-slate-900">{{ log.aktivitas }}</p>
                  <p class="text-sm text-slate-600 mt-1">{{ log.detail || '-' }}</p>
                </div>
                <span class="text-xs text-slate-500 ml-4 whitespace-nowrap">
                  {{ formatDate(log.timestamp) }}
                </span>
              </div>

              <!-- User & IP Info -->
              <div class="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                <div class="flex items-center space-x-1">
                  <UIcon name="i-lucide-user" class="text-sm" />
                  <span>{{ log.user?.nama_lengkap || 'Unknown' }} (@{{ log.user?.username || '-' }})</span>
                </div>
                <div v-if="log.ip_address" class="flex items-center space-x-1">
                  <UIcon name="i-lucide-monitor" class="text-sm" />
                  <span class="font-mono">{{ log.ip_address }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
        <p class="text-sm text-slate-600">
          Halaman {{ pagination.page }} dari {{ pagination.totalPages }} ({{ pagination.total }} total)
        </p>
        <div class="flex items-center space-x-2">
          <UButton
            icon="i-lucide-chevron-left"
            size="sm"
            variant="outline"
            :disabled="pagination.page === 1"
            @click="pagination.page--"
          />
          <UButton
            icon="i-lucide-chevron-right"
            size="sm"
            variant="outline"
            :disabled="pagination.page === pagination.totalPages"
            @click="pagination.page++"
          />
        </div>
      </div>
    </div>
  </div>
</template>
