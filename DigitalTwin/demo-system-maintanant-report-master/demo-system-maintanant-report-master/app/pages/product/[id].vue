<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">
          {{ product?.name || "Product detail" }}
        </h1>
        <p class="text-sm text-slate-500">รายละเอียดสินค้า</p>
      </div>

      <NuxtLink
        to="/product"
        class="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
      >
        ← กลับหน้าสินค้า
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex items-center gap-3 text-slate-500">
      <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></span>
      <span class="font-medium">กำลังโหลดรายละเอียด...</span>
    </div>

    <div
      v-else-if="error"
      class="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
    >
      <div class="font-bold">โหลดข้อมูลไม่สำเร็จ</div>
      <div class="text-sm mt-1">{{ error }}</div>

      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          @click="loadProduct"
        >
          ลองอีกครั้ง
        </button>
        <NuxtLink
          to="/product"
          class="px-3 py-2 rounded-md border border-red-200 text-sm font-semibold hover:bg-red-50"
        >
          กลับ
        </NuxtLink>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <div class="aspect-[16/9] rounded-lg border border-slate-100 bg-white flex items-center justify-center overflow-hidden">
              <img
                :src="product?.image_url || fallbackImg"
                :alt="product?.name || 'product'"
                class="w-full h-full object-contain"
                loading="lazy"
                @error="onImgError"
              />
            </div>
          </div>

          <div class="p-4 sm:p-6 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg border border-slate-200 p-3">
                <div class="text-xs text-slate-500">SKU</div>
                <div class="font-semibold text-slate-900">{{ product?.sku || "-" }}</div>
              </div>

              <div class="rounded-lg border border-slate-200 p-3">
                <div class="text-xs text-slate-500">Category</div>
                <div class="font-semibold text-slate-900">{{ product?.category || "-" }}</div>
              </div>

              <div class="rounded-lg border border-slate-200 p-3">
                <div class="text-xs text-slate-500">Unit</div>
                <div class="font-semibold text-slate-900">{{ product?.unit || "-" }}</div>
              </div>

              <div class="rounded-lg border border-slate-200 p-3">
                <div class="text-xs text-slate-500">ID</div>
                <div class="font-mono text-xs text-slate-700 break-all">{{ product?.id }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-900">สอบถาม / ขอใบเสนอราคา</h2>
            <p class="text-sm text-slate-500 mt-1">กดเพื่อไปหน้า “ติดต่อเรา”</p>
          </div>

          <div class="p-4 sm:p-6">
            <button
              type="button"
              class="w-full h-11 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700"
              @click="goContact"
            >
              สนใจสินค้านี้ → ติดต่อเรา
            </button>
          </div>
        </div>
      </div>
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
}

const { $supabase } = useNuxtApp()
const route = useRoute()

const id = computed(() => String(route.params.id || ""))

const fallbackImg = "https://picsum.photos/seed/productdetail/1200/900"
const product = ref<ProductRow | null>(null)
const loading = ref(true)
const error = ref("")

const loadProduct = async () => {
  loading.value = true
  error.value = ""
  try {
    const { data, error: e } = await ($supabase as any)
      .from("products")
      .select("id, sku, name, category, image_url, unit")
      .eq("id", id.value)
      .maybeSingle()

    if (e) throw e
    product.value = (data || null) as ProductRow | null
    if (!product.value) error.value = "ไม่พบสินค้านี้ (id ไม่ถูกต้อง)"
  } catch (err: any) {
    error.value = err?.message || "Failed to load product"
    product.value = null
  } finally {
    loading.value = false
  }
}

const onImgError = (e: Event) => {
  const el = e.target as HTMLImageElement | null
  if (el) el.src = fallbackImg
}

const goContact = async () => {
  const qs = new URLSearchParams()
  if (product.value?.name) qs.set("subject", `สนใจสินค้า: ${product.value.name}`)
  if (id.value) qs.set("product_id", id.value)
  await navigateTo(`/contact?${qs.toString()}`)
}

onMounted(loadProduct)
</script>
