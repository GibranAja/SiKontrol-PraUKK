<script setup lang="ts">
const isSidebarOpen = ref(true)

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/peminjam',
    exact: true,
  },
  {
    label: 'Katalog Alat',
    icon: 'i-lucide-search',
    to: '/peminjam/katalog',
  },
  {
    label: 'Peminjaman Saya',
    icon: 'i-lucide-clipboard-list',
    to: '/peminjam/peminjaman',
  },
  {
    label: 'Perpanjangan',
    icon: 'i-lucide-calendar-plus',
    to: '/peminjam/perpanjangan',
  },
  {
    label: 'Denda & Riwayat',
    icon: 'i-lucide-receipt',
    to: '/peminjam/denda',
  },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Fixed Sidebar (Reusable Component) -->
    <AppSidebar
      v-model:isOpen="isSidebarOpen"
      :menuItems="menuItems"
      panelLabel="Peminjam"
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
        title="Panel Peminjam"
        subtitle="Pinjam & kelola alat dengan mudah"
      />

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
