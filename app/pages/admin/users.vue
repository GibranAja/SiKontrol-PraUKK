<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Kelola Pengguna - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const toast = useToast()
const isLoading = ref(false)
const users = ref<any[]>([])
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})

// Filters
const search = ref('')
const roleFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string | undefined>(undefined)

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isResetPasswordModalOpen = ref(false)
const selectedUser = ref<any>(null)

// Form data
const createForm = reactive({
  username: '',
  password: '',
  nama_lengkap: '',
  kelas: '',
  jenis_kelamin: '' as 'Laki-laki' | 'Perempuan' | '',
  role: 'PEMINJAM' as 'ADMIN' | 'PETUGAS' | 'PEMINJAM',
})

const editForm = reactive({
  username: '',
  nama_lengkap: '',
  kelas: '',
  jenis_kelamin: '' as 'Laki-laki' | 'Perempuan' | '',
  role: 'PEMINJAM' as 'ADMIN' | 'PETUGAS' | 'PEMINJAM',
  status_akun: 'AKTIF' as 'AKTIF' | 'DIBLOKIR' | 'NONAKTIF',
})

const newPassword = ref('')

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Petugas', value: 'PETUGAS' },
  { label: 'Peminjam', value: 'PEMINJAM' },
]

const statusOptions = [
  { label: 'Aktif', value: 'AKTIF' },
  { label: 'Diblokir', value: 'DIBLOKIR' },
  { label: 'Nonaktif', value: 'NONAKTIF' },
]

const kelasOptions = [
  'X RPL 1', 'X RPL 2', 'XI RPL 1', 'XI RPL 2', 'XII RPL 1', 'XII RPL 2',
  'X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2',
  'X MM 1', 'X MM 2', 'XI MM 1', 'XI MM 2', 'XII MM 1', 'XII MM 2',
]

const genderOptions = [
  { label: 'Laki-laki', value: 'Laki-laki' },
  { label: 'Perempuan', value: 'Perempuan' },
]

// Fetch users
async function fetchUsers() {
  isLoading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }
    if (search.value) params.search = search.value
    if (roleFilter.value && roleFilter.value !== 'ALL') params.role = roleFilter.value
    if (statusFilter.value && statusFilter.value !== 'ALL') params.status_akun = statusFilter.value

    const response = await $fetch('/api/users', {
      query: params,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.data) {
      users.value = response.data
      if (response.meta) {
        const pagData = response.meta
        pagination.value = {
          page: pagData.page || 1,
          limit: pagData.limit || 10,
          total: pagData.total || 0,
          totalPages: pagData.totalPages || 0,
        }
      }
    }
  } catch (error) {
    console.error('Fetch users error:', error)
  } finally {
    isLoading.value = false
  }
}

// Create user
async function handleCreate() {
  isLoading.value = true
  try {
    const response: any = await $fetch('/api/users', {
      method: 'POST',
      body: createForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.data) {
      toast.add({ title: 'Berhasil', description: 'Pengguna berhasil ditambahkan', color: 'success' })
      isCreateModalOpen.value = false
      Object.assign(createForm, {
        username: '',
        password: '',
        nama_lengkap: '',
        kelas: '',
        jenis_kelamin: '',
        role: 'PEMINJAM',
      })
      await fetchUsers()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open edit modal
function openEditModal(userData: any) {
  selectedUser.value = userData
  Object.assign(editForm, {
    username: userData.username,
    nama_lengkap: userData.nama_lengkap,
    kelas: userData.kelas,
    jenis_kelamin: userData.jenis_kelamin,
    role: userData.role,
    status_akun: userData.status_akun,
  })
  isEditModalOpen.value = true
}

// Update user
async function handleUpdate() {
  if (!selectedUser.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/users/${selectedUser.value.id_user}`, {
      method: 'PUT',
      body: editForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Pengguna berhasil diperbarui', color: 'success' })
      isEditModalOpen.value = false
      selectedUser.value = null
      await fetchUsers()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open delete modal
function openDeleteModal(userData: any) {
  selectedUser.value = userData
  isDeleteModalOpen.value = true
}

// Delete user
async function handleDelete() {
  if (!selectedUser.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/users/${selectedUser.value.id_user}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Pengguna berhasil dihapus', color: 'success' })
      isDeleteModalOpen.value = false
      selectedUser.value = null
      await fetchUsers()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open reset password modal
function openResetPasswordModal(userData: any) {
  selectedUser.value = userData
  newPassword.value = ''
  isResetPasswordModalOpen.value = true
}

// Reset password
async function handleResetPassword() {
  if (!selectedUser.value || !newPassword.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/users/change-password`, {
      method: 'PATCH',
      body: {
        id_user: selectedUser.value.id_user,
        new_password: newPassword.value,
      },
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.success) {
      toast.add({ title: 'Berhasil', description: 'Password berhasil direset', color: 'success' })
      isResetPasswordModalOpen.value = false
      selectedUser.value = null
      newPassword.value = ''
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Toggle user status
async function toggleUserStatus(userData: any) {
  const newStatus = userData.status_akun === 'AKTIF' ? 'DIBLOKIR' : 'AKTIF'
  try {
    const response: any = await $fetch(`/api/users/${userData.id_user}/status`, {
      method: 'PATCH',
      body: { status_akun: newStatus },
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.data) {
      toast.add({
        title: 'Berhasil',
        description: `Status pengguna ${newStatus === 'AKTIF' ? 'diaktifkan' : 'diblokir'}`,
        color: 'success'
      })
      await fetchUsers()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  }
}

// Watchers for filters
watch([search, roleFilter, statusFilter], () => {
  pagination.value.page = 1
  fetchUsers()
})

watch(() => pagination.value.page, fetchUsers)

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Kelola Pengguna</h1>
        <p class="text-slate-600 mt-1">Tambah, edit, dan hapus pengguna sistem</p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-user-plus"
        @click="isCreateModalOpen = true"
        class="bg-teal-600 hover:bg-teal-700 font-semibold"
      >
        Tambah Pengguna
      </UButton>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-md border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UInput
          v-model="search"
          placeholder="Cari username, nama, kelas..."
          icon="i-lucide-search"
          size="lg"
        />
        <USelect
          v-model="roleFilter"
          :items="[{ label: 'Semua Role', value: 'ALL' }, ...roleOptions]"
          placeholder="Filter Role"
          size="lg"
        />
        <USelect
          v-model="statusFilter"
          :items="[{ label: 'Semua Status', value: 'ALL' }, ...statusOptions]"
          placeholder="Filter Status"
          size="lg"
        />
        <UButton
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="fetchUsers"
          size="lg"
          class="font-semibold"
        >
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
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Pengguna
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Kelas
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="5" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-users" class="text-5xl text-slate-300 mx-auto mb-3" />
                <p class="text-slate-500">Tidak ada data pengguna</p>
              </td>
            </tr>
            <tr v-else v-for="userItem in users" :key="userItem.id_user" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-lucide-user" class="text-teal-600 text-lg" />
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900">{{ userItem.nama_lengkap }}</p>
                    <p class="text-sm text-slate-500">@{{ userItem.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ userItem.kelas }}</span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    userItem.role === 'ADMIN'
                      ? 'bg-red-100 text-red-700'
                      : userItem.role === 'PETUGAS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700',
                  ]"
                >
                  {{ userItem.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    userItem.status_akun === 'AKTIF'
                      ? 'bg-green-100 text-green-700'
                      : userItem.status_akun === 'DIBLOKIR'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700',
                  ]"
                >
                  {{ userItem.status_akun }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <UButton
                    icon="i-lucide-edit"
                    size="sm"
                    color="primary"
                    variant="soft"
                    @click="openEditModal(userItem)"
                    title="Edit"
                  />
                  <UButton
                    :icon="userItem.status_akun === 'AKTIF' ? 'i-lucide-lock' : 'i-lucide-unlock'"
                    size="sm"
                    :color="userItem.status_akun === 'AKTIF' ? 'warning' : 'success'"
                    variant="soft"
                    @click="toggleUserStatus(userItem)"
                    :title="userItem.status_akun === 'AKTIF' ? 'Blokir' : 'Aktifkan'"
                  />
                  <UButton
                    icon="i-lucide-key"
                    size="sm"
                    color="primary"
                    variant="soft"
                    @click="openResetPasswordModal(userItem)"
                    title="Reset Password"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    size="sm"
                    color="error"
                    variant="soft"
                    @click="openDeleteModal(userItem)"
                    title="Hapus"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
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

    <!-- Create Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isCreateModalOpen">
      <div class="p-6">
        <h3 class="font-heading font-bold text-xl text-slate-900 mb-6">Tambah Pengguna Baru</h3>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Nama Lengkap" required>
              <UInput v-model="createForm.nama_lengkap" placeholder="Masukkan nama lengkap" size="lg" />
            </UFormField>

            <UFormField label="Username" required>
              <UInput v-model="createForm.username" placeholder="Masukkan username" size="lg" />
            </UFormField>

            <UFormField label="Password" required>
              <UInput v-model="createForm.password" type="password" placeholder="Min. 6 karakter" size="lg" />
            </UFormField>

            <UFormField label="Kelas" required>
              <USelect v-model="createForm.kelas" :items="kelasOptions" placeholder="Pilih kelas" size="lg" />
            </UFormField>

            <UFormField label="Jenis Kelamin" required>
              <USelect v-model="createForm.jenis_kelamin" :items="genderOptions" placeholder="Pilih" size="lg" />
            </UFormField>

            <UFormField label="Role" required>
              <USelect v-model="createForm.role" :items="roleOptions" size="lg" />
            </UFormField>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton type="button" variant="outline" @click="isCreateModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading" class="bg-teal-600 hover:bg-teal-700">
              Simpan
            </UButton>
          </div>
        </form>
      </div>
    </LazyUModal>

    <!-- Edit Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isEditModalOpen">
      <div class="p-6">
        <h3 class="font-heading font-bold text-xl text-slate-900 mb-6">Edit Pengguna</h3>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Nama Lengkap" required>
              <UInput v-model="editForm.nama_lengkap" size="lg" />
            </UFormField>

            <UFormField label="Username" required>
              <UInput v-model="editForm.username" size="lg" />
            </UFormField>

            <UFormField label="Kelas" required>
              <USelect v-model="editForm.kelas" :items="kelasOptions" size="lg" />
            </UFormField>

            <UFormField label="Jenis Kelamin" required>
              <USelect v-model="editForm.jenis_kelamin" :items="genderOptions" size="lg" />
            </UFormField>

            <UFormField label="Role" required>
              <USelect v-model="editForm.role" :items="roleOptions" size="lg" />
            </UFormField>

            <UFormField label="Status Akun" required>
              <USelect v-model="editForm.status_akun" :items="statusOptions" size="lg" />
            </UFormField>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton type="button" variant="outline" @click="isEditModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading" class="bg-teal-600 hover:bg-teal-700">
              Update
            </UButton>
          </div>
        </form>
      </div>
    </LazyUModal>

    <!-- Delete Confirmation Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isDeleteModalOpen">
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <UIcon name="i-lucide-trash-2" class="text-2xl text-red-600" />
        </div>
        <h3 class="font-heading font-bold text-xl text-slate-900 text-center mb-2">Hapus Pengguna?</h3>
        <p class="text-slate-600 text-center mb-6">
          Anda yakin ingin menghapus <strong>{{ selectedUser?.nama_lengkap }}</strong>?
          <br />Data akan masuk ke Recycle Bin.
        </p>
        <div class="flex justify-center space-x-3">
          <UButton variant="outline" @click="isDeleteModalOpen = false">Batal</UButton>
          <UButton color="error" :loading="isLoading" @click="handleDelete">Hapus</UButton>
        </div>
      </div>
    </LazyUModal>

    <!-- Reset Password Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isResetPasswordModalOpen">
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4">
          <UIcon name="i-lucide-key" class="text-2xl text-purple-600" />
        </div>
        <h3 class="font-heading font-bold text-xl text-slate-900 text-center mb-2">Reset Password</h3>
        <p class="text-slate-600 text-center mb-4">
          Reset password untuk <strong>{{ selectedUser?.nama_lengkap }}</strong>
        </p>
        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <UFormField label="Password Baru" required>
            <UInput
              v-model="newPassword"
              type="password"
              placeholder="Masukkan password baru (min. 6 karakter)"
              size="lg"
            />
          </UFormField>
          <div class="flex justify-center space-x-3 pt-2">
            <UButton type="button" variant="outline" @click="isResetPasswordModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading" :disabled="newPassword.length < 6">
              Reset Password
            </UButton>
          </div>
        </form>
      </div>
    </LazyUModal>
  </div>
</template>
