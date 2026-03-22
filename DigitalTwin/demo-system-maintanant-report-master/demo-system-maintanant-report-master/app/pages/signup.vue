<template>
  <div class="min-h-screen flex items-center justify-center p-6 relative"
    style="background-image:url('/bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:fixed;">

    <div class="w-full relative z-10 flex gap-4 items-stretch" style="max-width:calc(100vw - 48px);height:calc(100vh - 48px)">

      <!-- ── การ์ดซ้าย: Slideshow ── -->
      <div class="hidden lg:flex bg-white rounded-2xl shadow-2xl overflow-hidden flex-col" style="flex:1;min-width:0;">

        <!-- รูปสไลด์ -->
        <div class="relative flex-1 overflow-hidden">
          <transition name="slide-fade" mode="out-in">
            <img :key="slide" :src="'/' + slide + '.png'"
              class="absolute inset-0 w-full h-full object-cover"
              style="transition:opacity .5s ease" />
          </transition>

          <!-- ปุ่มซ้าย/ขวา -->
          <button @click="prev"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button @click="next"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>

          <!-- overlay gradient bottom -->
          <div class="absolute bottom-0 inset-x-0 h-24 z-10" style="background:linear-gradient(transparent,rgba(0,0,0,.5))"></div>

          <!-- counter -->
          <span class="absolute bottom-4 right-4 z-20 text-white text-xs font-semibold bg-black/40 rounded-full px-3 py-1">
            {{ slide }} / 8
          </span>
        </div>

        <!-- Thumbnails -->
        <div class="flex gap-1.5 p-3 bg-slate-50 border-t border-slate-100 overflow-x-auto" style="scrollbar-width:none">
          <img v-for="i in 8" :key="i" :src="'/' + i + '.png'"
            @click="slide = i"
            class="rounded-lg object-cover flex-shrink-0 cursor-pointer transition-all"
            :class="slide === i ? 'ring-2 ring-red-500 opacity-100' : 'opacity-60 hover:opacity-90'"
            style="height:52px;width:76px;" />
        </div>
      </div>

      <!-- ── การ์ดขวา: ฟอร์ม ── -->
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style="width:420px;flex-shrink:0;overflow-y:auto;">

        <!-- Logo -->
        <div class="flex justify-center pt-8 pb-3 px-6">
          <img src="/dt-hero.jpg" alt="MapBeta Digital Twin"
            style="max-height:80px;width:auto;object-fit:contain;" />
        </div>

        <div class="px-6 pb-3">
          <h2 class="text-lg font-semibold text-slate-800">ลงทะเบียน</h2>
          <p class="text-sm text-slate-500">ระบบจัดการเมืองอัจฉริยะ</p>
        </div>

        <form class="px-6 pb-6 pt-2 space-y-3 flex-1" @submit.prevent="handleSignup">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
            <input v-model.trim="name" type="text" placeholder="ชื่อ-นามสกุล" required :disabled="isLoading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">บริษัท / หน่วยงาน <span class="text-red-500">*</span></label>
            <input v-model.trim="organization" type="text" placeholder="ชื่อบริษัทหรือหน่วยงาน" required :disabled="isLoading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">อีเมล <span class="text-red-500">*</span></label>
            <input v-model.trim="email" type="email" autocomplete="username" placeholder="example@email.com" required :disabled="isLoading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
            <input v-model.trim="phone" type="tel" placeholder="0812345678" required :disabled="isLoading"
              class="w-full h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea v-model.trim="notes" placeholder="ระบุความต้องการหรือข้อมูลเพิ่มเติม..." rows="3" :disabled="isLoading"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors text-slate-900 resize-none" />
          </div>

          <div v-if="successMessage" class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="isLoading"
            class="w-full h-11 rounded-lg bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <span v-if="!isLoading">ส่งข้อมูล</span>
            <span v-else class="inline-flex items-center justify-center gap-2">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              กำลังส่งข้อมูล...
            </span>
          </button>

          <p class="text-center text-xs text-slate-400 pt-1">© {{ new Date().getFullYear() }} MapBeta Digital Twin</p>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'สมัครสมาชิก | MapBeta' })

const { $supabase } = useNuxtApp() as any

const name = ref('')
const organization = ref('')
const email = ref('')
const phone = ref('')
const notes = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Slideshow
const slide = ref(1)
let timer: ReturnType<typeof setInterval> | null = null

const next = () => { slide.value = slide.value >= 8 ? 1 : slide.value + 1 }
const prev = () => { slide.value = slide.value <= 1 ? 8 : slide.value - 1 }

onMounted(() => { timer = setInterval(next, 4000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const handleSignup = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!name.value.trim()) { errorMessage.value = 'กรุณากรอกชื่อ-นามสกุล'; return }
  if (!organization.value.trim()) { errorMessage.value = 'กรุณากรอกชื่อบริษัท / หน่วยงาน'; return }
  if (!email.value.trim()) { errorMessage.value = 'กรุณากรอกอีเมล'; return }
  if (!phone.value.trim()) { errorMessage.value = 'กรุณากรอกเบอร์โทรศัพท์'; return }

  isLoading.value = true
  try {
    const { error } = await $supabase
      .from('contact_requests')
      .insert({
        name: name.value.trim(),
        organization: organization.value.trim(),
        email: email.value.toLowerCase().trim(),
        phone: phone.value.trim(),
        notes: notes.value.trim() || null,
        status: 'new',
      })

    if (error) { errorMessage.value = error.message || 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่'; return }

    successMessage.value = 'ส่งข้อมูลสำเร็จ! ทีมงานจะติดต่อกลับเร็วๆ นี้'
    name.value = ''; organization.value = ''; email.value = ''; phone.value = ''; notes.value = ''
  } catch (err: any) {
    errorMessage.value = err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: opacity .5s ease; position: absolute; inset: 0; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; }
div::-webkit-scrollbar { display: none; }
</style>
