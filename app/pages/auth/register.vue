<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Daftar - SiKontrol',
})

const { register, isRegisterLoading, registerErrors } = useAuth()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nama_lengkap: '',
  kelas: '',
  jenis_kelamin: '' as 'Laki-laki' | 'Perempuan' | '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const kelasOptions = [
  'X RPL 1', 'X RPL 2',
  'XI RPL 1', 'XI RPL 2',
  'XII RPL 1', 'XII RPL 2',
  'X TKJ 1', 'X TKJ 2',
  'XI TKJ 1', 'XI TKJ 2',
  'XII TKJ 1', 'XII TKJ 2',
  'X MM 1', 'X MM 2',
  'XI MM 1', 'XI MM 2',
  'XII MM 1', 'XII MM 2',
]

const genderOptions = ['Laki-laki', 'Perempuan']

const passwordMismatch = computed(() => {
  if (form.confirmPassword && form.password !== form.confirmPassword) {
    return 'Password tidak cocok'
  }
  return ''
})

const isFormValid = computed(() => {
  const hasUsername = form.username.trim().length >= 3
  const hasValidPassword = form.password.length >= 6
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0
  const hasFullName = form.nama_lengkap.trim().length >= 2
  const hasKelas = form.kelas !== ''
  const hasGender = form.jenis_kelamin !== ''

  return hasUsername && hasValidPassword && passwordsMatch && hasFullName && hasKelas && hasGender
})

async function handleSubmit() {
  if (!isFormValid.value) return

  await register({
    username: form.username.trim(),
    password: form.password,
    nama_lengkap: form.nama_lengkap.trim(),
    kelas: form.kelas,
    jenis_kelamin: form.jenis_kelamin as 'Laki-laki' | 'Perempuan',
  })
}
</script>

<template>
  <div class="fade-in-up">
    <!-- Title -->
    <div class="mb-8">
      <h2 class="font-heading text-2xl font-bold text-slate-900 tracking-tight">
        Buat Akun Baru 🚀
      </h2>
      <p class="mt-2 text-sm text-slate-600 leading-relaxed">
        Daftar sebagai peminjam untuk mengakses sistem
      </p>
    </div>

    <!-- Register Form - POST method, data via body -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Nama Lengkap -->
      <UFormField label="Nama Lengkap" :error="registerErrors.nama_lengkap" required>
        <UInput
          v-model="form.nama_lengkap"
          placeholder="Masukkan nama lengkap"
          icon="i-lucide-user-circle"
          size="lg"
          autocomplete="name"
          :disabled="isRegisterLoading"
          class="w-full"
        />
      </UFormField>

      <!-- Username -->
      <UFormField label="Username" :error="registerErrors.username" required>
        <UInput
          v-model="form.username"
          placeholder="Masukkan username"
          icon="i-lucide-at-sign"
          size="lg"
          autocomplete="username"
          :disabled="isRegisterLoading"
          class="w-full"
        />
        <template #hint>
          <span class="text-xs text-slate-500">Min. 3 karakter, huruf, angka, underscore</span>
        </template>
      </UFormField>

      <!-- Kelas & Jenis Kelamin (2 columns on larger screens) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Kelas -->
        <UFormField label="Kelas" :error="registerErrors.kelas" required>
          <USelect
            v-model="form.kelas"
            :items="kelasOptions"
            placeholder="Pilih kelas"
            icon="i-lucide-school"
            size="lg"
            :disabled="isRegisterLoading"
            class="w-full"
          />
        </UFormField>

        <!-- Jenis Kelamin -->
        <UFormField label="Jenis Kelamin" :error="registerErrors.jenis_kelamin" required>
          <USelect
            v-model="form.jenis_kelamin"
            :items="genderOptions"
            placeholder="Pilih"
            icon="i-lucide-users"
            size="lg"
            :disabled="isRegisterLoading"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Password -->
      <UFormField label="Password" :error="registerErrors.password" required>
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Min. 6 karakter"
          icon="i-lucide-lock"
          size="lg"
          autocomplete="new-password"
          :disabled="isRegisterLoading"
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

      <!-- Konfirmasi Password -->
      <UFormField label="Konfirmasi Password" :error="passwordMismatch" required>
        <UInput
          v-model="form.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Ulangi password"
          icon="i-lucide-lock-keyhole"
          size="lg"
          autocomplete="new-password"
          :disabled="isRegisterLoading"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="!isFormValid || isRegisterLoading"
        class="w-full px-4 py-3 font-heading font-bold text-white rounded-lg transition-all duration-200 mt-2 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/30 disabled:bg-slate-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <span v-if="isRegisterLoading">
          Memproses...
        </span>
        <span v-else>
          Daftar Sekarang
        </span>
      </button>
    </form>

    <!-- Divider -->
    <div class="relative my-7">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-200" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="bg-white px-4 text-slate-500 font-medium">Sudah punya akun?</span>
      </div>
    </div>

    <!-- Login Link -->
    <div class="text-center">
      <NuxtLink
        to="/auth/login"
        class="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors duration-200 border border-teal-200/50"
      >
        <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        Masuk ke Akun Anda
      </NuxtLink>
    </div>
  </div>
</template>
