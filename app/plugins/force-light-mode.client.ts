export default defineNuxtPlugin(() => {
  // Force light mode on every page
  if (import.meta.client) {
    const html = document.documentElement

    // Remove dark class immediately
    html.classList.remove('dark')
    html.setAttribute('data-color-mode', 'light')
    html.style.colorScheme = 'light'

    // Clear any dark mode preference from localStorage
    localStorage.removeItem('nuxt-color-mode')
    localStorage.setItem('nuxt-color-mode', 'light')

    // Force body background
    document.body.style.backgroundColor = '#f8fafc'
  }
})
