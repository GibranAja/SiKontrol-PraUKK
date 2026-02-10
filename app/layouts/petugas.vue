<script setup lang="ts">
const isSidebarOpen = ref(true)

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/petugas',
    exact: true,
  },
  {
    label: 'Katalog Alat',
    icon: 'i-lucide-package',
    to: '/petugas/equipment',
  },
  {
    label: 'Peminjaman',
    icon: 'i-lucide-hand-helping',
    to: '/petugas/borrowings',
  },
  {
    label: 'Perpanjangan',
    icon: 'i-lucide-calendar-plus',
    to: '/petugas/extensions',
  },
  {
    label: 'Pengembalian',
    icon: 'i-lucide-undo-2',
    to: '/petugas/returns',
  },
  {
    label: 'Kontrol Akun',
    icon: 'i-lucide-shield-alert',
    to: '/petugas/blacklist',
  },
  {
    label: 'Laporan',
    icon: 'i-lucide-file-bar-chart',
    to: '/petugas/reports',
  },
  {
    label: 'Recycle Bin',
    icon: 'i-lucide-trash-2',
    to: '/petugas/recycle-bin',
  },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Fixed Sidebar (Reusable Component) -->
    <AppSidebar
      v-model:isOpen="isSidebarOpen"
      :menuItems="menuItems"
      panelLabel="Petugas Panel"
    />

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300',
        isSidebarOpen ? 'ml-64' : 'ml-20',
      ]"
    >
      <!-- Top Bar (Reusable Component) -->
      <AppHeader
        title="Panel Petugas"
        subtitle="Manajemen peminjaman & pengembalian alat"
      />

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
