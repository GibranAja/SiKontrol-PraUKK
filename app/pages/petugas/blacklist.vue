<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Kontrol Disiplin - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const users = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })

// Filters
const search = ref('')
const statusFilter = ref<string | undefined>(undefined)

const statusOptions = [
  { label: 'Aktif', value: 'AKTIF' },
  { label: 'Diblokir', value: 'DIBLOKIR' },
]

// Modal
const isConfirmModalOpen = ref(false)
const selectedUser = ref<any>(null)
const targetStatus = ref<'DIBLOKIR' | 'AKTIF'>('DIBLOKIR')

async function fetchUsers() {
  isLoading.value = true
  try {
    const params: any = { page: pagination.value.page, limit: pagination.value.limit, role: 'PEMINJAM' }
    if (search.value) params.search = search.value
    if (statusFilter.value && statusFilter.value !== 'ALL') params.status = statusFilter.value

    const response = await $fetch('/api/users', {
      query: params,
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.data) {
      users.value = response.data
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
    console.error('Fetch users error:', error)
  } finally {
    isLoading.value = false
  }
}

function openBlockModal(user: any) {
  selectedUser.value = user
  targetStatus.value = 'DIBLOKIR'
  isConfirmModalOpen.value = true
}

function openUnblockModal(user: any) {
  selectedUser.value = user
  targetStatus.value = 'AKTIF'
  isConfirmModalOpen.value = true
}

async function handleStatusChange() {
  if (!selectedUser.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/users/${selectedUser.value.id_user}/status`, {
      method: 'PATCH',
      body: { status_akun: targetStatus.value },
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response?.success) {
      const msg = targetStatus.value === 'DIBLOKIR'
        ? `${selectedUser.value.nama_lengkap} berhasil diblokir`
        : `${selectedUser.value.nama_lengkap} berhasil diaktifkan kembali`
      toast.add({ title: 'Berhasil', description: msg, color: 'success' })
      isConfirmModalOpen.value = false
      selectedUser.value = null
      await fetchUsers()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.data?.error?.message || error.data?.error?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function getStatusColor(s: string) {
  switch (s) {
    case 'AKTIF': return 'bg-green-100 text-green-700'
    case 'DIBLOKIR': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatStatus(s: string) {
  return s === 'AKTIF' ? 'Aktif' : s === 'DIBLOKIR' ? 'Diblokir' : s
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}

// Summary counts
const totalBlocked = computed(() => users.value.filter(u => u.status_akun === 'DIBLOKIR').length)
const totalActive = computed(() => users.value.filter(u => u.status_akun === 'AKTIF').length)

watch([search, statusFilter], () => {
  pagination.value.page = 1
  fetchUsers()
})

watch(() => pagination.value.page, fetchUsers)

onMounted(() => fetchUsers())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Kontrol Disiplin</h1>
      <p class="text-slate-600 mt-1">Kelola blacklist / whitelist peminjam</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-md border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-users" class="text-xl text-slate-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ pagination.total }}</p>
            <p class="text-xs text-slate-500">Total Peminjam</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-md border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-user-check" class="text-xl text-green-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ totalActive }}</p>
            <p class="text-xs text-slate-500">Akun Aktif</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-md border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-user-x" class="text-xl text-red-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ totalBlocked }}</p>
            <p class="text-xs text-slate-500">Akun Diblokir</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UInput v-model="search" placeholder="Cari nama, username, kelas..." icon="i-lucide-search" size="lg" />
        <USelect
          v-model="statusFilter"
          :items="[{ label: 'Semua Status', value: 'ALL' }, ...statusOptions]"
          placeholder="Filter Status"
          size="lg"
        />
        <UButton variant="outline" icon="i-lucide-refresh-cw" @click="fetchUsers" size="lg" class="font-semibold">
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
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kelas</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tgl Daftar</th>
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
            <tr v-else-if="users.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-users" class="text-5xl text-slate-300 mx-auto mb-3" />
                <p class="text-slate-500">Tidak ada data peminjam</p>
              </td>
            </tr>
            <tr v-else v-for="user in users" :key="user.id_user" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                       :class="user.status_akun === 'DIBLOKIR' ? 'bg-red-500' : 'bg-teal-600'">
                    {{ user.nama_lengkap?.charAt(0)?.toUpperCase() }}
                  </div>
                  <p class="text-sm font-semibold text-slate-900">{{ user.nama_lengkap }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700 font-mono">{{ user.username }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ user.kelas || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ formatDate(user.created_at) }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(user.status_akun)]">
                  {{ formatStatus(user.status_akun) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center">
                  <UButton
                    v-if="user.status_akun === 'AKTIF'"
                    icon="i-lucide-ban"
                    size="sm"
                    color="error"
                    variant="soft"
                    @click="openBlockModal(user)"
                    title="Blokir pengguna"
                  >
                    Blokir
                  </UButton>
                  <UButton
                    v-else
                    icon="i-lucide-check-circle"
                    size="sm"
                    color="success"
                    variant="soft"
                    @click="openUnblockModal(user)"
                    title="Aktifkan kembali"
                  >
                    Aktifkan
                  </UButton>
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

    <!-- Confirm Modal -->
    <LazyUModal v-model:open="isConfirmModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', targetStatus === 'DIBLOKIR' ? 'bg-red-100' : 'bg-green-100']">
              <UIcon :name="targetStatus === 'DIBLOKIR' ? 'i-lucide-ban' : 'i-lucide-check-circle'" :class="['text-xl', targetStatus === 'DIBLOKIR' ? 'text-red-600' : 'text-green-600']" />
            </div>
            <div>
              <h3 class="font-heading font-bold text-lg text-slate-900">
                {{ targetStatus === 'DIBLOKIR' ? 'Blokir Pengguna' : 'Aktifkan Pengguna' }}
              </h3>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div :class="['border rounded-lg p-4', targetStatus === 'DIBLOKIR' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200']">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                     :class="selectedUser?.status_akun === 'DIBLOKIR' ? 'bg-red-500' : 'bg-teal-600'">
                  {{ selectedUser?.nama_lengkap?.charAt(0)?.toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ selectedUser?.nama_lengkap }}</p>
                  <p class="text-xs text-slate-500">{{ selectedUser?.username }} &bull; {{ selectedUser?.kelas || '-' }}</p>
                </div>
              </div>

              <p class="text-sm" :class="targetStatus === 'DIBLOKIR' ? 'text-red-700' : 'text-green-700'">
                <template v-if="targetStatus === 'DIBLOKIR'">
                  <UIcon name="i-lucide-alert-triangle" class="mr-1 inline" />
                  Pengguna yang diblokir tidak akan dapat login dan semua sesi aktif akan diakhiri.
                </template>
                <template v-else>
                  <UIcon name="i-lucide-info" class="mr-1 inline" />
                  Pengguna akan dapat mengakses sistem kembali setelah diaktifkan.
                </template>
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton variant="outline" @click="isConfirmModalOpen = false">Batal</UButton>
              <UButton
                :color="targetStatus === 'DIBLOKIR' ? 'error' : 'success'"
                :loading="isLoading"
                @click="handleStatusChange"
                class="font-semibold"
              >
                <UIcon :name="targetStatus === 'DIBLOKIR' ? 'i-lucide-ban' : 'i-lucide-check'" class="mr-1" />
                {{ targetStatus === 'DIBLOKIR' ? 'Blokir' : 'Aktifkan' }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
