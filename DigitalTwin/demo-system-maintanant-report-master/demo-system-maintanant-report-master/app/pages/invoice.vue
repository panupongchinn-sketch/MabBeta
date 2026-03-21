<template>
  <div class="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Title -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold text-slate-700 tracking-tight">
          ใบเสนอราคา
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          กรอกข้อมูลเพื่อให้ทีมงานจัดทำใบเสนอราคาและติดต่อกลับ
        </p>
      </div>
    </div>

    <!-- Card -->
    <div class="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <!-- Top strip -->
      <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg bg-red-600/10 flex items-center justify-center">
            <Icon icon="mdi:file-document-outline" class="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div class="font-bold text-slate-800">Request a quotation</div>
            <div class="text-xs text-slate-500"></div>
          </div>
        </div>

        <button
          class="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-white text-sm"
          type="button"
          @click="resetForm"
          :disabled="loading"
        >
          <Icon icon="mdi:refresh" class="w-4 h-4" />
          ล้างฟอร์ม
        </button>
      </div>

      <div class="p-6">
        <!-- Alerts -->
        <div v-if="success" class="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div class="font-bold text-emerald-800">ส่งข้อมูลเรียบร้อย</div>
          <div class="text-sm text-emerald-700 mt-1">
            ทีมงานจะติดต่อกลับตามข้อมูลที่ให้ไว้
          </div>
        </div>

        <div v-if="error" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <div class="font-bold text-red-800">ส่งข้อมูลไม่สำเร็จ</div>
          <div class="text-sm text-red-700 mt-1">{{ error }}</div>
        </div>

        <!-- Form -->
        <form class="grid grid-cols-1 lg:grid-cols-12 gap-5" @submit.prevent="submitInvoice">
          <!-- Left -->
          <div class="lg:col-span-7 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- customer_name -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อลูกค้า <span class="text-red-600">*</span>
                </label>
                <input
                  v-model.trim="form.customer_name"
                  type="text"
                  class="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="ชื่อลูกค้า"
                  :disabled="loading"
                />
              </div>

              <!-- phone -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">
                  เบอร์โทร
                </label>
                <input
                  v-model.trim="form.phone"
                  type="tel"
                  class="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="เช่น 0812345678"
                  :disabled="loading"
                />
              </div>

              <!-- company -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">
                  บริษัท
                </label>
                <input
                  v-model.trim="form.company"
                  type="text"
                  class="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="ชื่อบริษัท (ถ้ามี)"
                  :disabled="loading"
                />
              </div>

              <!-- email -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  v-model.trim="form.email"
                  type="email"
                  class="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder="เช่น name@company.com"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- details -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">
                รายละเอียดที่ต้องการให้เสนอราคา <span class="text-red-600">*</span>
              </label>
              <textarea
                v-model.trim="form.details"
                rows="8"
                class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                placeholder="เช่น ต้องการขอราคา: รุ่น/จำนวน/สเปค/เงื่อนไขจัดส่ง ฯลฯ"
                :disabled="loading"
              ></textarea>

              <div class="mt-2 text-xs text-slate-500">
                แนะนำใส่: รุ่นสินค้า, จำนวน, สเปค, สถานที่จัดส่ง, วันใช้งาน, เงื่อนไขเพิ่มเติม
              </div>
            </div>
          </div>

          <!-- Right summary -->
          <div class="lg:col-span-5">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div class="font-bold text-slate-800">สรุปก่อนส่ง</div>

              <div class="mt-4 space-y-3 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-slate-500">ชื่อลูกค้า</span>
                  <span class="font-semibold text-slate-800 text-right line-clamp-1">
                    {{ form.customer_name || "-" }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-slate-500">เบอร์โทร</span>
                  <span class="font-semibold text-slate-800 text-right line-clamp-1">
                    {{ form.phone || "-" }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-slate-500">บริษัท</span>
                  <span class="font-semibold text-slate-800 text-right line-clamp-1">
                    {{ form.company || "-" }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-slate-500">Email</span>
                  <span class="font-semibold text-slate-800 text-right line-clamp-1">
                    {{ form.email || "-" }}
                  </span>
                </div>
              </div>

              <div class="mt-5 border-t border-slate-200 pt-5">
                <button
                  class="w-full h-11 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  type="submit"
                  :disabled="loading"
                >
                  <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                  <Icon v-else icon="mdi:send" class="w-5 h-5" />
                  ส่งขอใบเสนอราคา
                </button>

                <button
                  class="w-full mt-3 h-11 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                  type="button"
                  @click="resetForm"
                  :disabled="loading"
                >
                  ล้างฟอร์ม
                </button>

                <div class="mt-3 text-xs text-slate-500">
                  
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

const { $supabase } = useNuxtApp();

type InvoiceInsert = {
  customer_name: string;
  phone: string | null;
  company: string | null;
  email: string | null;
  details: string;
};

const loading = ref(false);
const error = ref("");
const success = ref(false);

const form = reactive({
  customer_name: "",
  phone: "",
  company: "",
  email: "",
  details: "",
});

const resetForm = () => {
  error.value = "";
  success.value = false;
  form.customer_name = "";
  form.phone = "";
  form.company = "";
  form.email = "";
  form.details = "";
};

const validate = () => {
  if (!form.customer_name.trim()) return "กรุณากรอกชื่อลูกค้า";
  if (!form.details.trim()) return "กรุณากรอกรายละเอียดที่ต้องการให้เสนอราคา";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "รูปแบบ Email ไม่ถูกต้อง";
  return "";
};

const submitInvoice = async () => {
  success.value = false;
  error.value = "";

  const msg = validate();
  if (msg) {
    error.value = msg;
    return;
  }

  loading.value = true;
  try {
    const payload: InvoiceInsert = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() ? form.phone.trim() : null,
      company: form.company.trim() ? form.company.trim() : null,
      email: form.email.trim() ? form.email.trim() : null,
      details: form.details.trim(),
    };

    const { error: e } = await ($supabase as any).from("invoice").insert(payload);
    if (e) throw e;

    success.value = true;
    resetForm();
    // resetForm() จะล้าง success ด้วย เลย set กลับ
    success.value = true;
  } catch (err: any) {
    error.value = err?.message || "Insert failed";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
