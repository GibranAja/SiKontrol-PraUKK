<template>
  <div class="flex flex-col items-center justify-center py-12">
    <UIcon :name="icon" class="text-6xl text-slate-300 mb-4" />
    <p class="text-slate-500 text-lg">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string; icon?: string }>(), {
  message: 'Tidak ada data',
  icon: 'i-lucide-inbox',
})
</script>
