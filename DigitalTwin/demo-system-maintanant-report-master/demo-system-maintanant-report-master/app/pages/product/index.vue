<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">ผลิตภัณฑ์</h1>
        <p class="text-sm text-slate-500">ทั้งหมด: {{ filtered.length }} รายการ</p>
      </div>

      <button
        type="button"
        class="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
        @click="loadProducts"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="flex items-center gap-3 text-slate-500">
      <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></span>
      <span class="font-medium">กำลังโหลด...</span>
    </div>

    <div
      v-else-if="error"
      class="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
    >
      <div class="font-bold">โหลดข้อมูลไม่ได้</div>
      <div class="text-sm mt-1">{{ error }}</div>
      <button
        type="button"
        class="mt-3 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        @click="loadProducts"
      >
        ลองอีกครั้ง
      </button>
    </div>

    <!-- ✅ Group by Brand -->
    <div v-else class="space-y-8">
      <section v-for="g in groupedByBrand" :key="g.brand" class="space-y-3">
        <div class="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-xl font-extrabold text-slate-900">
              {{ g.brand }}
            </h2>
            <p class="text-sm text-slate-500">
              {{ g.items.length }} รายการ
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <NuxtLink
            v-for="p in g.items"
            :key="p.id"
            :to="`/product/${p.id}`"
            class="block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-slate-200"
            :aria-label="`View details ${p.name || ''}`"
          >
            <div class="aspect-[4/3] bg-white flex items-center justify-center border-b border-slate-100 overflow-hidden">
              <img
                :src="p.image_url || fallbackImg"
                :alt="p.name || 'product'"
                class="w-full h-full object-contain"
                loading="lazy"
                @error="onImgError"
              />
            </div>

            <div class="p-4 space-y-2">
              <h3 class="font-bold text-slate-900 leading-snug line-clamp-2">
                {{ p.name || "-" }}
              </h3>

              <div class="text-xs text-slate-600 space-y-1">
                <div><span class="font-semibold">Brand:</span> {{ p.brand || "-" }}</div>
                <div><span class="font-semibold">SKU:</span> {{ p.sku || "-" }}</div>
                <div><span class="font-semibold">Category:</span> {{ p.category || "-" }}</div>
                <div><span class="font-semibold">Unit:</span> {{ p.unit || "-" }}</div>
              </div>

              <div class="pt-2">
                <span class="text-sm font-semibold text-red-600 hover:underline">
                  View details &gt;
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
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
  brand: string | null
}

const { $supabase } = useNuxtApp()

const fallbackImg = "https://picsum.photos/seed/product/1200/900"

const products = ref<ProductRow[]>([])
const loading = ref(true)
const error = ref("")

const filtered = computed(() => products.value)

const normBrand = (b: string | null | undefined) => {
  const v = (b || "").trim()
  return v ? v : "Unbranded"
}

const groupedByBrand = computed(() => {
  const map = new Map<string, ProductRow[]>()

  for (const p of filtered.value) {
    const key = normBrand(p.brand)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  // sort: A-Z แต่ให้ Unbranded ไปท้าย
  const brands = Array.from(map.keys()).sort((a, b) => {
    if (a === "Unbranded") return 1
    if (b === "Unbranded") return -1
    return a.localeCompare(b, "en")
  })

  return brands.map((brand) => {
    const items = (map.get(brand) || []).slice().sort((x, y) =>
      (x.name || "").localeCompare(y.name || "", "th")
    )
    return { brand, items }
  })
})

const loadProducts = async () => {
  loading.value = true
  error.value = ""
  try {
    const { data, error: e } = await ($supabase as any)
      .from("products")
      .select("id, sku, name, category, image_url, unit, brand")
      .order("brand", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })

    if (e) throw e
    products.value = (data || []) as ProductRow[]
  } catch (err: any) {
    error.value = err?.message || "Failed to load products"
    products.value = []
  } finally {
    loading.value = false
  }
}

const onImgError = (e: Event) => {
  const el = e.target as HTMLImageElement | null
  if (el) el.src = fallbackImg
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
