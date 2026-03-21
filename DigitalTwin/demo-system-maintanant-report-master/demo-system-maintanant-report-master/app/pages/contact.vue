<template>
  <div>
    <!-- =========================
      HEADER (ธีมเดียวกับหน้า training)
    ========================== -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold text-slate-700 tracking-tight">
          ติดต่อเรา
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          ส่งข้อความหาเราได้เลย ทีมงานจะติดต่อกลับโดยเร็ว
        </p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
        type="button"
        @click="resetForm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        ล้างฟอร์ม
      </button>
    </div>

    <!-- =========================
      GRID
    ========================== -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- LEFT: FORM -->
      <div class="lg:col-span-2">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-5 sm:p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-800">ส่งข้อความ / ขอข้อมูลเพิ่มเติม</h2>
            <p class="mt-1 text-sm text-slate-500">กรอกข้อมูลให้ครบเพื่อให้เราติดต่อกลับได้ถูกต้อง</p>
          </div>

          <div class="p-5 sm:p-6">
            <div v-if="success" class="mb-5 p-4 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
              ส่งข้อความเรียบร้อยแล้ว ✅ ขอบคุณครับ/ค่ะ
            </div>

            <div v-if="error" class="mb-5 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
              {{ error }}
            </div>

            <form class="space-y-5" @submit.prevent="submit">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700">ชื่อ-นามสกุล *</label>
                  <input
                    v-model.trim="form.full_name"
                    type="text"
                    class="mt-2 w-full h-11 px-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    placeholder="ชื่อลูกค้า"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700">เบอร์โทร</label>
                  <input
                    v-model.trim="form.phone"
                    type="tel"
                    class="mt-2 w-full h-11 px-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    placeholder="เช่น 08x-xxx-xxxx"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700">บริษัท</label>
                  <input
                    v-model.trim="form.company"
                    type="text"
                    class="mt-2 w-full h-11 px-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    placeholder="ชื่อบริษัท (ถ้ามี)"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    v-model.trim="form.email"
                    type="email"
                    class="mt-2 w-full h-11 px-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">หัวข้อ</label>
                <input
                  v-model.trim="form.subject"
                  type="text"
                  class="mt-2 w-full h-11 px-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="เช่น ขอใบเสนอราคา / สอบถามสินค้า / สอบถามคอร์ส"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">รายละเอียด *</label>
                <textarea
                  v-model.trim="form.detail"
                  rows="6"
                  class="mt-2 w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="พิมพ์รายละเอียดที่ต้องการให้เราช่วย..."
                  required
                />
                <div class="mt-2 text-xs text-slate-500">
                  แนะนำ: ระบุสินค้า/รุ่น, จำนวน, จังหวัด, เวลาที่สะดวกให้ติดต่อกลับ
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div class="text-xs text-slate-500">
                  กดส่งแล้วถือว่ายินยอมให้เราใช้ข้อมูลเพื่อการติดต่อกลับ
                </div>

                <button
                  class="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="loading"
                  type="submit"
                >
                  <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                  ส่งข้อความ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- RIGHT: CONTACT CARD -->
      <div class="lg:col-span-1">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-5 sm:p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-800">ข้อมูลติดต่อ</h2>
            <p class="mt-1 text-sm text-slate-500">บริษัท เอ็มแอนด์บี อินโนเวทีฟ คอมเมิร์ซ จำกัด</p>
            <p class="mt-1 text-sm text-slate-500">M&B INNOVATIVE COMMERCE Co., Ltd.</p>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-sm text-slate-700">
            <div class="flex items-start gap-3">
              <span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-700 border border-red-100">📍</span>
              <div>
                <div class="font-semibold">ที่อยู่</div>
                <div class="text-slate-600">อ.เมือง จ.ร้อยเอ็ด 450000</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-700 border border-red-100">☎</span>
              <div>
                <div class="font-semibold">โทร</div>
                <div class="text-slate-600"> 0917762859</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-700 border border-red-100">✉</span>
              <div>
                <div class="font-semibold">อีเมล</div>
                <div class="text-slate-600">automation101training@gmail.com</div>
              </div>
            </div>

            <div class="pt-2">
              <div class="text-xs font-semibold text-slate-500 mb-2">เวลาทำการ</div>
              <div class="text-slate-600">จันทร์–ศุกร์ 09:00–18:00</div>
            </div>

            <div class="pt-3 border-t border-slate-100">
              <button
                class="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                type="button"
                @click="goInvoice"
              >
                ขอใบเสนอราคา (ไปหน้า Invoice)
                <span class="text-red-600">→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- MAP PLACEHOLDER -->
        <div class="mt-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-5 sm:p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-800">แผนที่</h2>
            <p class="mt-1 text-sm text-slate-500"></p>
          </div>
          <div class="p-3">
            <div class="aspect-[16/9] rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 text-sm">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $supabase } = useNuxtApp()
const route = useRoute()

useState<string>("mb_search_q", () => "")

type ContactForm = {
  full_name: string
  phone: string
  company: string
  email: string
  subject: string
  detail: string
}

const form = ref<ContactForm>({
  full_name: "",
  phone: "",
  company: "",
  email: "",
  subject: "",
  detail: "",
})

const loading = ref(false)
const error = ref("")
const success = ref(false)

const resetForm = () => {
  form.value = {
    full_name: "",
    phone: "",
    company: "",
    email: "",
    subject: "",
    detail: "",
  }
  error.value = ""
  success.value = false
}

const submit = async () => {
  loading.value = true
  error.value = ""
  success.value = false

  try {
    const fullName = (form.value.full_name || "").trim()
    const detail = (form.value.detail || "").trim()

    if (!fullName) throw new Error("กรุณากรอกชื่อ-นามสกุล")
    if (!detail) throw new Error("กรุณากรอกรายละเอียด")

    // ✅ ส่งให้ตรงกับ SQL: public.contact_message
    // column: full_name, phone, company, email, subject, detail, source_page
    const payload = {
      full_name: fullName,
      phone: (form.value.phone || "").trim() || null,
      company: (form.value.company || "").trim() || null,
      email: (form.value.email || "").trim() || null,
      subject: (form.value.subject || "").trim() || null,
      detail: detail,
      source_page: route.fullPath,
    }

    const { error: e } = await ($supabase as any)
      .from("contact_message")
      .insert(payload)

    if (e) throw e

    success.value = true
    resetForm()
    success.value = true
  } catch (err: any) {
    error.value = err?.message || "ส่งข้อมูลไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

const goInvoice = async () => {
  await navigateTo("/invoice")
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
