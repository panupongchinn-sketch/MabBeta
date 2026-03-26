<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;background-image:url('/bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;">
    <div style="width:100%;max-width:448px;position:relative;z-index:10">
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">

        <!-- Logo -->
        <div class="flex justify-center pt-8 pb-4 px-6">
          <img src="/dt-hero.jpg" alt="MapBeta Digital Twin"
            style="max-height:110px;width:auto;object-fit:contain;" />
        </div>

        <div class="px-6 pb-2">
          <h2 class="text-lg font-semibold text-slate-800">สมัครใช้งาน</h2>
          <p class="text-sm text-slate-500">ระบบพัฒนาฐานข้อมูลเมืองเพื่อการบริหารจัดการ</p>
        </div>

        <!-- Success state -->
        <div v-if="success" class="px-6 pb-8 pt-4 text-center">
          <div style="width:64px;height:64px;border-radius:50%;background:#f0fdf4;border:2px solid #bbf7d0;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <svg width="30" height="30" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="text-base font-semibold text-slate-800 mb-2">สมัครสำเร็จแล้ว!</h3>
          <p class="text-sm text-slate-500 mb-1">บัญชีของคุณถูกสร้างเรียบร้อยแล้ว</p>
          <p class="text-sm text-slate-500 mb-6">กรุณารอ Admin ออก License ให้ก่อนเข้าใช้งาน</p>
          <NuxtLink to="/login"
            class="inline-block w-full h-11 rounded-lg bg-red-600 text-white font-semibold text-sm flex items-center justify-content:center text-center leading-[44px] hover:bg-red-700 transition-colors">
            กลับหน้าเข้าสู่ระบบ
          </NuxtLink>
          <p class="text-center text-xs text-slate-400 pt-4">© {{ new Date().getFullYear() }} MapBeta Digital Twin</p>
        </div>

        <!-- Form -->
        <form v-else class="px-6 pb-6 pt-4 space-y-4" @submit.prevent="onRegister">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
            <input v-model.trim="form.fullName" type="text" placeholder="ชื่อ-นามสกุล" required :disabled="loading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">บริษัท / หน่วยงาน <span class="text-red-500">*</span></label>
            <input v-model.trim="form.organization" type="text" placeholder="ชื่อบริษัทหรือหน่วยงาน" required :disabled="loading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">อีเมล <span class="text-red-500">*</span></label>
            <input v-model.trim="form.email" type="email" autocomplete="username" placeholder="example@email.com" required :disabled="loading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน <span class="text-red-500">*</span></label>
            <div class="relative">
              <input v-model="form.password" :type="showPw ? 'text' : 'password'" autocomplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร" required :disabled="loading"
                class="w-full h-11 rounded-lg border border-slate-300 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
              <button type="button" @click="showPw = !showPw" :disabled="loading"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                {{ showPw ? 'ซ่อน' : 'ดู' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่าน <span class="text-red-500">*</span></label>
            <input v-model="form.confirmPassword" :type="showPw ? 'text' : 'password'" autocomplete="new-password"
              placeholder="กรอกรหัสผ่านอีกครั้ง" required :disabled="loading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <button type="submit" :disabled="loading"
            class="w-full h-11 rounded-lg bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <span v-if="!loading">สมัครใช้งาน</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังสมัคร...
            </span>
          </button>

          <div class="pt-1 text-center text-sm">
            <span class="text-slate-500">มีบัญชีอยู่แล้ว? </span>
            <NuxtLink to="/login" class="font-semibold text-red-600 hover:text-red-700">เข้าสู่ระบบ</NuxtLink>
          </div>
          <p class="text-center text-xs text-slate-400 pt-1">© {{ new Date().getFullYear() }} MapBeta Digital Twin</p>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'สมัครใช้งาน | MapBeta' })

const { signUp } = useCustomAuth()

const form = ref({ fullName: '', organization: '', email: '', password: '', confirmPassword: '' })
const showPw   = ref(false)
const loading  = ref(false)
const errorMsg = ref('')
const success  = ref(false)

const onRegister = async () => {
  errorMsg.value = ''

  if (!form.value.fullName)         { errorMsg.value = 'กรุณากรอกชื่อ-นามสกุล'; return }
  if (!form.value.organization)     { errorMsg.value = 'กรุณากรอกบริษัท / หน่วยงาน'; return }
  if (!form.value.email)            { errorMsg.value = 'กรุณากรอกอีเมล'; return }
  if (form.value.password.length < 8) { errorMsg.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'; return }
  if (form.value.password !== form.value.confirmPassword) { errorMsg.value = 'รหัสผ่านไม่ตรงกัน'; return }

  loading.value = true
  try {
    const { error } = await signUp(form.value.email, form.value.password, form.value.fullName, form.value.organization)
    if (error) { errorMsg.value = (error as any).message || 'สมัครไม่สำเร็จ กรุณาลองใหม่'; return }
    success.value = true
  } catch (e: any) {
    errorMsg.value = e?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>
