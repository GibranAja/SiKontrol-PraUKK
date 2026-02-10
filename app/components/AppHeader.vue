<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  await router.push('/auth/login')
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
          @click="handleLogout"
          class="font-medium"
        >
          Keluar
        </UButton>
      </div>
    </div>
  </header>
</template>
