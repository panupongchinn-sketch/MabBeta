<template>
  <div class="space-y-5">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <NuxtLink to="/my-courses" class="text-sm text-slate-500 hover:text-red-700">
          ← กลับไปคอร์สของฉัน
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-bold mt-1">{{ course?.title || "คอร์สเรียน" }}</h1>
        <p class="text-sm text-slate-500">{{ course?.description || "" }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 flex items-center gap-2">
      <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></span>
      กำลังโหลด...
    </div>

    <div v-else-if="errorMsg" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {{ errorMsg }}
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Video -->
      <div class="lg:col-span-8">
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="aspect-video bg-black">
            <video
              v-if="videoUrl"
              :key="videoUrl"
              :src="videoUrl"
               controls
  controlslist="nodownload noremoteplayback"
  disablepictureinpicture
  playsinline
  @contextmenu.prevent
  class="w-full h-full"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-white/70">
              เลือกบทเรียนเพื่อเริ่มเล่นวิดีโอ
            </div>
          </div>

          <div class="p-4 border-t border-slate-100">
            <div class="font-semibold">{{ currentLesson?.title || "-" }}</div>
            <div class="text-xs text-slate-500 mt-1">วิดีโอจะเป็นลิงก์ชั่วคราว (Signed URL)</div>

            <div v-if="currentLesson?.video_path" class="text-xs text-slate-400 mt-2 break-all">
              path: {{ currentLesson.video_path }}
            </div>
          </div>
        </div>
      </div>

      <!-- Lessons -->
      <div class="lg:col-span-4">
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <div class="font-bold">บทเรียน</div>
            <button class="text-sm text-slate-600 hover:text-red-700" type="button" @click="reloadSignedUrl">
              รีเฟรชลิงก์
            </button>
          </div>

          <div class="max-h-[520px] overflow-auto">
            <button
              v-for="l in lessons"
              :key="l.id"
              type="button"
              class="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50"
              :class="currentLesson?.id === l.id ? 'bg-red-50' : ''"
              @click="selectLesson(l)"
            >
              <div class="font-semibold text-slate-900 line-clamp-2">{{ l.title }}</div>
              <div class="text-xs text-slate-500 mt-1">Lesson {{ l.sort_order }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] })

type Course = { id: string; title: string; description: string | null; thumbnail_url: string | null }
type Lesson = { id: string; course_id: string; title: string; video_path: string; sort_order: number }

const { $supabase } = useNuxtApp() as any
const route = useRoute()
const { getSession } = useAuth()

const courseId = computed(() => String(route.params.id || ""))

const loading = ref(true)
const errorMsg = ref("")

const course = ref<Course | null>(null)
const lessons = ref<Lesson[]>([])
const currentLesson = ref<Lesson | null>(null)
const videoUrl = ref("")

async function buildSignedUrl() {
  errorMsg.value = ""
  videoUrl.value = ""
  if (!currentLesson.value?.video_path) return

  const { data, error } = await $supabase.storage
    .from("course-videos")
    .createSignedUrl(currentLesson.value.video_path, 60 * 60)

  if (error) {
    // ❗ ถ้า path ไม่ตรง หรือ policy ไม่ให้ access จะขึ้น Object not found
    errorMsg.value = error.message
    return
  }

  videoUrl.value = data?.signedUrl || ""
}

async function selectLesson(l: Lesson) {
  currentLesson.value = l
  await buildSignedUrl()
}

async function reloadSignedUrl() {
  await buildSignedUrl()
}

const load = async () => {
  loading.value = true
  errorMsg.value = ""
  videoUrl.value = ""
  course.value = null
  lessons.value = []
  currentLesson.value = null

  try {
    const { session } = await getSession()
    const uid = session?.user?.id
    if (!uid) {
      errorMsg.value = "กรุณาเข้าสู่ระบบก่อน"
      return
    }

    // ✅ เช็คสิทธิ์: ต้อง match ทั้ง user_id และ course_id
    const { data: enr, error: enrErr } = await $supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", uid)
      .eq("course_id", courseId.value)
      .maybeSingle()

    if (enrErr) throw enrErr
    if (!enr) {
      errorMsg.value = "คุณไม่มีสิทธิ์เข้าถึงคอร์สนี้"
      return
    }

    const { data: c, error: cErr } = await $supabase
      .from("courses")
      .select("id,title,description,thumbnail_url")
      .eq("id", courseId.value)
      .single()

    if (cErr) throw cErr
    course.value = c as Course

    const { data: ls, error: lErr } = await $supabase
      .from("course_lessons")
      .select("id,course_id,title,video_path,sort_order")
      .eq("course_id", courseId.value)
      .order("sort_order", { ascending: true })

    if (lErr) throw lErr
    lessons.value = (ls || []) as Lesson[]

    const first = lessons.value.at(0)
    if (first) await selectLesson(first)
  } catch (e: any) {
    errorMsg.value = e?.message || "โหลดข้อมูลไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

watch(courseId, () => load(), { immediate: true })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
