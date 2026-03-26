<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;background-image:url('/bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;">
    <div style="width:100%;max-width:448px;position:relative;z-index:10">
      <!-- Single Card -->
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <!-- Logo -->
        <div class="flex justify-center pt-8 pb-4 px-6">
          <img src="/dt-hero.jpg" alt="MapBeta Digital Twin"
            style="max-height:110px;width:auto;object-fit:contain;" />
        </div>

        <div class="px-6 pb-2">
          <h2 class="text-lg font-semibold text-slate-800">ระบบพัฒนาฐานข้อมูลเมืองเพื่อการบริหารจัดการ</h2>
        </div>

        <form class="px-6 pb-6 pt-4 space-y-4" @submit.prevent="onLogin">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input
              v-model.trim="email"
              type="email"
              autocomplete="username"
              placeholder="example@email.com"
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     transition-colors text-slate-900"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full h-11 rounded-lg border border-slate-300 px-3 pr-20
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                       transition-colors text-slate-900"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md
                       text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                @click="showPw = !showPw"
                :disabled="loading"
              >
                {{ showPw ? 'ซ่อน' : 'ดู' }}
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMsg"
            class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full h-11 rounded-lg bg-red-600 text-white font-semibold shadow-sm
                   hover:bg-red-700 active:bg-red-800 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="!loading">เข้าสู่ระบบ</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังเข้าสู่ระบบ...
            </span>
          </button>

          <!-- Links -->
          <div class="pt-1 flex items-center justify-between text-sm">
            <span class="text-slate-500">
              ยังไม่มีบัญชี?
              <NuxtLink to="/register" class="font-semibold text-red-600 hover:text-red-700">
                สมัครสมาชิก
              </NuxtLink>
            </span>
          </div>
          <p class="text-center text-xs text-slate-400 pt-2">
            © {{ new Date().getFullYear() }} MapBeta Digital Twin
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'เข้าสู่ระบบ | MapBeta' })

const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const { signIn, isActive } = useCustomAuth()

const onLogin = async () => {
  errorMsg.value = ''

  if (!email.value || !password.value) {
    errorMsg.value = 'กรุณากรอกอีเมลและรหัสผ่าน'
    return
  }

  loading.value = true
  try {
    const { data, error } = await signIn(email.value, password.value)

    if (error) {
      errorMsg.value = error.message
      return
    }

    // ถ้าบัญชียังไม่ active → ไปหน้า activate
    if (!data?.is_active) {
      await navigateTo('/activate')
    } else {
      await navigateTo('/')
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>
