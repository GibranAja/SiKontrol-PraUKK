<template>
  <div class="flex h-screen overflow-hidden">
    <!-- LEFT SECTION - Creative Visual (Fixed, No Scroll) -->
    <div class="hidden lg:flex lg:w-1/2 xl:w-[45%] fixed left-0 top-0 bottom-0 auth-gradient overflow-hidden">
      <!-- Grid Pattern Overlay -->
      <div class="absolute inset-0 grid-pattern opacity-30" />

      <!-- Decorative Floating Elements -->
      <div class="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-3xl backdrop-blur-sm float-animation" />
      <div class="absolute bottom-32 right-20 w-40 h-40 bg-white/5 rounded-full backdrop-blur-sm float-delayed" />
      <div class="absolute top-1/3 left-1/4 w-24 h-24 bg-teal-400/10 rounded-2xl backdrop-blur-sm rotate-45 float-animation" />
      <div class="absolute top-2/3 right-1/4 w-20 h-20 bg-white/5 rounded-full backdrop-blur-sm float-delayed" />

      <!-- Content Container -->
      <div class="relative z-10 flex flex-col justify-center items-start px-12 xl:px-20 text-white w-full">
        <!-- Brand -->
        <div class="fade-in-up">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mb-6 border border-white/20">
            <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>

          <h1 class="font-heading text-5xl xl:text-6xl font-bold mb-4 tracking-tight">
            SiKontrol
          </h1>
          <p class="text-xl text-white/80 font-light leading-relaxed max-w-md">
            Sistem Peminjaman Alat<br />Sarana dan Prasarana
          </p>
        </div>

        <!-- Footer Text -->
        <div class="absolute bottom-8 left-12 xl:left-20 fade-in-up" style="animation-delay: 0.2s">
          <p class="text-white/60 text-sm">
            &copy; {{ new Date().getFullYear() }} SiKontrol. All rights reserved.
          </p>
        </div>
      </div>
    </div>

    <!-- RIGHT SECTION - Auth Form (Scrollable) -->
    <div class="w-full lg:w-1/2 xl:w-[55%] lg:ml-[50%] xl:ml-[45%] overflow-y-auto bg-slate-50">
      <div class="min-h-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
          <!-- Mobile Brand (only visible on small screens) -->
          <div class="lg:hidden text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-teal-600 mb-4">
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <h1 class="font-heading text-2xl font-bold text-slate-900 tracking-tight">SiKontrol</h1>
            <p class="mt-1 text-sm text-slate-600">Sistem Peminjaman Alat</p>
          </div>

          <!-- Auth Card -->
          <UCard class="shadow-xl border border-slate-200/50 rounded-2xl bg-white backdrop-blur-sm" :ui="{ body: 'p-6 sm:p-8 md:p-10' }">
            <slot />
          </UCard>

          <!-- Mobile Footer -->
          <p class="lg:hidden text-center text-xs text-slate-500 mt-6">
            &copy; {{ new Date().getFullYear() }} SiKontrol. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
