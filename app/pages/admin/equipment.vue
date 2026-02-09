<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Kelola Alat - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const toast = useToast()
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

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isStockModalOpen = ref(false)
const isConditionModalOpen = ref(false)
const selectedEquipment = ref<any>(null)

// Form data
const createForm = reactive({
  nama_alat: '',
  kode_alat: '',
  id_kategori: '',
  stok: 0,
  kondisi: 'BAIK' as 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | 'HILANG' | 'PERBAIKAN',
  spesifikasi: '',
  harga: 0,
  gambar: '',
})

const editForm = reactive({
  nama_alat: '',
  kode_alat: '',
  id_kategori: '',
  spesifikasi: '',
  harga: 0,
  gambar: '',
})

const stockForm = reactive({
  stok: 0,
})

const conditionForm = reactive({
  kondisi: 'BAIK' as 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | 'HILANG' | 'PERBAIKAN',
})

const kondisiOptions = [
  { label: 'Baik', value: 'BAIK' },
  { label: 'Rusak Ringan', value: 'RUSAK_RINGAN' },
  { label: 'Rusak Berat', value: 'RUSAK_BERAT' },
  { label: 'Hilang', value: 'HILANG' },
  { label: 'Perbaikan', value: 'PERBAIKAN' },
]

// Image preview
const createImagePreview = ref('')
const editImagePreview = ref('')

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Handle image upload for create form
async function handleCreateImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.add({ title: 'Error', description: 'Ukuran gambar maksimal 2MB', color: 'error' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.add({ title: 'Error', description: 'File harus berupa gambar', color: 'error' })
      return
    }

    try {
      const base64 = await fileToBase64(file)
      createForm.gambar = base64
      createImagePreview.value = base64
    } catch (error) {
      toast.add({ title: 'Error', description: 'Gagal mengupload gambar', color: 'error' })
    }
  }
}

// Handle image upload for edit form
async function handleEditImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast.add({ title: 'Error', description: 'Ukuran gambar maksimal 2MB', color: 'error' })
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.add({ title: 'Error', description: 'File harus berupa gambar', color: 'error' })
      return
    }

    try {
      const base64 = await fileToBase64(file)
      editForm.gambar = base64
      editImagePreview.value = base64
    } catch (error) {
      toast.add({ title: 'Error', description: 'Gagal mengupload gambar', color: 'error' })
    }
  }
}

// Fetch categories
async function fetchCategories() {
  try {
    const response = await $fetch('/api/kategori', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
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
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
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

// Create equipment
async function handleCreate() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/alat', {
      method: 'POST',
      body: createForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Alat berhasil ditambahkan', color: 'success' })
      isCreateModalOpen.value = false
      Object.assign(createForm, {
        nama_alat: '',
        kode_alat: '',
        id_kategori: '',
        stok: 0,
        kondisi: 'BAIK',
        spesifikasi: '',
        harga: 0,
        gambar: '',
      })
      createImagePreview.value = ''
      await fetchEquipment()
    }
  } catch (error: any) {
    const errorMessage = error.data?.data?.message || error.data?.message || error.message || 'Terjadi kesalahan'
    toast.add({ title: 'Gagal', description: errorMessage, color: 'error' })
    console.error('Create equipment error:', error)
  } finally {
    isLoading.value = false
  }
}

// Open edit modal
function openEditModal(item: any) {
  selectedEquipment.value = item
  Object.assign(editForm, {
    nama_alat: item.nama_alat,
    kode_alat: item.kode_alat,
    id_kategori: item.id_kategori,
    spesifikasi: item.spesifikasi || '',
    harga: item.harga,
    gambar: item.gambar || '',
  })
  editImagePreview.value = item.gambar || ''
  isEditModalOpen.value = true
}

// Update equipment
async function handleUpdate() {
  if (!selectedEquipment.value) return
  isLoading.value = true
  try {
    const response = await $fetch(`/api/alat/${selectedEquipment.value.id_alat}`, {
      method: 'PUT',
      body: editForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.data) {
      toast.add({ title: 'Berhasil', description: 'Alat berhasil diperbarui', color: 'success' })
      isEditModalOpen.value = false
      selectedEquipment.value = null
      editImagePreview.value = ''
      await fetchEquipment()
    }
  } catch (error: any) {
    const errorMessage = error.data?.data?.message || error.data?.message || error.message || 'Terjadi kesalahan'
    toast.add({ title: 'Gagal', description: errorMessage, color: 'error' })
    console.error('Create equipment error:', error)
  } finally {
    isLoading.value = false
  }
}

// Open stock modal
function openStockModal(item: any) {
  selectedEquipment.value = item
  stockForm.stok = item.stok
  isStockModalOpen.value = true
}

// Update stock
async function handleUpdateStock() {
  if (!selectedEquipment.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/alat/${selectedEquipment.value.id_alat}/stok`, {
      method: 'PATCH',
      body: stockForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.data) {
      toast.add({ title: 'Berhasil', description: 'Stok berhasil diperbarui', color: 'success' })
      isStockModalOpen.value = false
      selectedEquipment.value = null
      await fetchEquipment()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open condition modal
function openConditionModal(item: any) {
  selectedEquipment.value = item
  conditionForm.kondisi = item.kondisi
  isConditionModalOpen.value = true
}

// Update condition
async function handleUpdateCondition() {
  if (!selectedEquipment.value) return
  isLoading.value = true
  try {
    const response: any = await $fetch(`/api/alat/${selectedEquipment.value.id_alat}/kondisi`, {
      method: 'PATCH',
      body: conditionForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response?.data) {
      toast.add({ title: 'Berhasil', description: 'Kondisi berhasil diperbarui', color: 'success' })
      isConditionModalOpen.value = false
      selectedEquipment.value = null
      await fetchEquipment()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open delete modal
function openDeleteModal(item: any) {
  selectedEquipment.value = item
  isDeleteModalOpen.value = true
}

// Delete equipment
async function handleDelete() {
  if (!selectedEquipment.value) return
  isLoading.value = true
  try {
    const response = await $fetch(`/api/alat/${selectedEquipment.value.id_alat}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Alat berhasil dihapus', color: 'success' })
      isDeleteModalOpen.value = false
      selectedEquipment.value = null
      await fetchEquipment()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Get condition badge color
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

// Format condition label
function formatKondisi(kondisi: string) {
  return kondisi.replace(/_/g, ' ')
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
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Kelola Alat</h1>
        <p class="text-slate-600 mt-1">Tambah, edit, dan kelola alat peminjaman</p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-package-plus"
        @click="isCreateModalOpen = true"
        class="bg-teal-600 hover:bg-teal-700 font-semibold"
      >
        Tambah Alat
      </UButton>
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
        <UButton
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="fetchEquipment"
          size="lg"
          class="font-semibold"
        >
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Equipment Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="bg-white rounded-xl p-4 shadow-md animate-pulse">
        <div class="h-48 bg-slate-200 rounded-lg mb-4"></div>
        <div class="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="equipment.length === 0" class="bg-white rounded-xl p-12 shadow-md border border-slate-100 text-center">
      <UIcon name="i-lucide-package" class="text-6xl text-slate-300 mx-auto mb-4" />
      <p class="text-slate-500 text-lg">Belum ada alat</p>
      <UButton
        color="primary"
        icon="i-lucide-package-plus"
        @click="isCreateModalOpen = true"
        class="bg-teal-600 hover:bg-teal-700 font-semibold mt-4"
      >
        Tambah Alat Pertama
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in equipment"
        :key="item.id_alat"
        class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100 overflow-hidden group"
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
            <h3 class="font-heading font-bold text-slate-900 mb-1 line-clamp-1">
              {{ item.nama_alat }}
            </h3>
            <p class="text-xs text-slate-500 font-mono">{{ item.kode_alat }}</p>
          </div>

          <!-- Category & Condition -->
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
              {{ item.kategori?.nama_kategori }}
            </span>
            <span :class="['px-2 py-1 rounded-md text-xs font-semibold', getConditionColor(item.kondisi)]">
              {{ formatKondisi(item.kondisi) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-2">
            <UButton
              icon="i-lucide-edit"
              size="sm"
              color="primary"
              variant="soft"
              @click="openEditModal(item)"
              block
            >
              Edit
            </UButton>
            <UButton
              icon="i-lucide-package"
              size="sm"
              color="warning"
              variant="soft"
              @click="openStockModal(item)"
              block
            >
              Stok
            </UButton>
            <UButton
              icon="i-lucide-wrench"
              size="sm"
              color="primary"
              variant="soft"
              @click="openConditionModal(item)"
              block
            >
              Kondisi
            </UButton>
            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              color="error"
              variant="soft"
              @click="openDeleteModal(item)"
              block
            >
              Hapus
            </UButton>
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

    <!-- Create Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isCreateModalOpen">
      <template #content>
      <div class="p-6 max-h-[90vh] overflow-y-auto">
        <UDialogTitle class="font-heading font-bold text-xl text-slate-900 mb-2">Tambah Alat Baru</UDialogTitle>
        <UDialogDescription class="text-slate-600 mb-6">Isi form di bawah untuk menambahkan alat baru ke sistem</UDialogDescription>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <!-- Image Upload -->
          <UFormField label="Gambar Alat (Base64)">
            <div class="space-y-3">
              <input
                type="file"
                accept="image/*"
                @change="handleCreateImageUpload"
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              <p class="text-xs text-slate-500">Max 2MB. Gambar akan disimpan sebagai Base64 untuk performa optimal.</p>
              <div v-if="createImagePreview" class="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
                <img :src="createImagePreview" alt="Preview" class="w-full h-full object-contain" />
                <button
                  type="button"
                  @click="createImagePreview = ''; createForm.gambar = ''"
                  class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Nama Alat" required>
              <UInput v-model="createForm.nama_alat" placeholder="Contoh: Laptop Dell" size="lg" />
            </UFormField>

            <UFormField label="Kode Alat" required>
              <UInput v-model="createForm.kode_alat" placeholder="Contoh: LPT-001" size="lg" />
            </UFormField>

            <UFormField label="Kategori" required>
              <USelect v-model="createForm.id_kategori" :items="categories" placeholder="Pilih kategori" size="lg" />
            </UFormField>

            <UFormField label="Stok Awal" required>
              <UInput v-model.number="createForm.stok" type="number" min="0" size="lg" />
            </UFormField>

            <UFormField label="Kondisi" required>
              <USelect v-model="createForm.kondisi" :items="kondisiOptions" size="lg" />
            </UFormField>

            <UFormField label="Harga Penggantian" required>
              <UInput v-model.number="createForm.harga" type="number" min="0" placeholder="Rp" size="lg" />
            </UFormField>
          </div>

          <UFormField label="Spesifikasi">
            <UTextarea v-model="createForm.spesifikasi" placeholder="Detail spesifikasi alat" :rows="3" size="lg" />
          </UFormField>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton type="button" variant="outline" @click="isCreateModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading" class="bg-teal-600 hover:bg-teal-700">
              Simpan Alat
            </UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Edit Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isEditModalOpen">
      <template #content>
      <div class="p-6 max-h-[90vh] overflow-y-auto">
        <UDialogTitle class="font-heading font-bold text-xl text-slate-900 mb-2">Edit Alat</UDialogTitle>
        <UDialogDescription class="text-slate-600 mb-6">Perbarui informasi alat {{ selectedEquipment?.nama_alat }}</UDialogDescription>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <!-- Image Upload -->
          <UFormField label="Gambar Alat (Base64)">
            <div class="space-y-3">
              <input
                type="file"
                accept="image/*"
                @change="handleEditImageUpload"
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              <p class="text-xs text-slate-500">Max 2MB. Gambar akan disimpan sebagai Base64.</p>
              <div v-if="editImagePreview" class="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
                <img :src="editImagePreview" alt="Preview" class="w-full h-full object-contain" />
                <button
                  type="button"
                  @click="editImagePreview = ''; editForm.gambar = ''"
                  class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Nama Alat" required>
              <UInput v-model="editForm.nama_alat" size="lg" />
            </UFormField>

            <UFormField label="Kode Alat" required>
              <UInput v-model="editForm.kode_alat" size="lg" />
            </UFormField>

            <UFormField label="Kategori" required>
              <USelect v-model="editForm.id_kategori" :items="categories" size="lg" />
            </UFormField>

            <UFormField label="Harga Penggantian" required>
              <UInput v-model.number="editForm.harga" type="number" min="0" size="lg" />
            </UFormField>
          </div>

          <UFormField label="Spesifikasi">
            <UTextarea v-model="editForm.spesifikasi" :rows="3" size="lg" />
          </UFormField>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton type="button" variant="outline" @click="isEditModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading" class="bg-teal-600 hover:bg-teal-700">
              Update Alat
            </UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Stock Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isStockModalOpen">
      <template #content>
      <div class="p-6">
        <UDialogTitle class="font-heading font-bold text-xl text-slate-900 mb-2">Update Stok</UDialogTitle>
        <UDialogDescription class="text-slate-600 mb-4">Ubah jumlah stok untuk {{ selectedEquipment?.nama_alat }}</UDialogDescription>
        <form @submit.prevent="handleUpdateStock" class="space-y-4">
          <UFormField label="Jumlah Stok" required>
            <UInput v-model.number="stockForm.stok" type="number" min="0" size="lg" />
          </UFormField>
          <div class="flex justify-end space-x-3">
            <UButton type="button" variant="outline" @click="isStockModalOpen = false">Batal</UButton>
            <UButton type="submit" color="warning" :loading="isLoading">Update Stok</UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Condition Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isConditionModalOpen">
      <template #content>
      <div class="p-6">
        <UDialogTitle class="font-heading font-bold text-xl text-slate-900 mb-2">Update Kondisi</UDialogTitle>
        <UDialogDescription class="text-slate-600 mb-4">Ubah kondisi untuk {{ selectedEquipment?.nama_alat }}</UDialogDescription>
        <form @submit.prevent="handleUpdateCondition" class="space-y-4">
          <UFormField label="Kondisi" required>
            <USelect v-model="conditionForm.kondisi" :items="kondisiOptions" size="lg" />
          </UFormField>
          <div class="flex justify-end space-x-3">
            <UButton type="button" variant="outline" @click="isConditionModalOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="isLoading">Update Kondisi</UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Delete Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isDeleteModalOpen">
      <template #content>
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <UIcon name="i-lucide-trash-2" class="text-2xl text-red-600" />
        </div>
        <UDialogTitle class="font-heading font-bold text-xl text-slate-900 text-center mb-2">Hapus Alat?</UDialogTitle>
        <UDialogDescription class="text-slate-600 text-center mb-6">
          Anda yakin ingin menghapus <strong>{{ selectedEquipment?.nama_alat }}</strong>?
          <br />Data akan masuk ke Recycle Bin.
        </UDialogDescription>
        <div class="flex justify-center space-x-3">
          <UButton variant="outline" @click="isDeleteModalOpen = false">Batal</UButton>
          <UButton color="error" :loading="isLoading" @click="handleDelete">Hapus</UButton>
        </div>
      </div>
      </template>
    </LazyUModal>
  </div>
</template>
