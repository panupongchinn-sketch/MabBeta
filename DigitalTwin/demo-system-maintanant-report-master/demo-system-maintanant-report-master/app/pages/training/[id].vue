<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          {{ course?.name || "รายละเอียดคอร์ส" }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          รายละเอียดคอร์ส / วันอบรม / ราคา
        </p>
      </div>

      <NuxtLink
        to="/training"
        class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
      >
        ← กลับหน้าคอร์ส
      </NuxtLink>
    </div>

    <div v-if="loading" class="mt-6 flex items-center gap-3 text-slate-500">
      <span class="loading loading-spinner loading-md"></span>
      <span class="font-medium">กำลังโหลดรายละเอียด...</span>
    </div>

    <div v-else-if="error" class="mt-6 p-6 border border-red-200 bg-red-50 rounded-lg">
      <div class="font-bold text-red-700">โหลดข้อมูลไม่สำเร็จ</div>
      <div class="text-sm text-red-600 mt-1">{{ error }}</div>
    </div>

    <div v-else class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <!-- ✅ FIX: รูปเต็มความกว้างบนมือถือ (ไม่ล็อก 16:9) -->
            <div class="w-full overflow-hidden rounded-md bg-white border border-slate-100">
              <img
                :src="course?.image_url || fallbackImg"
                :alt="course?.name || 'training'"
                class="block w-full h-auto object-contain"
                loading="lazy"
                @error="onImgError"
              />
            </div>
          </div>

          <div class="p-5 sm:p-6">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-if="course?.price !== null && course?.price !== undefined"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold
                       bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px]">฿</span>
                {{ formatPrice(course.price) }}
              </span>

              <span
                v-if="course?.training_date"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200"
              >
                {{ formatDate(course.training_date) }}
              </span>
            </div>

            <div class="mt-4">
              <h2 class="text-lg font-bold text-slate-800">รายละเอียด</h2>
              <p class="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">
                {{ course?.description || "-" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-5 sm:p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-800">สมัคร / สอบถาม</h2>
            <p class="mt-1 text-sm text-slate-500">กดเพื่อไปหน้า “ติดต่อเรา”</p>
          </div>

          <div class="p-5 sm:p-6 space-y-3">
            <button
              class="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800"
              type="button"
              @click="goContact"
            >
              สนใจคอร์สนี้ → ติดต่อเรา
            </button>

            <NuxtLink
              to="/training"
              class="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
            >
              ดูคอร์สอื่น ๆ
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type TrainingCourseRow = {
  id: string
  name: string | null
  description: string | null
  price: number | null
  training_date: string | null
  image_url: string | null
  created_at: string | null
}

const { $supabase } = useNuxtApp()
const route = useRoute()

const id = computed(() => String(route.params.id || ""))

const fallbackImg = "https://picsum.photos/seed/trainingdetail/1200/800"
const course = ref<TrainingCourseRow | null>(null)
const loading = ref(true)
const error = ref("")

const loadCourse = async () => {
  loading.value = true
  error.value = ""
  try {
    const { data, error: e } = await ($supabase as any)
      .from("training_course")
      .select("id, name, description, price, training_date, image_url, created_at")
      .eq("id", id.value)
      .maybeSingle()

    if (e) throw e
    course.value = data || null
    if (!course.value) error.value = "ไม่พบคอร์สนี้ (id ไม่ถูกต้อง)"
  } catch (err: any) {
    error.value = err?.message || "Failed to load training_course"
    course.value = null
  } finally {
    loading.value = false
  }
}

const formatPrice = (v: number) => {
  try {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(v)
  } catch {
    return `${v} THB`
  }
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate)
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "2-digit" })
}

const onImgError = (e: Event) => {
  const el = e.target as HTMLImageElement | null
  if (el) el.src = fallbackImg
}

const goContact = async () => {
  const qs = new URLSearchParams()
  if (course.value?.name) qs.set("subject", `สนใจคอร์ส: ${course.value.name}`)
  if (id.value) qs.set("course_id", id.value)
  await navigateTo(`/contact?${qs.toString()}`)
}

onMounted(loadCourse)
</script>
