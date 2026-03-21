<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative"
    style="background-image:url('/bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;">
    <div class="w-full max-w-md relative z-10">
      <!-- Single Card -->
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <!-- Logo -->
        <div class="flex justify-center pt-8 pb-4 px-6">
          <img src="/dt-hero.jpg" alt="MapBeta Digital Twin"
            style="max-height:110px;width:auto;object-fit:contain;" />
        </div>

        <div class="px-6 pb-3">
          <h2 class="text-lg font-semibold text-slate-800">สมัครสมาชิก</h2>
          <p class="text-sm text-slate-500">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
        </div>

        <!-- Step indicator -->
        <div class="px-6 pt-4">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span class="text-xs font-medium text-slate-700">สมัครสมาชิก</span>
            </div>
            <div class="flex-1 h-px bg-slate-200"></div>
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center">2</span>
              <span class="text-xs text-slate-400">กรอก License Key</span>
            </div>
            <div class="flex-1 h-px bg-slate-200"></div>
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center">3</span>
              <span class="text-xs text-slate-400">เข้าใช้งาน</span>
            </div>
          </div>
        </div>

        <form class="px-6 pb-6 pt-4 space-y-4" @submit.prevent="handleSignup">
          <!-- Full name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              ชื่อ-นามสกุล <span class="text-red-500">*</span>
            </label>
            <input
              v-model.trim="name"
              type="text"
              placeholder="ชื่อ-นามสกุล"
              required
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     transition-colors text-slate-900"
              :disabled="isLoading"
            />
          </div>

          <!-- Organization -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              บริษัท / หน่วยงาน <span class="text-red-500">*</span>
            </label>
            <input
              v-model.trim="organization"
              type="text"
              placeholder="ชื่อบริษัทหรือหน่วยงาน"
              required
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     transition-colors text-slate-900"
              :disabled="isLoading"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              อีเมล <span class="text-red-500">*</span>
            </label>
            <input
              v-model.trim="email"
              type="email"
              autocomplete="username"
              placeholder="example@email.com"
              required
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     transition-colors text-slate-900"
              :disabled="isLoading"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              รหัสผ่าน <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                minlength="8"
                class="w-full h-11 rounded-lg border border-slate-300 px-3 pr-20
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                       transition-colors text-slate-900"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md
                       text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                @click="showPw = !showPw"
                :disabled="isLoading"
              >
                {{ showPw ? 'ซ่อน' : 'ดู' }}
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              ยืนยันรหัสผ่าน <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              minlength="8"
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     transition-colors text-slate-900"
              :class="{ 'border-red-400': confirmPassword && password !== confirmPassword }"
              :disabled="isLoading"
            />
            <p v-if="confirmPassword && password !== confirmPassword"
              class="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
          </div>

          <!-- Success -->
          <div v-if="successMessage"
            class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
            {{ successMessage }}
          </div>

          <!-- Error -->
          <div v-if="errorMessage"
            class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
            {{ errorMessage }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || (!!confirmPassword && password !== confirmPassword)"
            class="w-full h-11 rounded-lg bg-red-600 text-white font-semibold shadow-sm
                   hover:bg-red-700 active:bg-red-800 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">สร้างบัญชี</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังสร้างบัญชี...
            </span>
          </button>

          <!-- Links -->
          <div class="pt-1 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?
            <NuxtLink to="/login" class="font-semibold text-red-600 hover:text-red-700">
              เข้าสู่ระบบ
            </NuxtLink>
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
useHead({ title: 'สมัครสมาชิก | MapBeta' })

const name = ref('')
const organization = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPw = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const { signUp } = useCustomAuth()

const handleSignup = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'กรุณากรอกชื่อ-นามสกุล'
    return
  }
  if (!organization.value.trim()) {
    errorMessage.value = 'กรุณากรอกชื่อบริษัท / หน่วยงาน'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }

  isLoading.value = true
  try {
    const { error } = await signUp(email.value, password.value, name.value, organization.value)

    if (error) {
      errorMessage.value = error.message || 'สมัครสมาชิกไม่สำเร็จ'
      return
    }

    successMessage.value = 'สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ...'
    setTimeout(() => {
      navigateTo('/login')
    }, 1000)
  } catch (err: any) {
    errorMessage.value = err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}
</script>
