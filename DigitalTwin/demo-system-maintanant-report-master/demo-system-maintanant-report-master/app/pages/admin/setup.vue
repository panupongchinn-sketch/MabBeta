<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 shadow-lg mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">ตั้งค่า Super Admin</h1>
        <p class="text-slate-400 text-sm mt-1">สร้าง Super Admin คนแรกของระบบ</p>
      </div>

      <!-- Already setup -->
      <div v-if="alreadySetup" class="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">ตั้งค่าเรียบร้อยแล้ว</h2>
        <p class="text-sm text-slate-500 mb-6">ระบบมี Super Admin อยู่แล้ว ไม่สามารถสร้างซ้ำได้</p>
        <NuxtLink to="/login"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors">
          ไปหน้า Login
        </NuxtLink>
      </div>

      <!-- Setup form -->
      <div v-else-if="!checking" class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-purple-50">
          <h2 class="text-lg font-semibold text-slate-800">สร้าง Super Admin</h2>
          <p class="text-sm text-slate-500">หน้านี้ใช้ได้ครั้งเดียว เมื่อสร้างแล้วจะถูกปิดโดยอัตโนมัติ</p>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="handleSetup">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              ชื่อ-นามสกุล <span class="text-red-500">*</span>
            </label>
            <input
              v-model.trim="name"
              type="text"
              placeholder="ชื่อ Super Admin"
              required
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
              :disabled="loading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              อีเมล <span class="text-red-500">*</span>
            </label>
            <input
              v-model.trim="email"
              type="email"
              placeholder="admin@example.com"
              required
              readonly
              class="w-full h-11 rounded-lg border border-slate-200 px-3 bg-slate-50
                     text-slate-600 cursor-not-allowed"
            />
            <p class="text-xs text-slate-400 mt-1">อีเมล Super Admin กำหนดไว้แล้ว</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              รหัสผ่าน <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                minlength="8"
                class="w-full h-11 rounded-lg border border-slate-300 px-3 pr-20
                       focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md
                       text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                @click="showPw = !showPw"
              >
                {{ showPw ? 'ซ่อน' : 'ดู' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              ยืนยันรหัสผ่าน <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              class="w-full h-11 rounded-lg border border-slate-300 px-3
                     focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
              :disabled="loading"
            />
          </div>

          <div v-if="successMsg"
            class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
            {{ successMsg }}
          </div>

          <div v-if="errorMsg"
            class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-11 rounded-lg bg-purple-600 text-white font-semibold shadow-sm
                   hover:bg-purple-700 active:bg-purple-800 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="!loading">สร้าง Super Admin</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังสร้าง...
            </span>
          </button>
        </form>
      </div>

      <!-- Checking -->
      <div v-else class="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div class="inline-block h-8 w-8 rounded-full border-3 border-slate-200 border-t-purple-600 animate-spin mb-3"></div>
        <p class="text-slate-500 text-sm">กำลังตรวจสอบ...</p>
      </div>

      <p class="mt-5 text-center text-xs text-slate-500">
        © {{ new Date().getFullYear() }} MapBeta Digital Twin
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'ตั้งค่า Super Admin | MapBeta' })

const SUPER_ADMIN_EMAIL = 'panupong.chinn@gmail.com'

const checking = ref(true)
const alreadySetup = ref(false)
const name = ref('')
const email = ref(SUPER_ADMIN_EMAIL)
const password = ref('')
const confirmPassword = ref('')
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const { createFirstSuperAdmin } = useCustomAuth()
const { $supabase } = useNuxtApp() as any

onMounted(async () => {
  // เช็คว่า email นี้เป็น super_admin แล้วหรือยัง (ไม่ใช่แค่มี super_admin ในระบบ)
  const { data } = await $supabase
    .from('app_users')
    .select('role')
    .eq('email', SUPER_ADMIN_EMAIL)
    .maybeSingle()
  alreadySetup.value = data?.role === 'super_admin'
  checking.value = false
})

const handleSetup = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!name.value.trim()) {
    errorMsg.value = 'กรุณากรอกชื่อ'
    return
  }
  if (password.value.length < 8) {
    errorMsg.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }

  loading.value = true
  try {
    const { data, error } = await createFirstSuperAdmin(email.value, password.value, name.value)

    if (error) {
      errorMsg.value = error.message
      return
    }

    successMsg.value = 'สร้าง Super Admin สำเร็จ! กำลังพาไปหน้า Login...'
    setTimeout(() => navigateTo('/login'), 1500)
  } catch (e: any) {
    errorMsg.value = e?.message || 'เกิดข้อผิดพลาด'
  } finally {
    loading.value = false
  }
}
</script>
