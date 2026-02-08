<script setup lang="ts">
const { logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="font-heading text-3xl font-bold text-slate-900">Peminjam Dashboard</h1>
        <UButton
          icon="i-lucide-log-out"
          label="Logout"
          color="neutral"
          variant="outline"
          class="border-slate-300 text-slate-700 hover:bg-slate-100"
          @click="logout"
        />
      </div>
    </div>
  </div>
</template>
