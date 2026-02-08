<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Login - SiKontrol',
})

const { login, isLoginLoading, loginErrors } = useAuth()

const form = reactive({
  username: '',
  password: '',
})

const showPassword = ref(false)

async function handleSubmit() {
  await login({
    username: form.username.trim(),
    password: form.password,
  })
}
</script>

<template>
  <div class="fade-in-up">
    <!-- Title -->
    <div class="mb-8">
      <h2 class="font-heading text-2xl font-bold text-slate-900 tracking-tight">
        Selamat Datang! 👋
      </h2>
      <p class="mt-2 text-sm text-slate-600 leading-relaxed">
        Masuk untuk mengakses sistem peminjaman alat
      </p>
    </div>

    <!-- Login Form - POST method, data via body -->
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Username -->
      <UFormField label="Username" :error="loginErrors.username">
        <UInput
          v-model="form.username"
          placeholder="Masukkan username"
          icon="i-lucide-user"
          size="lg"
          autocomplete="username"
          :disabled="isLoginLoading"
          class="w-full"
        />
      </UFormField>

      <!-- Password -->
      <UFormField label="Password" :error="loginErrors.password">
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Masukkan password"
          icon="i-lucide-lock"
          size="lg"
          autocomplete="current-password"
          :disabled="isLoginLoading"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Submit Button -->
      <UButton
        type="submit"
        block
        size="lg"
        color="primary"
        variant="solid"
        :loading="isLoginLoading"
        :disabled="!form.username || !form.password || isLoginLoading"
        class="font-heading font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/30 disabled:bg-slate-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
      >
        <template v-if="!isLoginLoading">
          Masuk
        </template>
        <template v-else>
          Memproses...
        </template>
      </UButton>
    </form>

    <!-- Divider -->
    <div class="relative my-7">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-200" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="bg-white px-4 text-slate-500 font-medium">Belum punya akun?</span>
      </div>
    </div>

    <!-- Register Link -->
    <div class="text-center">
      <NuxtLink
        to="/auth/register"
        class="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors duration-200 border border-teal-200/50"
      >
        <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        Daftar Akun Baru
      </NuxtLink>
    </div>
  </div>
</template>
