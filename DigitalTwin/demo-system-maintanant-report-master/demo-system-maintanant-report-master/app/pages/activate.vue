<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative"
    style="background-image:url('/bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;">
    <div class="w-full max-w-md relative z-10">
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <!-- Logo -->
        <div class="flex justify-center pt-8 pb-4 px-6">
          <img src="/dt-hero.jpg" alt="MapBeta Digital Twin"
            style="max-height:110px;width:auto;object-fit:contain;" />
        </div>

        <div class="px-6 pb-3">
          <h2 class="text-lg font-semibold text-slate-800">รอการอนุมัติ License</h2>
          <p class="text-sm text-slate-500">กรุณารอ Admin ออก License ให้ก่อนเข้าใช้งาน</p>
        </div>

        <div class="p-6 space-y-5">
          <!-- User info -->
          <div v-if="user" class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div class="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
              {{ user.full_name?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">{{ user.full_name }}</p>
              <p class="text-xs text-slate-500">{{ user.email }}</p>
            </div>
          </div>

          <!-- Status icon -->
          <div class="flex flex-col items-center py-2 gap-3">
            <div style="position:relative;width:64px;height:64px">
              <!-- spinning ring -->
              <svg style="position:absolute;inset:0;animation:spin 1.2s linear infinite" width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="#fde68a" stroke-width="4"/>
                <path d="M32 4a28 28 0 0 1 28 28" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
              </svg>
              <!-- center icon -->
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
                <svg width="26" height="26" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
            </div>
            <p class="text-sm text-slate-500 text-center">บัญชีของคุณรอการออก License จาก Admin</p>
          </div>

          <!-- Success -->
          <div v-if="successMsg"
            class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-medium">เปิดใช้งานสำเร็จ!</p>
              <p class="text-emerald-600 text-xs mt-0.5">{{ successMsg }}</p>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMsg"
            class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Check status button -->
          <button type="button" @click="onCheckStatus" :disabled="checkingStatus"
            class="w-full h-11 rounded-lg bg-amber-500 text-white font-semibold shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <span v-if="!checkingStatus">ตรวจสอบสถานะ</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังตรวจสอบ...
            </span>
          </button>

          <!-- Logout link -->
          <div class="text-center text-sm text-slate-500">
            ต้องการใช้บัญชีอื่น?
            <button class="font-semibold text-red-600 hover:text-red-700" @click="onLogout">
              ออกจากระบบ
            </button>
          </div>
          <p class="text-center text-xs text-slate-400 pb-2">
            © {{ new Date().getFullYear() }} MapBeta Digital Twin
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'รอการอนุมัติ License | MapBeta' })

const errorMsg = ref('')
const successMsg = ref('')
const checkingStatus = ref(false)

const { user, refreshUser, signOut } = useCustomAuth()

const onCheckStatus = async () => {
  checkingStatus.value = true
  errorMsg.value = ''
  successMsg.value = ''
  await refreshUser()
  if (user.value?.is_active) {
    successMsg.value = 'บัญชีถูกเปิดใช้งานแล้ว กำลังพาไปหน้าหลัก...'
    setTimeout(() => navigateTo('/'), 1200)
  } else {
    errorMsg.value = 'ยังไม่ได้รับ License กรุณาติดต่อ Admin'
  }
  checkingStatus.value = false
}

const onLogout = () => {
  signOut()
  navigateTo('/login')
}
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg) } }
</style>
