/**
 * Auth Interceptor Plugin
 * Automatically refreshes expired tokens and retries failed requests
 */

import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  let isRefreshing = false
  let refreshPromise: Promise<boolean> | null = null

  // Intercept $fetch to handle 401 errors
  globalThis.$fetch = new Proxy(globalThis.$fetch, {
    async apply(target, thisArg, argArray: any[]) {
      try {
        return await Reflect.apply(target, thisArg, argArray)
      } catch (error: any) {
        // Check if error is 401 and not on auth endpoints
        const url = argArray[0] as string
        const isAuthEndpoint = url?.includes('/api/auth/')

        if (error?.statusCode === 401 && !isAuthEndpoint && authStore.refreshToken) {
          // Prevent multiple simultaneous refresh attempts
          if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = refreshAccessToken()
          }

          const refreshSuccess = await refreshPromise
          isRefreshing = false
          refreshPromise = null

          if (refreshSuccess) {
            // Retry the original request with new token
            const options = argArray[1] as any
            if (options?.headers?.Authorization) {
              options.headers.Authorization = `Bearer ${authStore.accessToken}`
            }
            return await Reflect.apply(target, thisArg, argArray)
          } else {
            // Refresh failed, redirect to login
            authStore.clearAuth()
            await navigateTo('/auth/login')
            throw error
          }
        }

        throw error
      }
    },
  })

  async function refreshAccessToken(): Promise<boolean> {
    try {
      const response = await $fetch<any>('/api/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: authStore.refreshToken,
        },
      })

      if (response.success && response.data?.tokens) {
        authStore.updateTokens({
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        })
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
    return false
  }
})
