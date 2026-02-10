<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()

const { user, logout } = useAuth()
const router = useRouter()
const isLogoutModalOpen = ref(false)

const openLogoutModal = () => {
  isLogoutModalOpen.value = true
}

const confirmLogout = async () => {
  await logout()
  await router.push('/auth/login')
  isLogoutModalOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
    <div class="flex items-center justify-between h-16 px-6">
      <div>
        <h2 class="font-heading font-bold text-slate-900 text-lg">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-slate-500">{{ subtitle }}</p>
      </div>

      <div class="flex items-center space-x-4">
        <!-- User Info -->
        <div class="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <div class="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-user" class="text-white text-lg" />
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-900">{{ user?.nama_lengkap }}</p>
            <p class="text-xs text-teal-600 font-medium">{{ user?.role }}</p>
          </div>
        </div>

        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-log-out"
          @click="openLogoutModal"
          class="font-medium"
        >
          Keluar
        </UButton>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <LazyUModal v-model:open="isLogoutModalOpen">
      <template #content>
      <div class="w-full max-w-md mx-auto">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-log-out" class="text-xl text-amber-600" />
          </div>
          <div>
            <h3 class="font-heading font-bold text-lg text-slate-900">Konfirmasi Logout</h3>
            <p class="text-sm text-slate-500 mt-0.5">Anda akan keluar dari sistem</p>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p class="text-sm text-slate-700">
              Apakah Anda yakin ingin keluar dari akun
              <span class="font-semibold text-amber-700">{{ user?.nama_lengkap }}</span>
              sebagai
              <span class="font-semibold text-amber-700">{{ user?.role }}</span>?
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <UButton variant="outline" @click="isLogoutModalOpen = false">Batal</UButton>
          <UButton color="error" @click="confirmLogout">
            Ya, Keluar
          </UButton>
        </div>
      </div>
      </template>
    </LazyUModal>
  </header>
</template>
