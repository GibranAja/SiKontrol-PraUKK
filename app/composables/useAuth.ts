import type { LoginPayload, RegisterPayload, LoginResponse, RegisterResponse, ApiErrorResponse } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const toast = useToast()

  const isLoginLoading = ref(false)
  const isRegisterLoading = ref(false)
  const loginErrors = ref<Record<string, string>>({})
  const registerErrors = ref<Record<string, string>>({})

  /**
   * Login - POST request, data di body bukan URL (anti SQL injection & XSS)
   */
  async function login(payload: LoginPayload) {
    isLoginLoading.value = true
    loginErrors.value = {}

    try {
      const response = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: payload, // Data dikirim via body, bukan query params
      })

      if (response.success && response.data) {
        authStore.setAuth(response.data.user, {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        })

        toast.add({
          title: 'Login Berhasil',
          description: `Selamat datang, ${response.data.user.nama_lengkap}!`,
          color: 'primary',
          icon: 'i-lucide-check-circle',
        })

        // Redirect by role - await untuk memastikan redirect berhasil
        await redirectByRole(response.data.user.role)
        return true
      }
    } catch (error: any) {
      handleAuthError(error, 'login')
      return false
    } finally {
      isLoginLoading.value = false
    }
  }

  /**
   * Register - POST request, data di body (secure)
   */
  async function register(payload: RegisterPayload) {
    isRegisterLoading.value = true
    registerErrors.value = {}

    try {
      const response = await $fetch<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: payload,
      })

      if (response.success) {
        toast.add({
          title: 'Registrasi Berhasil',
          description: 'Silakan login dengan akun yang telah dibuat.',
          color: 'primary',
          icon: 'i-lucide-check-circle',
        })

        // Redirect to login
        await navigateTo('/auth/login', { replace: true })
        return true
      }
    } catch (error: any) {
      handleAuthError(error, 'register')
      return false
    } finally {
      isRegisterLoading.value = false
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: {
          refreshToken: authStore.refreshToken,
        },
      })
    } catch {
      // Logout even if API fails
    } finally {
      authStore.clearAuth()
      await navigateTo('/auth/login', { replace: true })
      toast.add({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari sistem.',
        color: 'neutral',
        icon: 'i-lucide-log-out',
      })
    }
  }

  /**
   * Refresh token
   */
  async function refreshToken(): Promise<boolean> {
    if (!authStore.refreshToken) return false

    try {
      const response = await $fetch<any>('/api/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: authStore.refreshToken,
        },
      })

      if (response.success && response.data?.tokens) {
        authStore.updateTokens(response.data.tokens)
        return true
      }
      return false
    } catch {
      authStore.clearAuth()
      return false
    }
  }

  /**
   * Redirect berdasarkan role setelah login
   */
  async function redirectByRole(role: string) {
    const roleRoutes: Record<string, string> = {
      ADMIN: '/admin',
      PETUGAS: '/petugas',
      PEMINJAM: '/peminjam',
    }

    const target = roleRoutes[role] || '/auth/login'
    await navigateTo(target, { replace: true })
  }

  /**
   * Handle API errors dengan toast notification
   */
  function handleAuthError(error: any, type: 'login' | 'register') {
    const errorData = error?.data as ApiErrorResponse | undefined
    const errorsRef = type === 'login' ? loginErrors : registerErrors

    if (errorData?.error?.details) {
      // Validation errors - map per field
      errorData.error.details.forEach((detail) => {
        errorsRef.value[detail.field] = detail.message
      })

      toast.add({
        title: 'Validasi Gagal',
        description: 'Periksa kembali data yang dimasukkan.',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })
    } else if (errorData?.error?.message) {
      toast.add({
        title: type === 'login' ? 'Login Gagal' : 'Registrasi Gagal',
        description: errorData.error.message,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })
    } else {
      toast.add({
        title: 'Terjadi Kesalahan',
        description: 'Silakan coba lagi nanti.',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })
    }
  }

  return {
    // State
    user: computed(() => authStore.user),
    isLoginLoading,
    isRegisterLoading,
    loginErrors,
    registerErrors,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    redirectByRole,
  }
}
