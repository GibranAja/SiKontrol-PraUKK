<script setup lang="ts">
const { user, logout } = useAuth()
const router = useRouter()

const isSidebarOpen = ref(true)

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin',
    exact: true,
  },
  {
    label: 'Kelola Pengguna',
    icon: 'i-lucide-users',
    to: '/admin/users',
  },
  {
    label: 'Kelola Kategori',
    icon: 'i-lucide-folder',
    to: '/admin/categories',
  },
  {
    label: 'Kelola Alat',
    icon: 'i-lucide-package',
    to: '/admin/equipment',
  },
  {
    label: 'Log Aktivitas',
    icon: 'i-lucide-file-text',
    to: '/admin/logs',
  },
  {
    label: 'Recycle Bin',
    icon: 'i-lucide-trash-2',
    to: '/admin/recycle-bin',
  },
]

const handleLogout = async () => {
  await logout()
  await router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Fixed Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40',
        isSidebarOpen ? 'w-64' : 'w-20',
      ]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-slate-200">
        <Transition name="fade" mode="out-in">
          <div v-if="isSidebarOpen" class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
              <span class="text-white font-heading font-bold text-sm">SK</span>
            </div>
            <div>
              <h1 class="font-heading font-bold text-slate-900 text-sm">SiKontrol</h1>
              <p class="text-xs text-teal-600">Admin Panel</p>
            </div>
          </div>
          <div v-else class="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center mx-auto">
            <span class="text-white font-heading font-bold text-sm">SK</span>
          </div>
        </Transition>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
            'hover:bg-teal-50 group',
            $route.path === item.to || (!item.exact && $route.path.startsWith(item.to))
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'text-slate-600',
          ]"
        >
          <UIcon
            :name="item.icon"
            :class="[
              'text-xl transition-colors',
              $route.path === item.to || (!item.exact && $route.path.startsWith(item.to))
                ? 'text-white'
                : 'text-slate-500 group-hover:text-teal-600',
            ]"
          />
          <Transition name="fade" mode="out-in">
            <span v-if="isSidebarOpen" class="font-medium text-sm">{{ item.label }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <UIcon :name="isSidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="text-lg" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300',
        isSidebarOpen ? 'ml-64' : 'ml-20',
      ]"
    >
      <!-- Top Bar -->
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div class="flex items-center justify-between h-16 px-6">
          <div>
            <h2 class="font-heading font-bold text-slate-900 text-lg">Dashboard Admin</h2>
            <p class="text-xs text-slate-500">Kelola sistem peminjaman alat</p>
          </div>

          <div class="flex items-center space-x-4">
            <!-- User Info & Logout -->
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

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar styling */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
