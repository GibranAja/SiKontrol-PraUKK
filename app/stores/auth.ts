import { defineStore } from 'pinia'
import type { User, AuthTokens } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    userRole: (state) => state.user?.role || null,
    fullName: (state) => state.user?.nama_lengkap || '',
  },

  actions: {
    setAuth(user: User, tokens: AuthTokens) {
      this.user = user
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken

      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem('auth_access_token', tokens.accessToken)
        localStorage.setItem('auth_refresh_token', tokens.refreshToken)
        localStorage.setItem('auth_user', JSON.stringify(user))
      }
    },

    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null

      if (import.meta.client) {
        localStorage.removeItem('auth_access_token')
        localStorage.removeItem('auth_refresh_token')
        localStorage.removeItem('auth_user')
      }
    },

    loadFromStorage() {
      if (import.meta.client) {
        const accessToken = localStorage.getItem('auth_access_token')
        const refreshToken = localStorage.getItem('auth_refresh_token')
        const userStr = localStorage.getItem('auth_user')

        if (accessToken && refreshToken && userStr) {
          try {
            this.user = JSON.parse(userStr) as User
            this.accessToken = accessToken
            this.refreshToken = refreshToken
          } catch {
            this.clearAuth()
          }
        }
      }
    },

    updateTokens(tokens: AuthTokens) {
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken

      if (import.meta.client) {
        localStorage.setItem('auth_access_token', tokens.accessToken)
        localStorage.setItem('auth_refresh_token', tokens.refreshToken)
      }
    },
  },
})
