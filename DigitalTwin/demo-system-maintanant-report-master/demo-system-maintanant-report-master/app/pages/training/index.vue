<template>
  <div>
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold text-slate-700 tracking-tight">
          หลักสูตรอบรม
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          ทั้งหมด: <span class="font-bold text-slate-700">{{ filteredCourses.length }}</span> รายการ
        </p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
        @click="loadCourses"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="mt-6 flex items-center gap-3 text-slate-500">
      <span class="loading loading-spinner loading-md"></span>
      <span class="font-medium">กำลังโหลดคอร์ส...</span>
    </div>

    <div v-else-if="error" class="mt-6 p-6 border border-red-200 bg-red-50 rounded-lg">
      <div class="font-bold text-red-700">โหลดข้อมูลไม่สำเร็จ</div>
      <div class="text-sm text-red-600 mt-1">{{ error }}</div>
      <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md" @click="loadCourses" type="button">
        ลองอีกครั้ง
      </button>
    </div>

    <section v-else class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- ✅ เปลี่ยนเป็น NuxtLink เพื่อไป /training/:id -->
      <NuxtLink
        v-for="c in filteredCourses"
        :key="c.id"
        :to="`/training/${c.id}`"
        class="group bg-white border border-slate-200 hover:border-slate-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <div class="bg-white border-b border-slate-100">
          <div class="aspect-[16/9] sm:aspect-[4/3] p-4 flex items-center justify-center overflow-hidden">
            <img
              :src="c.image_url || fallbackImg"
              :alt="c.name || 'training'"
              class="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.05]"
              loading="lazy"
              @error="onImgError"
            />
          </div>
        </div>

        <div class="p-5">
          <h3 class="text-lg font-bold text-slate-800 group-hover:text-slate-900 line-clamp-2">
            {{ c.name }}
          </h3>

          <p class="mt-2 text-sm text-slate-600 line-clamp-2">
            {{ c.description || "-" }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span v-if="c.price !== null && c.price !== undefined" class="price-badge">
              {{ formatPrice(c.price) }}
            </span>

            <span
              v-if="c.training_date"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200"
            >
              {{ formatDate(c.training_date) }}
            </span>
          </div>

          <div class="mt-5 text-sm font-semibold text-red-600 group-hover:text-red-700">
            View details &gt;
          </div>
        </div>
      </NuxtLink>

      <div
        v-if="filteredCourses.length === 0"
        class="col-span-full p-10 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg"
      >
        ไม่พบคอร์สในตาราง (หรือคำค้นหาไม่ตรง)
      </div>
    </section>
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

// ✅ ใช้ search จาก header (layout)
const q = useState<string>("mb_search_q", () => "")

const fallbackImg = "https://picsum.photos/seed/training/900/600"
const courses = ref<TrainingCourseRow[]>([])
const loading = ref(true)
const error = ref("")

const loadCourses = async () => {
  loading.value = true
  error.value = ""
  try {
    const { data, error: e } = await ($supabase as any)
      .from("training_course")
      .select("id, name, description, price, training_date, image_url, created_at")
      .order("training_date", { ascending: true })

    if (e) throw e
    courses.value = Array.isArray(data) ? (data as TrainingCourseRow[]) : []
  } catch (err: any) {
    error.value = err?.message || "Failed to load training_course"
    courses.value = []
  } finally {
    loading.value = false
  }
}

const filteredCourses = computed(() => {
  const key = (q.value || "").trim().toLowerCase()
  if (!key) return courses.value
  return courses.value.filter((c) => {
    const name = (c.name || "").toLowerCase()
    const desc = (c.description || "").toLowerCase()
    return name.includes(key) || desc.includes(key)
  })
})

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

onMounted(loadCourses)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 6px 10px;
  border-radius: 9999px;

  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.2px;

  color: #065f46;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.28);

  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 10px 25px rgba(16, 185, 129, 0.18);
}

.price-badge::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
}

.group:hover .price-badge {
  transform: translateY(-1px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 16px 35px rgba(16, 185, 129, 0.24);
}
</style>
