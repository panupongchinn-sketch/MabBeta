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
          <h2 class="text-lg font-semibold text-slate-800">เปิดใช้งานบัญชี</h2>
          <p class="text-sm text-slate-500">กรุณากรอก License Key ที่ได้รับเพื่อเปิดใช้งาน</p>
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

          <!-- License Key input -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              License Key
            </label>
            <input
              v-model.trim="licenseKey"
              type="text"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              maxlength="23"
              class="w-full h-12 rounded-lg border border-slate-300 px-4
                     focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400
                     transition-colors font-mono text-center text-lg tracking-widest uppercase text-slate-900"
              :disabled="loading"
              @input="formatKey"
            />
            <p class="text-xs text-slate-400 mt-1.5 text-center">
              รูปแบบ: XXXXX-XXXXX-XXXXX-XXXXX
            </p>
          </div>

          <!-- Success -->
          <div v-if="successMsg"
            class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
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
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <button
            type="button"
            class="w-full h-11 rounded-lg bg-amber-500 text-white font-semibold shadow-sm
                   hover:bg-amber-600 active:bg-amber-700 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading || licenseKey.length < 23"
            @click="onActivate"
          >
            <span v-if="!loading">เปิดใช้งาน License Key</span>
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
<p class="text-center text-xs text-slate-400 pb-4">
            © {{ new Date().getFullYear() }} MapBeta Digital Twin
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'เปิดใช้งาน License | MapBeta' })

const licenseKey = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const { user, activateLicense, signOut } = useCustomAuth()

const formatKey = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const parts = []
  for (let i = 0; i < val.length && i < 20; i += 5) {
    parts.push(val.slice(i, i + 5))
  }
  licenseKey.value = parts.join('-')
}

const onActivate = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  try {
    const { error } = await activateLicense(licenseKey.value)

    if (error) {
      errorMsg.value = error.message
      return
    }

    successMsg.value = 'กำลังพาไปหน้าหลัก...'
    setTimeout(() => {
      navigateTo('/')
    }, 1200)
  } catch (e: any) {
    errorMsg.value = e?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}

const onLogout = () => {
  signOut()
  navigateTo('/login')
}
</script>
