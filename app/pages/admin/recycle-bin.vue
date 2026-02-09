<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Recycle Bin - SiKontrol',
})

const { user } = useAuth()
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

// Fetch deleted users
async function fetchDeletedUsers() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/users', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      deletedUsers.value = response.data
    }
  } catch (error) {
    console.error('Fetch deleted users error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch deleted categories
async function fetchDeletedCategories() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/kategori', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      deletedCategories.value = response.data
    }
  } catch (error) {
    console.error('Fetch deleted categories error:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch deleted equipment
async function fetchDeletedEquipment() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/recycle-bin/alat', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      deletedEquipment.value = response.data
    }
  } catch (error) {
    console.error('Fetch deleted equipment error:', error)
  } finally {
    isLoading.value = false
  }
}

// Open restore modal
function openRestoreModal(item: any, type: string) {
  selectedItem.value = item
  selectedType.value = type
  isRestoreModalOpen.value = true
}

// Restore item
async function handleRestore() {
  if (!selectedItem.value || !selectedType.value) return
  isLoading.value = true
  try {
    let endpoint = ''
    let id = 0

    switch (selectedType.value) {
      case 'user':
        endpoint = `/api/recycle-bin/users/${selectedItem.value.id_user}/restore`
        id = selectedItem.value.id_user
        break
      case 'kategori':
        endpoint = `/api/recycle-bin/kategori/${selectedItem.value.id_kategori}/restore`
        id = selectedItem.value.id_kategori
        break
      case 'alat':
        endpoint = `/api/recycle-bin/alat/${selectedItem.value.id_alat}/restore`
        id = selectedItem.value.id_alat
        break
    }

    const response = await $fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    }) as any
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Data berhasil dipulihkan', color: 'success' })
      isRestoreModalOpen.value = false
      selectedItem.value = null
      selectedType.value = ''

      // Refresh data
      switch (activeTab.value) {
        case 'users':
          await fetchDeletedUsers()
          break
        case 'categories':
          await fetchDeletedCategories()
          break
        case 'equipment':
          await fetchDeletedEquipment()
          break
      }
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open permanent delete modal
function openPermanentDeleteModal(item: any, type: string) {
  selectedItem.value = item
  selectedType.value = type
  isPermanentDeleteModalOpen.value = true
}

// Permanent delete
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
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    }) as any
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Data berhasil dihapus permanen', color: 'success' })
      isPermanentDeleteModalOpen.value = false
      selectedItem.value = null
      selectedType.value = ''

      // Refresh data
      switch (activeTab.value) {
        case 'users':
          await fetchDeletedUsers()
          break
        case 'categories':
          await fetchDeletedCategories()
          break
        case 'equipment':
          await fetchDeletedEquipment()
          break
      }
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
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

// Watch tab changes
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'users':
      fetchDeletedUsers()
      break
    case 'categories':
      fetchDeletedCategories()
      break
    case 'equipment':
      fetchDeletedEquipment()
      break
  }
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
      <div class="flex items-start space-x-3">
        <UIcon name="i-lucide-alert-triangle" class="text-xl text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-orange-900">Perhatian!</p>
          <p class="text-sm text-orange-700 mt-1">
            Data di Recycle Bin bisa dipulihkan. Hapus permanen akan menghilangkan data selamanya dari database.
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-md border border-slate-100">
      <div class="border-b border-slate-200">
        <nav class="flex space-x-1 p-2">
          <button
            @click="activeTab = 'users'"
            :class="[
              'flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all',
              activeTab === 'users'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            <UIcon name="i-lucide-users" class="text-lg" />
            <span>Pengguna</span>
            <span v-if="deletedUsers.length > 0" :class="[
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            ]">
              {{ deletedUsers.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'categories'"
            :class="[
              'flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all',
              activeTab === 'categories'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            <UIcon name="i-lucide-folder" class="text-lg" />
            <span>Kategori</span>
            <span v-if="deletedCategories.length > 0" :class="[
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            ]">
              {{ deletedCategories.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'equipment'"
            :class="[
              'flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all',
              activeTab === 'equipment'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            <UIcon name="i-lucide-package" class="text-lg" />
            <span>Alat</span>
            <span v-if="deletedEquipment.length > 0" :class="[
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'equipment' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            ]">
              {{ deletedEquipment.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-5xl text-teal-600 animate-spin mx-auto mb-3" />
          <p class="text-slate-500">Memuat data...</p>
        </div>

        <!-- Users Tab -->
        <div v-else-if="activeTab === 'users'">
          <div v-if="deletedUsers.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-users" class="text-6xl text-slate-300 mx-auto mb-4" />
            <p class="text-slate-500">Tidak ada pengguna di Recycle Bin</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in deletedUsers"
              :key="item.id_user"
              class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-user" class="text-xl text-slate-600" />
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ item.nama_lengkap }}</p>
                  <p class="text-sm text-slate-500">@{{ item.username }} • {{ item.role }}</p>
                  <p class="text-xs text-slate-400 mt-1">
                    Dihapus: {{ formatDate(item.deleted_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <UButton
                  icon="i-lucide-rotate-ccw"
                  size="sm"
                  color="primary"
                  @click="openRestoreModal(item, 'user')"
                >
                  Pulihkan
                </UButton>
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  color="error"
                  variant="soft"
                  @click="openPermanentDeleteModal(item, 'user')"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Categories Tab -->
        <div v-else-if="activeTab === 'categories'">
          <div v-if="deletedCategories.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-folder" class="text-6xl text-slate-300 mx-auto mb-4" />
            <p class="text-slate-500">Tidak ada kategori di Recycle Bin</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in deletedCategories"
              :key="item.id_kategori"
              class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-folder" class="text-xl text-purple-600" />
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ item.nama_kategori }}</p>
                  <p class="text-sm text-slate-500">{{ item.deskripsi || 'Tidak ada deskripsi' }}</p>
                  <p class="text-xs text-slate-400 mt-1">
                    Dihapus: {{ formatDate(item.deleted_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <UButton
                  icon="i-lucide-rotate-ccw"
                  size="sm"
                  color="primary"
                  @click="openRestoreModal(item, 'kategori')"
                >
                  Pulihkan
                </UButton>
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  color="error"
                  variant="soft"
                  @click="openPermanentDeleteModal(item, 'kategori')"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Tab -->
        <div v-else-if="activeTab === 'equipment'">
          <div v-if="deletedEquipment.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-package" class="text-6xl text-slate-300 mx-auto mb-4" />
            <p class="text-slate-500">Tidak ada alat di Recycle Bin</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in deletedEquipment"
              :key="item.id_alat"
              class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-teal-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img v-if="item.gambar" :src="item.gambar" :alt="item.nama_alat" class="w-full h-full object-cover" />
                  <UIcon v-else name="i-lucide-package" class="text-xl text-teal-600" />
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ item.nama_alat }}</p>
                  <p class="text-sm text-slate-500">{{ item.kode_alat }} • Stok: {{ item.stok }}</p>
                  <p class="text-xs text-slate-400 mt-1">
                    Dihapus: {{ formatDate(item.deleted_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <UButton
                  icon="i-lucide-rotate-ccw"
                  size="sm"
                  color="primary"
                  @click="openRestoreModal(item, 'alat')"
                >
                  Pulihkan
                </UButton>
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  color="error"
                  variant="soft"
                  @click="openPermanentDeleteModal(item, 'alat')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Restore Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isRestoreModalOpen">
      <template #content>
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mx-auto mb-4">
          <UIcon name="i-lucide-rotate-ccw" class="text-2xl text-teal-600" />
        </div>
        <h3 class="font-heading font-bold text-xl text-slate-900 text-center mb-2">Pulihkan Data?</h3>
        <p class="text-slate-600 text-center mb-6">
          Data akan dikembalikan ke sistem dan bisa digunakan kembali.
        </p>
        <div class="flex justify-center space-x-3">
          <UButton variant="outline" @click="isRestoreModalOpen = false">Batal</UButton>
          <UButton color="primary" :loading="isLoading" @click="handleRestore" class="bg-teal-600 hover:bg-teal-700">
            Pulihkan
          </UButton>
        </div>
      </div>
      </template>
    </LazyUModal>

    <!-- Permanent Delete Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isPermanentDeleteModalOpen">
      <template #content>
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <UIcon name="i-lucide-alert-triangle" class="text-2xl text-red-600" />
        </div>
        <h3 class="font-heading font-bold text-xl text-slate-900 text-center mb-2">Hapus Permanen?</h3>
        <p class="text-slate-600 text-center mb-6">
          <strong class="text-red-600">PERINGATAN:</strong> Data akan dihapus permanen dari database dan tidak bisa dipulihkan lagi!
        </p>
        <div class="flex justify-center space-x-3">
          <UButton variant="outline" @click="isPermanentDeleteModalOpen = false">Batal</UButton>
          <UButton color="error" :loading="isLoading" @click="handlePermanentDelete">
            Hapus Permanen
          </UButton>
        </div>
      </div>
      </template>
    </LazyUModal>
  </div>
</template>
