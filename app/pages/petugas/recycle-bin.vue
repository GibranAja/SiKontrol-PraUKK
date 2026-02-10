<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'petugas',
})

useHead({
  title: 'Recycle Bin - SiKontrol',
})

const authStore = useAuthStore()
const toast = useToast()
const isLoading = ref(false)

// Active tab
const activeTab = ref('users')

// Deleted items
const deletedUsers = ref<any[]>([])
const deletedCategories = ref<any[]>([])
const deletedEquipment = ref<any[]>([])

// Modal states
const isRestoreModalOpen = ref(false)
const isPermanentDeleteModalOpen = ref(false)
const selectedItem = ref<any>(null)
const selectedType = ref('')

async function fetchDeletedUsers() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/users', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) deletedUsers.value = response.data
  } catch (error) {
    console.error('Fetch deleted users error:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchDeletedCategories() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/kategori', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) deletedCategories.value = response.data
  } catch (error) {
    console.error('Fetch deleted categories error:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchDeletedEquipment() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/alat', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    if (response.success) deletedEquipment.value = response.data
  } catch (error) {
    console.error('Fetch deleted equipment error:', error)
  } finally {
    isLoading.value = false
  }
}

function openRestoreModal(item: any, type: string) {
  selectedItem.value = item
  selectedType.value = type
  isRestoreModalOpen.value = true
}

function openPermanentDeleteModal(item: any, type: string) {
  selectedItem.value = item
  selectedType.value = type
  isPermanentDeleteModalOpen.value = true
}

async function handleRestore() {
  if (!selectedItem.value || !selectedType.value) return
  isLoading.value = true
  try {
    let endpoint = ''
    switch (selectedType.value) {
      case 'user':
        endpoint = `/api/recycle-bin/users/${selectedItem.value.id_user}/restore`
        break
      case 'kategori':
        endpoint = `/api/recycle-bin/kategori/${selectedItem.value.id_kategori}/restore`
        break
      case 'alat':
        endpoint = `/api/recycle-bin/alat/${selectedItem.value.id_alat}/restore`
        break
    }
    const response = await $fetch(endpoint, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    }) as any
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Data berhasil dipulihkan', color: 'success' })
      isRestoreModalOpen.value = false
      selectedItem.value = null
      refreshCurrentTab()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

async function handlePermanentDelete() {
  if (!selectedItem.value || !selectedType.value) return
  isLoading.value = true
  try {
    let endpoint = ''
    switch (selectedType.value) {
      case 'user':
        endpoint = `/api/recycle-bin/users/${selectedItem.value.id_user}/permanent`
        break
      case 'kategori':
        endpoint = `/api/recycle-bin/kategori/${selectedItem.value.id_kategori}/permanent`
        break
      case 'alat':
        endpoint = `/api/recycle-bin/alat/${selectedItem.value.id_alat}/permanent`
        break
    }
    const response = await $fetch(endpoint, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    }) as any
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Data berhasil dihapus permanen', color: 'success' })
      isPermanentDeleteModalOpen.value = false
      selectedItem.value = null
      refreshCurrentTab()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function refreshCurrentTab() {
  switch (activeTab.value) {
    case 'users': fetchDeletedUsers(); break
    case 'categories': fetchDeletedCategories(); break
    case 'equipment': fetchDeletedEquipment(); break
  }
}

function getItemName() {
  if (!selectedItem.value) return ''
  switch (selectedType.value) {
    case 'user': return selectedItem.value.nama_lengkap || selectedItem.value.username
    case 'kategori': return selectedItem.value.nama_kategori
    case 'alat': return selectedItem.value.nama_alat
    default: return ''
  }
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
}

function formatRole(r: string) {
  return r === 'PEMINJAM' ? 'Peminjam' : r === 'PETUGAS' ? 'Petugas' : r === 'ADMIN' ? 'Admin' : r
}

function getRoleColor(r: string) {
  switch (r) {
    case 'ADMIN': return 'bg-purple-100 text-purple-700'
    case 'PETUGAS': return 'bg-teal-100 text-teal-700'
    case 'PEMINJAM': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const totalDeleted = computed(() => deletedUsers.value.length + deletedCategories.value.length + deletedEquipment.value.length)

watch(activeTab, (tab) => {
  if (tab === 'users') fetchDeletedUsers()
  else if (tab === 'categories') fetchDeletedCategories()
  else fetchDeletedEquipment()
})

onMounted(() => {
  fetchDeletedUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-heading font-bold text-2xl text-slate-900">Recycle Bin</h1>
      <p class="text-slate-600 mt-1">Pulihkan atau hapus permanen data yang telah dihapus</p>
    </div>

    <!-- Warning Banner -->
    <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-alert-triangle" class="text-xl text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-orange-800">Perhatian!</p>
          <p class="text-sm text-orange-700 mt-0.5">Data yang dihapus permanen tidak dapat dipulihkan. Pastikan Anda yakin sebelum menghapus permanen.</p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in [
            { key: 'users', label: 'Pengguna', icon: 'i-lucide-users', count: deletedUsers.length },
            { key: 'categories', label: 'Kategori', icon: 'i-lucide-folder', count: deletedCategories.length },
            { key: 'equipment', label: 'Alat', icon: 'i-lucide-wrench', count: deletedEquipment.length },
          ]"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeTab === tab.key
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
          ]"
        >
          <UIcon :name="tab.icon" class="text-lg" />
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-bold">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Dihapus</th>
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
            <tr v-else-if="deletedUsers.length === 0">
              <td colspan="5" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-400 mx-auto mb-3" />
                <p class="text-slate-500">Recycle bin kosong</p>
              </td>
            </tr>
            <tr v-else v-for="item in deletedUsers" :key="item.id_user" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {{ item.nama_lengkap?.charAt(0)?.toUpperCase() }}
                  </div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.nama_lengkap }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700 font-mono">{{ item.username }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getRoleColor(item.role)]">
                  {{ formatRole(item.role) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ formatDate(item.deleted_at) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <UButton icon="i-lucide-rotate-ccw" size="sm" color="success" variant="soft" @click="openRestoreModal(item, 'user')" title="Pulihkan" />
                  <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="soft" @click="openPermanentDeleteModal(item, 'user')" title="Hapus Permanen" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Categories Tab -->
      <div v-if="activeTab === 'categories'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Kategori</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Deskripsi</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Dihapus</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="4" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-loader-2" class="text-3xl text-teal-600 animate-spin mx-auto" />
                <p class="text-slate-500 mt-2">Memuat data...</p>
              </td>
            </tr>
            <tr v-else-if="deletedCategories.length === 0">
              <td colspan="4" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-400 mx-auto mb-3" />
                <p class="text-slate-500">Recycle bin kosong</p>
              </td>
            </tr>
            <tr v-else v-for="item in deletedCategories" :key="item.id_kategori" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-lucide-folder" class="text-red-500" />
                  </div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.nama_kategori }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-slate-600 max-w-xs truncate">{{ item.deskripsi || '-' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ formatDate(item.deleted_at) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <UButton icon="i-lucide-rotate-ccw" size="sm" color="success" variant="soft" @click="openRestoreModal(item, 'kategori')" title="Pulihkan" />
                  <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="soft" @click="openPermanentDeleteModal(item, 'kategori')" title="Hapus Permanen" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Equipment Tab -->
      <div v-if="activeTab === 'equipment'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Alat</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kategori</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Dihapus</th>
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
            <tr v-else-if="deletedEquipment.length === 0">
              <td colspan="5" class="px-6 py-12 text-center">
                <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-400 mx-auto mb-3" />
                <p class="text-slate-500">Recycle bin kosong</p>
              </td>
            </tr>
            <tr v-else v-for="item in deletedEquipment" :key="item.id_alat" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-lucide-wrench" class="text-red-500" />
                  </div>
                  <p class="text-sm font-semibold text-slate-900">{{ item.nama_alat }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700 font-mono">{{ item.kode_alat }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ item.kategori?.nama_kategori || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ formatDate(item.deleted_at) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <UButton icon="i-lucide-rotate-ccw" size="sm" color="success" variant="soft" @click="openRestoreModal(item, 'alat')" title="Pulihkan" />
                  <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="soft" @click="openPermanentDeleteModal(item, 'alat')" title="Hapus Permanen" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Restore Modal -->
    <LazyUModal v-model:open="isRestoreModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-rotate-ccw" class="text-xl text-green-600" />
            </div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Pulihkan Data</h3>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-700">
                Apakah Anda yakin ingin memulihkan <strong>{{ getItemName() }}</strong>? Data akan dikembalikan ke status aktif.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton variant="outline" @click="isRestoreModalOpen = false">Batal</UButton>
              <UButton color="success" :loading="isLoading" @click="handleRestore" class="font-semibold">
                <UIcon name="i-lucide-rotate-ccw" class="mr-1" /> Pulihkan
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </LazyUModal>

    <!-- Permanent Delete Modal -->
    <LazyUModal v-model:open="isPermanentDeleteModalOpen">
      <template #content>
        <div class="w-full max-w-md mx-auto">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-trash-2" class="text-xl text-red-600" />
            </div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Hapus Permanen</h3>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-red-700">
                <UIcon name="i-lucide-alert-triangle" class="mr-1 inline" />
                Apakah Anda yakin ingin menghapus <strong>{{ getItemName() }}</strong> secara permanen? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <UButton variant="outline" @click="isPermanentDeleteModalOpen = false">Batal</UButton>
              <UButton color="error" :loading="isLoading" @click="handlePermanentDelete" class="font-semibold">
                <UIcon name="i-lucide-trash-2" class="mr-1" /> Hapus Permanen
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </LazyUModal>
  </div>
</template>
