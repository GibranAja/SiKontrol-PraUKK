<script setup lang="ts">
interface MenuItem {
  label: string
  icon: string
  to: string
  exact?: boolean
}

interface Props {
  menuItems: MenuItem[]
  panelLabel?: string
  isOpen: boolean
}

const props = withDefaults(defineProps<Props>(), {
  panelLabel: 'Panel',
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const route = useRoute()

function isActiveRoute(item: MenuItem) {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function toggleSidebar() {
  emit('update:isOpen', !props.isOpen)
}
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40',
      isOpen ? 'w-64' : 'w-20',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-slate-200">
      <Transition name="fade" mode="out-in">
        <div v-if="isOpen" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <span class="text-white font-heading font-bold text-sm">SK</span>
          </div>
          <div>
            <h1 class="font-heading font-bold text-slate-900 text-sm">SiKontrol</h1>
            <p class="text-xs text-teal-600">{{ panelLabel }}</p>
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
          isActiveRoute(item)
            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
            : 'text-slate-600',
        ]"
      >
        <UIcon
          :name="item.icon"
          :class="[
            'text-xl transition-colors flex-shrink-0',
            isActiveRoute(item)
              ? 'text-white'
              : 'text-slate-500 group-hover:text-teal-600',
          ]"
        />
        <Transition name="fade" mode="out-in">
          <span v-if="isOpen" class="font-medium text-sm">{{ item.label }}</span>
        </Transition>
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
      <button
        @click="toggleSidebar"
        class="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
      >
        <UIcon :name="isOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="text-lg" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
