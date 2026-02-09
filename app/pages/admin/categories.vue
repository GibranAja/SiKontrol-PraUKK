<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Kelola Kategori - SiKontrol',
})

const { user } = useAuth()
const authStore = useAuthStore()

const toast = useToast()
const isLoading = ref(false)
const categories = ref<any[]>([])

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedCategory = ref<any>(null)

// Form data
const createForm = reactive({
  nama_kategori: '',
  deskripsi: '',
})

const editForm = reactive({
  nama_kategori: '',
  deskripsi: '',
})

// Fetch categories
async function fetchCategories() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/kategori', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('Fetch categories error:', error)
  } finally {
    isLoading.value = false
  }
}

// Create category
async function handleCreate() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/kategori', {
      method: 'POST',
      body: createForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Kategori berhasil ditambahkan', color: 'success' })
      isCreateModalOpen.value = false
      Object.assign(createForm, { nama_kategori: '', deskripsi: '' })
      await fetchCategories()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open edit modal
function openEditModal(category: any) {
  selectedCategory.value = category
  Object.assign(editForm, {
    nama_kategori: category.nama_kategori,
    deskripsi: category.deskripsi || '',
  })
  isEditModalOpen.value = true
}

// Update category
async function handleUpdate() {
  if (!selectedCategory.value) return
  isLoading.value = true
  try {
    const response = await $fetch(`/api/kategori/${selectedCategory.value.id_kategori}`, {
      method: 'PUT',
      body: editForm,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Kategori berhasil diperbarui', color: 'success' })
      isEditModalOpen.value = false
      selectedCategory.value = null
      await fetchCategories()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// Open delete modal
function openDeleteModal(category: any) {
  selectedCategory.value = category
  isDeleteModalOpen.value = true
}

// Delete category
async function handleDelete() {
  if (!selectedCategory.value) return
  isLoading.value = true
  try {
    const response = await $fetch(`/api/kategori/${selectedCategory.value.id_kategori}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    if (response.success) {
      toast.add({ title: 'Berhasil', description: 'Kategori berhasil dihapus', color: 'success' })
      isDeleteModalOpen.value = false
      selectedCategory.value = null
      await fetchCategories()
    }
  } catch (error: any) {
    toast.add({ title: 'Gagal', description: error.data?.message || 'Terjadi kesalahan', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading font-bold text-2xl text-slate-900">Kelola Kategori</h1>
        <p class="text-slate-600 mt-1">Atur kategori alat dalam sistem</p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-folder-plus"
        @click="isCreateModalOpen = true"
        class="bg-teal-600 hover:bg-teal-700 font-semibold"
      >
        Tambah Kategori
      </UButton>
    </div>

    <!-- Categories Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl p-6 shadow-md animate-pulse">
        <div class="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="categories.length === 0" class="bg-white rounded-xl p-12 shadow-md border border-slate-100 text-center">
      <UIcon name="i-lucide-folder" class="text-6xl text-slate-300 mx-auto mb-4" />
      <p class="text-slate-500 text-lg">Belum ada kategori</p>
      <UButton
        color="primary"
        icon="i-lucide-folder-plus"
        @click="isCreateModalOpen = true"
        class="bg-teal-600 hover:bg-teal-700 font-semibold mt-4"
      >
        Tambah Kategori Pertama
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="category in categories"
        :key="category.id_kategori"
        class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100 group"
      >
        <!-- Category Icon & Count -->
        <div class="flex items-start justify-between mb-4">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UIcon name="i-lucide-folder" class="text-2xl text-white" />
          </div>
          <div class="text-right">
            <div class="text-2xl font-heading font-bold text-slate-900">
              {{ category._count?.alat || 0 }}
            </div>
            <div class="text-xs text-slate-500">Alat</div>
          </div>
        </div>

        <!-- Category Name -->
        <h3 class="font-heading font-bold text-lg text-slate-900 mb-2">
          {{ category.nama_kategori }}
        </h3>

        <!-- Description -->
        <p class="text-sm text-slate-600 mb-4 line-clamp-2">
          {{ category.deskripsi || 'Tidak ada deskripsi' }}
        </p>

        <!-- Actions -->
        <div class="flex items-center space-x-2 pt-4 border-t border-slate-100">
          <UButton
            icon="i-lucide-edit"
            size="sm"
            color="primary"
            variant="soft"
            @click="openEditModal(category)"
            class="flex-1"
          >
            Edit
          </UButton>
          <UButton
            icon="i-lucide-trash-2"
            size="sm"
            color="error"
            variant="soft"
            @click="openDeleteModal(category)"
          />
        </div>
      </div>
    </div>

    <!-- Create Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isCreateModalOpen">
      <template #content>
      <div class="w-full max-w-lg mx-auto">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-folder-plus" class="text-xl text-purple-600" />
          </div>
          <div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Tambah Kategori Baru</h3>
            <p class="text-sm text-slate-500 mt-0.5">Buat kategori untuk mengelompokkan alat</p>
          </div>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="handleCreate" class="p-6 space-y-4">
          <UFormField label="Nama Kategori" required>
            <UInput
              v-model="createForm.nama_kategori"
              placeholder="Contoh: Komputer, Alat Peraga, dll"
              size="lg"
              icon="i-lucide-folder"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea
              v-model="createForm.deskripsi"
              placeholder="Deskripsi kategori (opsional)"
              :rows="4"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <!-- Modal Footer (inside form) -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 -mx-6 px-6 py-4 bg-slate-50 -mb-6">
            <UButton type="button" variant="outline" @click="isCreateModalOpen = false">
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              :disabled="!createForm.nama_kategori.trim()"
              class="bg-teal-600 hover:bg-teal-700"
            >
              Simpan Kategori
            </UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Edit Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isEditModalOpen">
      <template #content>
      <div class="w-full max-w-lg mx-auto">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-edit" class="text-xl text-blue-600" />
          </div>
          <div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Edit Kategori</h3>
            <p class="text-sm text-slate-500 mt-0.5">Perbarui informasi kategori</p>
          </div>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="handleUpdate" class="p-6 space-y-4">
          <UFormField label="Nama Kategori" required>
            <UInput
              v-model="editForm.nama_kategori"
              size="lg"
              icon="i-lucide-folder"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea
              v-model="editForm.deskripsi"
              placeholder="Deskripsi kategori (opsional)"
              :rows="4"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <!-- Modal Footer (inside form) -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 -mx-6 px-6 py-4 bg-slate-50 -mb-6">
            <UButton type="button" variant="outline" @click="isEditModalOpen = false">
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              :disabled="!editForm.nama_kategori.trim()"
              class="bg-teal-600 hover:bg-teal-700"
            >
              Update Kategori
            </UButton>
          </div>
        </form>
      </div>
      </template>
    </LazyUModal>

    <!-- Delete Confirmation Modal (LAZY LOADED) -->
    <LazyUModal v-model:open="isDeleteModalOpen">
      <template #content>
      <div class="w-full max-w-md mx-auto">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-trash-2" class="text-xl text-red-600" />
          </div>
          <div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Hapus Kategori</h3>
            <p class="text-sm text-slate-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-slate-700">
              Anda yakin ingin menghapus kategori <br />
              <span class="font-semibold text-red-600">{{ selectedCategory?.nama_kategori }}</span>?
              <br />
              <span class="text-xs text-orange-600 mt-2 block">
                ⚠️ Kategori dengan {{ selectedCategory?._count?.alat || 0 }} alat
              </span>
              <span class="text-xs text-slate-600 mt-1 block">Data akan masuk ke Recycle Bin.</span>
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <UButton variant="outline" @click="isDeleteModalOpen = false">Batal</UButton>
          <UButton color="error" :loading="isLoading" @click="handleDelete">Hapus Kategori</UButton>
        </div>
      </div>
      </template>
    </LazyUModal>
  </div>
</template>
