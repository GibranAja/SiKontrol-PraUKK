<script setup lang="ts">
// Force remove dark class from HTML
onMounted(() => {
  if (import.meta.client) {
    const html = document.documentElement
    html.classList.remove('dark')
    html.style.colorScheme = 'light'

    // Watch for any changes and force light mode
    const observer = new MutationObserver(() => {
      if (html.classList.contains('dark')) {
        html.classList.remove('dark')
      }
    })

    observer.observe(html, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
