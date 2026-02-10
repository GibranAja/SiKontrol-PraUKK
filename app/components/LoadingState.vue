<template>
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="text-4xl text-teal-600 animate-spin mx-auto mb-3" />
      <p class="text-slate-500 text-sm">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: 'Memuat data...',
})
</script>
