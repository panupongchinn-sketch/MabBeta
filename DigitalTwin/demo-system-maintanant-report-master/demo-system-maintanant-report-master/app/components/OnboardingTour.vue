<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="visible" style="position:fixed;inset:0;z-index:9000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

        <!-- Overlay + spotlight -->
        <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tmask">
              <rect width="100%" height="100%" fill="white"/>
              <rect v-if="spot" :x="spot.x-12" :y="spot.y-12" :width="spot.w+24" :height="spot.h+24" rx="12" fill="black"/>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(15,23,42,0.55)" mask="url(#tmask)"/>
          <rect v-if="spot" :x="spot.x-12" :y="spot.y-12" :width="spot.w+24" :height="spot.h+24" rx="12" fill="none" stroke="#6366f1" stroke-width="2"/>
        </svg>

        <!-- Card -->
        <Transition name="card-anim" mode="out-in">
          <div :key="current" :style="cardStyle"
            style="width:440px;max-width:calc(100vw - 24px);background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 20px 60px rgba(0,0,0,0.15),0 0 0 1px rgba(0,0,0,0.06);z-index:9001">

            <!-- Top accent bar -->
            <div :style="{ background: step.accent }" style="height:4px;width:100%"/>

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 0">
              <img src="/dt-hero.jpg" alt="MapBeta" style="height:32px;width:auto;object-fit:contain;display:block"/>
              <span style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.04em">{{ current+1 }} / {{ steps.length }}</span>
            </div>

            <!-- Progress -->
            <div style="padding:10px 20px 0">
              <div style="height:3px;border-radius:2px;background:#f1f5f9;overflow:hidden">
                <div :style="{ width: ((current+1)/steps.length*100)+'%', background: step.accent }" style="height:100%;border-radius:2px;transition:width .4s cubic-bezier(.4,0,.2,1)"/>
              </div>
            </div>

            <!-- Body -->
            <div style="padding:16px 20px 12px">
              <h3 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 8px;line-height:1.3;letter-spacing:-.02em">{{ step.title }}</h3>
              <p style="font-size:13.5px;color:#475569;line-height:1.7;margin:0 0 14px">{{ step.desc }}</p>
            </div>

            <!-- Footer -->
            <div style="display:flex;align-items:center;gap:8px;padding:12px 20px 16px;border-top:1px solid #f1f5f9;background:#fafafa">
              <button @click="onSkip"
                style="font-size:11px;color:#94a3b8;background:none;border:none;cursor:pointer;padding:0;white-space:nowrap;transition:color .15s"
                onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#94a3b8'">ข้ามทั้งหมด</button>

              <div style="display:flex;gap:5px;flex:1;justify-content:center">
                <span v-for="i in steps.length" :key="i" @click="goTo(i-1)"
                  :style="{ width: i-1===current ? '18px':'6px', background: i-1===current ? step.accent : '#e2e8f0' }"
                  style="height:6px;border-radius:3px;cursor:pointer;transition:all .25s"/>
              </div>

              <div style="display:flex;align-items:center;gap:6px">
                <button v-if="current > 0" @click="prev"
                  style="width:34px;height:34px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0"
                  onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0'">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button v-if="current < steps.length-1" @click="next"
                  :style="{ background: step.accent, boxShadow: '0 4px 14px '+step.shadow }"
                  style="height:34px;padding:0 16px;border-radius:10px;border:none;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap"
                  onmouseover="this.style.opacity='.88';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                  ถัดไป
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
                <button v-else @click="onDone"
                  style="height:34px;padding:0 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(16,185,129,0.3);transition:all .15s;white-space:nowrap"
                  onmouseover="this.style.opacity='.88';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                  เริ่มใช้งาน
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'mapbeta_onboarding_v2'
const visible   = ref(false)
const current   = ref(0)
const spot      = ref<{ x:number; y:number; w:number; h:number } | null>(null)
const cardStyle = ref<Record<string,string>>({})

interface Step {
  tag: string; title: string; desc: string; icon: string
  iconBg: string; iconBorder: string; tips?: string[]
  accent: string; shadow: string; tagColor: string; tagBg: string; tagBorder: string
  target?: string; cardPos?: 'top'|'bottom'|'right'|'left'|'center'
}

const steps: Step[] = [
  {
    tag: 'ยินดีต้อนรับ', title: 'ยินดีต้อนรับสู่ MapBeta Digital Twin',
    desc: 'แพลตฟอร์มพัฒนาฐานข้อมูลเมืองเพื่อการบริหารจัดการ ที่ช่วยให้หน่วยงานมองเห็นข้อมูลพื้นที่ อาคาร โครงสร้างพื้นฐาน และสาธารณูปโภคในภาพรวมเดียว ผ่านระบบ 3D Digital Twin เพื่อสนับสนุนการวางแผน ติดตาม และตัดสินใจอย่างมีประสิทธิภาพ',
    icon: `<svg width="22" height="22" fill="none" stroke="#6366f1" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 3"/></svg>`,
    iconBg:'#eef2ff', iconBorder:'#c7d2fe',
    accent:'linear-gradient(90deg,#6366f1,#818cf8)', shadow:'rgba(99,102,241,0.25)',
    tagColor:'#6366f1', tagBg:'#eef2ff', tagBorder:'#c7d2fe',
    tips:['จำลองเมืองในรูปแบบ 3D แบบ Real-time','วิเคราะห์โครงสร้างพื้นฐานครบวงจร','บันทึกและแชร์โปรเจคได้ทันที'],
    cardPos:'center',
  },
  {
    tag: 'แผนที่', title: 'ค้นหาและตั้งพิกัด',
    desc: 'ค้นหาสถานที่หรือกรอกพิกัด LAT / LNG โดยตรง แล้วกด Apply Map เพื่อนำทางบนแผนที่ 3D',
    icon: `<svg width="22" height="22" fill="none" stroke="#10b981" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    iconBg:'#ecfdf5', iconBorder:'#a7f3d0',
    accent:'linear-gradient(90deg,#10b981,#34d399)', shadow:'rgba(16,185,129,0.25)',
    tagColor:'#059669', tagBg:'#ecfdf5', tagBorder:'#a7f3d0',
    tips:['พิมพ์ชื่อสถานที่ในช่องค้นหา','ปรับ ZOOM เพื่อขยาย/ย่อมุมมอง','กด Apply Map เพื่อเคลื่อนแผนที่'],
    target:'.panel-card', cardPos:'right',
  },
  {
    tag: 'เมนูหลัก', title: 'แถบฟีเจอร์ด้านล่าง',
    desc: 'เข้าถึงทุกฟีเจอร์ผ่านแถบเมนูด้านล่าง ตั้งแต่โมเดล 3D ไปจนถึงระบบสาธารณูปโภค Real-time',
    icon: `<svg width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    iconBg:'#fffbeb', iconBorder:'#fde68a',
    accent:'linear-gradient(90deg,#f59e0b,#fbbf24)', shadow:'rgba(245,158,11,0.25)',
    tagColor:'#d97706', tagBg:'#fffbeb', tagBorder:'#fde68a',
    tips:['Street Light — จัดการโคมไฟถนน','CCTV — กล้องวงจรปิดบนแผนที่','ประปา — วางท่อน้ำและ node','Traffic / PM2.5 — ข้อมูล Real-time'],
    target:'.bottom-bar', cardPos:'top',
  },
  {
    tag: 'โมเดล 3D', title: 'นำเข้าโมเดลสถาปัตยกรรม',
    desc: 'อัพโหลดไฟล์ .gltf .glb .obj เพื่อวางโมเดลอาคารหรืออุปกรณ์ลงบนแผนที่ได้ทันที',
    icon: `<svg width="22" height="22" fill="none" stroke="#8b5cf6" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>`,
    iconBg:'#f5f3ff', iconBorder:'#ddd6fe',
    accent:'linear-gradient(90deg,#8b5cf6,#a78bfa)', shadow:'rgba(139,92,246,0.25)',
    tagColor:'#7c3aed', tagBg:'#f5f3ff', tagBorder:'#ddd6fe',
    tips:['กดปุ่ม ↑ ที่แถบล่างขวาเพื่ออัพโหลด','ลากโมเดลวางตำแหน่งบนแผนที่','ปรับ Rotate / Scale ได้อิสระ'],
    target:'.bb-actions', cardPos:'top',
  },
  {
    tag: 'โปรเจค', title: 'บันทึกและโหลดงาน',
    desc: 'บันทึกงานไว้บน Cloud และเรียกคืนโปรเจคเก่าได้ทุกเมื่อ โปรเจคของคุณเป็นส่วนตัว',
    icon: `<svg width="22" height="22" fill="none" stroke="#ef4444" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`,
    iconBg:'#fef2f2', iconBorder:'#fecaca',
    accent:'linear-gradient(90deg,#ef4444,#f87171)', shadow:'rgba(239,68,68,0.25)',
    tagColor:'#dc2626', tagBg:'#fef2f2', tagBorder:'#fecaca',
    tips:['กดเมนู Project ที่แถบด้านล่าง','ตั้งชื่อโปรเจคก่อนกด Save','โหลดโปรเจคเก่ากลับมาต่อได้'],
    target:'.bb-tabs', cardPos:'top',
  },
  {
    tag: 'พร้อมแล้ว', title: 'เริ่มสร้างเมืองดิจิทัลของคุณ',
    desc: 'คุณพร้อมใช้งาน MapBeta Digital Twin แล้ว กดปุ่ม ? ที่แถบล่างเพื่อเปิด Guide ซ้ำได้ตลอดเวลา',
    icon: `<svg width="22" height="22" fill="none" stroke="#10b981" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    iconBg:'#ecfdf5', iconBorder:'#a7f3d0',
    accent:'linear-gradient(90deg,#10b981,#059669)', shadow:'rgba(16,185,129,0.25)',
    tagColor:'#059669', tagBg:'#ecfdf5', tagBorder:'#a7f3d0',
    tips:['กด ? ที่เมนูล่างเพื่อดู Guide ซ้ำ','ติดต่อทีมงานที่เมนู ผู้ติดต่อ'],
    cardPos:'center',
  },
]

const step = computed(() => steps[current.value])

function updateSpot() {
  const s = step.value
  if (!s.target) { spot.value = null; placeCard(null, s.cardPos); return }
  const el = document.querySelector(s.target) as HTMLElement | null
  if (!el) { spot.value = null; placeCard(null, 'center'); return }
  const r = el.getBoundingClientRect()
  spot.value = { x: r.left, y: r.top, w: r.width, h: r.height }
  placeCard(r, s.cardPos)
}

function placeCard(r: DOMRect | null, pos?: string) {
  const W = window.innerWidth, H = window.innerHeight
  const cW = 440, cH = 340
  if (!r || pos === 'center') {
    cardStyle.value = { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }
    return
  }
  let top = 0, left = 0
  if (pos === 'top')         { top = Math.max(12, r.top - cH - 24);      left = Math.min(Math.max(12, r.left + r.width/2 - cW/2), W - cW - 12) }
  else if (pos === 'bottom') { top = Math.min(r.bottom + 24, H - cH - 12); left = Math.min(Math.max(12, r.left + r.width/2 - cW/2), W - cW - 12) }
  else if (pos === 'right')  { top = Math.min(Math.max(12, r.top + r.height/2 - cH/2), H - cH - 12); left = Math.min(r.right + 24, W - cW - 12) }
  else                       { top = Math.max(12, r.top - cH - 24);      left = Math.min(Math.max(12, r.left), W - cW - 12) }
  cardStyle.value = { position:'fixed', top: top+'px', left: left+'px' }
}

const next   = () => { if (current.value < steps.length-1) { current.value++; nextTick(updateSpot) } }
const prev   = () => { if (current.value > 0) { current.value--; nextTick(updateSpot) } }
const goTo   = (i: number) => { current.value = i; nextTick(updateSpot) }
const onSkip = () => finish()
const onDone = () => finish()
function finish() { visible.value = false; localStorage.setItem(STORAGE_KEY, '1') }
function start() { current.value = 0; visible.value = true; nextTick(updateSpot) }
defineExpose({ start })

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) setTimeout(start, 1400)
  window.addEventListener('resize', updateSpot)
})
onUnmounted(() => window.removeEventListener('resize', updateSpot))
</script>

<style scoped>
.tour-fade-enter-active { transition: opacity .35s ease; }
.tour-fade-leave-active { transition: opacity .25s ease; }
.tour-fade-enter-from, .tour-fade-leave-to { opacity: 0; }
.card-anim-enter-active { transition: all .3s cubic-bezier(.4,0,.2,1); }
.card-anim-leave-active { transition: all .2s cubic-bezier(.4,0,.2,1); }
.card-anim-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.card-anim-leave-to  { opacity: 0; transform: translateY(-6px) scale(.99); }
</style>
