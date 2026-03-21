<template>
  <div>
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold text-slate-700 tracking-tight">
          ผลิตภัณฑ์
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          ทั้งหมด:
          <span class="font-bold text-slate-700">{{ filteredProducts.length }}</span>
          รายการ
        </p>
      </div>

      <button
        class="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
        type="button"
        @click="loadProducts"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="mt-10 flex items-center gap-3 text-slate-500">
      <span class="loading loading-spinner loading-md"></span>
      <span class="font-medium">กำลังโหลดสินค้า...</span>
    </div>

    <div v-else-if="error" class="mt-10 p-6 border border-red-200 bg-red-50 rounded-lg">
      <div class="font-bold text-red-700">โหลดข้อมูลไม่สำเร็จ</div>
      <div class="text-sm text-red-600 mt-1">{{ error }}</div>
      <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md" type="button" @click="loadProducts">
        ลองอีกครั้ง
      </button>
    </div>

    <!-- ✅ ปรับตรงนี้: ให้รูปขึ้นชัวร์ + card เนียนแบบตัวอย่าง -->
    <section v-else class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <article
        v-for="p in filteredProducts"
        :key="p.id"
        class="group bg-white border border-slate-200 hover:border-slate-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <!-- Image -->
        <div class="bg-white border-b border-slate-100">
          <div class="w-full aspect-[16/9] sm:aspect-[4/3] p-4 flex items-center justify-center overflow-hidden">
            <img
              :src="p.image_url || fallbackImg"
              :alt="p.name || 'product'"
              class="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.05]"
              loading="lazy"
              @error="onImgError"
            />
          </div>
        </div>

        <!-- Body -->
        <div class="p-5">
          <h3 class="text-lg font-bold text-slate-800 group-hover:text-slate-900 line-clamp-2">
            {{ p.name }}
          </h3>

          <div class="mt-2 text-xs text-slate-500 space-y-1">
            <div v-if="p.sku">
              <span class="font-semibold text-slate-600">SKU:</span>
              <span class="ml-1">{{ p.sku }}</span>
            </div>

            <div v-if="p.category">
              <span class="font-semibold text-slate-600">Category:</span>
              <span class="ml-1">{{ p.category }}</span>
            </div>

            <div v-if="p.unit">
              <span class="font-semibold text-slate-600">Unit:</span>
              <span class="ml-1">{{ p.unit }}</span>
            </div>
          </div>

          <div class="mt-5">
            <button
              class="text-sm font-semibold text-red-600 hover:text-red-700"
              type="button"
              @click="goDetail(p.id)"
            >
              View details &gt;
            </button>
          </div>
        </div>
      </article>

      <div
        v-if="filteredProducts.length === 0"
        class="col-span-full p-10 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg"
      >
        ไม่พบสินค้าในตาราง (หรือคำค้นหาไม่ตรง)
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type ProductRow = {
  id: string
  sku: string | null
  name: string | null
  category: string | null
  image_url: string | null
  unit: string | null
}

const { $supabase } = useNuxtApp()

// ✅ ใช้ค่า search จาก header (layout)
const q = useState<string>("mb_search_q", () => "")

const fallbackImg = "https://picsum.photos/seed/mb/900/600"

const products = ref<ProductRow[]>([])
const loading = ref(true)
const error = ref("")

const loadProducts = async () => {
  loading.value = true
  error.value = ""
  try {
    const { data, error: e } = await ($supabase as any)
      .from("products")
      .select("id, sku, name, category, image_url, unit")
      .order("name", { ascending: true })

    if (e) throw e
    products.value = Array.isArray(data) ? (data as ProductRow[]) : []
  } catch (err: any) {
    error.value = err?.message || "Unknown error"
    products.value = []
  } finally {
    loading.value = false
  }
}

const filteredProducts = computed(() => {
  const key = (q.value || "").trim().toLowerCase()
  if (!key) return products.value
  return products.value.filter((p) => {
    const sku = (p.sku || "").toLowerCase()
    const name = (p.name || "").toLowerCase()
    const category = (p.category || "").toLowerCase()
    return sku.includes(key) || name.includes(key) || category.includes(key)
  })
})

const onImgError = (e: Event) => {
  const el = e.target as HTMLImageElement | null
  if (el) el.src = fallbackImg
}

// ✅ ถ้ายังไม่มีหน้ารายละเอียด ให้ปล่อยไว้เฉย ๆ ก่อน
const goDetail = async (id: string) => {
  // ถ้ามีหน้ารายละเอียด: /product/[id]
  // await navigateTo(`/product/${id}`)
  console.log("detail:", id)
}

onMounted(loadProducts)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
