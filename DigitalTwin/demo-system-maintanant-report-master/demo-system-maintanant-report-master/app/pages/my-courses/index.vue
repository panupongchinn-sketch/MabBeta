<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="min-w-0">
        <h1 class="text-2xl sm:text-3xl font-bold">คอร์สของฉัน</h1>

        <!-- user strip -->
        <div class="mt-3 flex items-center gap-3">
          <div
            class="h-10 w-10 rounded-full bg-red-600 text-white grid place-items-center font-bold select-none"
            :title="displayName"
          >
            {{ initials }}
          </div>

          <div class="min-w-0">
            <div class="text-sm text-slate-700">
              สวัสดี, <span class="font-semibold text-slate-900">{{ displayName }}</span>
            </div>
            <div v-if="displayEmail" class="text-xs text-slate-400 truncate">
              {{ displayEmail }}
            </div>
            <div class="text-sm text-slate-500 mt-1">
              เฉพาะคอร์สที่คุณซื้อไว้เท่านั้น
            </div>
          </div>

          <div class="ml-auto">
            <span
              class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
            >
              สมาชิก
            </span>
          </div>
        </div>
      </div>

      <button
        class="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        type="button"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-slate-500 flex items-center gap-2">
      <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></span>
      กำลังโหลด...
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {{ errorMsg }}
    </div>

    <!-- Content -->
    <div v-else>
      <div v-if="items.length === 0" class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        ยังไม่มีคอร์สที่ซื้อไว้
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="c in items"
          :key="c.id"
          :to="`/my-courses/${c.id}`"
          class="group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
        >
          <div class="aspect-[16/9] bg-slate-100 overflow-hidden">
            <img
              v-if="c.thumbnail_url"
              :src="c.thumbnail_url"
              class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              alt=""
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No thumbnail
            </div>
          </div>

          <div class="p-4">
            <div class="font-bold text-slate-900 line-clamp-2">{{ c.title }}</div>
            <div class="text-sm text-slate-500 mt-1 line-clamp-2">{{ c.description || "" }}</div>

            <div class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600">
              เข้าเรียน <span aria-hidden="true">→</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] })

type Course = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
}

type EnrollRow = {
  purchased_at?: string | null
  course: Course | null
}

const { $supabase } = useNuxtApp() as any
const { getSession } = useAuth()

const loading = ref(true)
const errorMsg = ref("")
const items = ref<Course[]>([])

const displayName = ref("ผู้ใช้งาน")
const displayEmail = ref("")

const initials = computed(() => {
  const base = (displayName.value || displayEmail.value || "U").trim()
  const parts = base.split(/[\s@._-]+/).filter(Boolean)
  const a = (parts[0]?.[0] || "U").toUpperCase()
  const b = (parts[1]?.[0] || "").toUpperCase()
  return (a + b).slice(0, 2)
})

async function tryLoadProfileName(uid: string) {
  // ลองดึงจากตาราง profiles (ถ้ามี) — ถ้าไม่มี/พัง จะข้ามเงียบๆ
  try {
    const q1 = await $supabase.from("profiles").select("*").eq("id", uid).maybeSingle()
    let prof = q1?.data

    if (!prof && !q1?.error) {
      const q2 = await $supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle()
      prof = q2?.data
    }

    if (prof) {
      displayName.value =
        prof.full_name ||
        prof.display_name ||
        prof.name ||
        prof.username ||
        displayName.value
    }
  } catch {
    // ignore
  }
}

const load = async () => {
  loading.value = true
  errorMsg.value = ""
  items.value = []

  try {
    const { session } = await getSession()
    const uid = session?.user?.id
    if (!uid) {
      errorMsg.value = "กรุณาเข้าสู่ระบบก่อน"
      return
    }

    displayEmail.value = session.user.email || ""

    // ตั้งชื่อจาก metadata ก่อน (ถ้ามี)
    const meta = session.user.user_metadata || {}
    displayName.value =
      meta.full_name ||
      meta.name ||
      meta.display_name ||
      (displayEmail.value ? displayEmail.value.split("@")[0] : "ผู้ใช้งาน")

    // แล้วค่อยลองทับด้วยชื่อจาก profiles (ถ้ามี)
    await tryLoadProfileName(uid)

    // ✅ ดึง enrollments แล้ว join ไป courses (ชัวร์สุด)
    const { data, error } = await $supabase
      .from("course_enrollments")
      .select("purchased_at, course:courses(id,title,description,thumbnail_url)")
      .eq("user_id", uid)
      .order("purchased_at", { ascending: false })

    if (error) throw error

    const rows = (data || []) as EnrollRow[]
    items.value = rows.map((r) => r.course).filter(Boolean) as Course[]
  } catch (e: any) {
    errorMsg.value = e?.message || "โหลดข้อมูลไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
