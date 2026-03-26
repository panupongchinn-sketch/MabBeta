<template>
  <button
    v-if="!open"
    class="ai-fab"
    title="AI MapBeta"
    @click="open = true"
  >
    <img src="/Screenshot 2026-03-18 222417.png" alt="AiMapBeta" />
    <span v-if="alertCount > 0" class="fab-badge">{{ alertCount }}</span>
  </button>

  <Transition name="ai-panel">
    <section v-if="open" class="ai-panel-shell">
      <header class="ai-header">
        <div class="ai-brand">
          <img src="/Screenshot 2026-03-18 222417.png" alt="AiMapBeta" />
        </div>
        <div class="ai-actions">
          <button class="icon-btn" title="รีเฟรชข้อมูล" @click="emit('refresh')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button class="icon-btn" title="ปิด" @click="open = false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </header>

      <nav class="ai-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="ai-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'incidents' && alertCount > 0" class="tab-badge">{{ alertCount }}</span>
        </button>
      </nav>

      <div class="ai-body">
        <div v-if="activeTab === 'overview'" class="stack">
          <div class="overview-grid">
            <article class="card" :style="aqiTone.cardStyle">
              <p class="label">🌫️ อากาศ</p>
              <p class="aqi-value">{{ aqi ?? '—' }}</p>
              <p class="hint">AQI</p>
              <span class="pill" :style="aqiTone.pillStyle">{{ aqiLabel }}</span>
              <p v-if="pm25 != null" class="hint">PM2.5 {{ pm25 }} µg/m³</p>
            </article>

            <article class="card">
              <p class="label">🚦 จราจร</p>
              <div class="row"><span class="dot green">●</span><span class="muted">ปกติ</span><strong>{{ traffic.free }}</strong></div>
              <div class="row"><span class="dot yellow">●</span><span class="muted">ช้า</span><strong>{{ traffic.slow }}</strong></div>
              <div class="row"><span class="dot red">●</span><span class="muted">ติดขัด</span><strong>{{ traffic.jam }}</strong></div>
              <span class="pill" :style="trafficBadgeStyle">{{ trafficStatus }}</span>
            </article>

            <article class="card">
              <p class="label">💡 ไฟถนน</p>
              <template v-if="lampsTotal > 0">
                <p class="metric"><strong>{{ lampsOn }}</strong><span>/ {{ lampsTotal }}</span></p>
                <div class="progress">
                  <div class="progress-fill" :style="{ width: lampsPct + '%', background: lampsPct >= 80 ? '#22c55e' : lampsPct >= 50 ? '#f59e0b' : '#ef4444' }"></div>
                </div>
                <p class="hint">{{ lampsPct }}% ทำงาน</p>
              </template>
              <p v-else class="hint">ไม่มีข้อมูล</p>
            </article>

            <article class="card">
              <p class="label">💧 แหล่งน้ำ</p>
              <template v-if="waterSources.length > 0">
                <p class="metric"><strong>{{ waterSources.length }}</strong></p>
                <p class="hint">เขื่อน/แหล่งน้ำ</p>
                <p v-if="highWaterCount > 0" class="warn">⚠️ ระดับสูง {{ highWaterCount }} แห่ง</p>
                <p v-else-if="lowWaterCount > 0" class="info">ℹ️ ระดับต่ำ {{ lowWaterCount }} แห่ง</p>
                <p v-else class="ok">✓ ปกติ</p>
              </template>
              <p v-else class="hint">ไม่มีข้อมูล</p>
            </article>
          </div>

          <article class="card env-card">
            <p class="label">📊 สภาพแวดล้อม & โครงสร้างพื้นฐาน</p>
            <div class="env-grid">
              <div v-if="weather.temp != null"><span>🌡️</span><strong>{{ weather.temp }}°</strong><small>อุณหภูมิ</small></div>
              <div v-if="weather.wind != null"><span>💨</span><strong>{{ weather.wind }}</strong><small>km/h</small></div>
              <div v-if="weather.humidity != null"><span>💧</span><strong>{{ weather.humidity }}%</strong><small>ความชื้น</small></div>
              <div><span>📹</span><strong>{{ cctvCount }}</strong><small>CCTV</small></div>
              <div><span>🏙️</span><strong>{{ modelCount }}</strong><small>โมเดล</small></div>
            </div>
          </article>

          <p class="footnote">Rule Engine ตรวจสอบล่าสุด {{ updatedAt }} น.</p>
        </div>

        <div v-if="activeTab === 'incidents'" class="stack">
          <div v-if="incidents.length === 0" class="empty-state">
            <p class="emoji">✅</p>
            <p class="ok">ทุกระบบปกติ</p>
            <p class="hint">ไม่พบเหตุการณ์ผิดปกติในขณะนี้</p>
          </div>

          <article v-for="inc in incidents" :key="inc.id" class="card incident-card" :style="{ borderLeftColor: severityColor(inc.severity) }">
            <div class="incident-head">
              <span>{{ inc.icon }}</span>
              <strong :style="{ color: severityColor(inc.severity) }">{{ inc.title }}</strong>
              <span class="pill" :style="severityBadge(inc.severity)">{{ severityLabel(inc.severity) }}</span>
            </div>
            <p class="hint">{{ inc.detail }}</p>
          </article>

          <div v-if="incidents.length > 0" class="card summary-strip">
            <span class="critical">🔴 วิกฤต {{ incidents.filter(i => i.severity === 'critical').length }}</span>
            <span class="warning">🟡 เฝ้าระวัง {{ incidents.filter(i => i.severity === 'warning').length }}</span>
            <span class="info">🔵 แจ้งเตือน {{ incidents.filter(i => i.severity === 'info').length }}</span>
          </div>

          <p class="footnote">ตรวจสอบล่าสุด {{ updatedAt }} น.</p>
        </div>

        <div v-if="activeTab === 'report'" class="stack">
          <article class="card note-card">
            <p class="label">E. AI Reporting Layer</p>
            <p class="hint">ระบบคำนวณ KPI และ Alert ก่อน แล้วให้ AI สรุปรายงานเพื่อผู้บริหาร</p>
          </article>

          <article class="card">
            <p class="label">KPI Snapshot</p>
            <div class="chips">
              <span class="chip">AQI {{ aqi ?? '—' }}</span>
              <span class="chip">ติดขัด {{ traffic.jam }} เส้น</span>
              <span class="chip">ไฟ {{ lampsOn }}/{{ lampsTotal }}</span>
              <span class="chip">แหล่งน้ำ {{ waterSources.length }}</span>
              <span class="chip">เหตุการณ์ {{ incidents.length }}</span>
            </div>
          </article>

          <button class="primary-btn" :disabled="reportLoading" @click="generateReport">
            <span v-if="reportLoading">⏳ กำลังสร้างรายงาน AI...</span>
            <span v-else>✨ สร้างรายงาน AI</span>
          </button>

          <article v-if="reportError" class="card error-card">
            <p>⚠️ {{ reportError }}</p>
          </article>

          <article v-if="aiReport" class="card">
            <div class="report-head">
              <strong>📋 รายงาน AI</strong>
              <span>{{ reportGeneratedAt }}</span>
            </div>
            <p class="report-text">{{ aiReport }}</p>
            <button v-if="!reportSaved" class="ghost-btn" :disabled="savingReport" @click="saveReport">
              {{ savingReport ? 'กำลังบันทึก...' : '💾 บันทึกรายงาน' }}
            </button>
            <span v-else class="ok">✓ บันทึกแล้ว</span>
          </article>

          <p v-if="!aiReport && !reportLoading && !reportError" class="footnote">กดปุ่มด้านบนเพื่อให้ AI สร้างรายงาน</p>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
interface WaterSrc {
  id: number
  name: string
  pct?: number
  levelM?: number
  province?: string
}

const props = defineProps<{
  aqi: number | null
  pm25: number | null
  weather: { temp: number | null; wind: number | null; humidity: number | null }
  traffic: { free: number; slow: number; jam: number }
  waterSources: WaterSrc[]
  lampsOn: number
  lampsTotal: number
  cctvCount: number
  modelCount: number
  locationName: string
  pollutants?: { label: string; value: string }[]
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()

const { $supabase } = useNuxtApp() as any
const { user: authUser } = useCustomAuth()

const open = ref(false)
const activeTab = ref<'overview' | 'incidents' | 'report'>('overview')
const updatedAt = ref(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))
const aiReport = ref('')
const reportLoading = ref(false)
const reportError = ref('')
const reportGeneratedAt = ref('')
const reportSaved = ref(false)
const savingReport = ref(false)

const tabs = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'incidents', label: 'เหตุการณ์' },
  { id: 'report', label: 'รายงาน AI' },
] as const

watch(() => props.aqi, () => {
  updatedAt.value = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  reportSaved.value = false
})

const aqiTone = computed(() => {
  const v = props.aqi
  if (v == null) return { cardStyle: 'background:#fff;border:1px solid #eadfce;border-left:4px solid #c8b49f', pillStyle: 'background:#f2ece4;color:#8b6f52' }
  if (v <= 50) return { cardStyle: 'background:#fff;border:1px solid #d9efde;border-left:4px solid #22c55e', pillStyle: 'background:#e9f9ee;color:#166534' }
  if (v <= 100) return { cardStyle: 'background:#fff;border:1px solid #f5e7c8;border-left:4px solid #f59e0b', pillStyle: 'background:#fff7e5;color:#a16207' }
  if (v <= 150) return { cardStyle: 'background:#fff;border:1px solid #f7decf;border-left:4px solid #f97316', pillStyle: 'background:#fff1e8;color:#c2410c' }
  if (v <= 200) return { cardStyle: 'background:#fff;border:1px solid #f5d6d6;border-left:4px solid #ef4444', pillStyle: 'background:#feecec;color:#b91c1c' }
  if (v <= 300) return { cardStyle: 'background:#fff;border:1px solid #eadff1;border-left:4px solid #8b5cf6', pillStyle: 'background:#f3eefe;color:#6d28d9' }
  return { cardStyle: 'background:#fff;border:1px solid #edd7d7;border-left:4px solid #7f1d1d', pillStyle: 'background:#fbeeee;color:#7f1d1d' }
})

const aqiLabel = computed(() => {
  const v = props.aqi
  if (v == null) return 'ไม่มีข้อมูล'
  if (v <= 50) return 'ดีมาก'
  if (v <= 100) return 'ปานกลาง'
  if (v <= 150) return 'ไม่ดีต่อกลุ่มเสี่ยง'
  if (v <= 200) return 'ไม่ดีต่อสุขภาพ'
  if (v <= 300) return 'อันตราย'
  return 'อันตรายมาก'
})

const trafficStatus = computed(() => {
  const { jam, slow } = props.traffic
  if (jam > 5) return 'ติดขัดหนัก'
  if (jam > 0) return 'ติดขัดบางส่วน'
  if (slow > 5) return 'การจราจรช้า'
  return 'ปกติ'
})

const trafficBadgeStyle = computed(() => {
  const { jam, slow } = props.traffic
  if (jam > 5) return 'background:#feecec;color:#dc2626;border:1px solid #fecaca'
  if (jam > 0 || slow > 5) return 'background:#fff7e5;color:#b45309;border:1px solid #fde68a'
  return 'background:#e9f9ee;color:#15803d;border:1px solid #bbf7d0'
})

const lampsPct = computed(() => (props.lampsTotal > 0 ? Math.round((props.lampsOn / props.lampsTotal) * 100) : 0))
const highWaterCount = computed(() => props.waterSources.filter(w => w.pct != null && w.pct > 85).length)
const lowWaterCount = computed(() => props.waterSources.filter(w => w.pct != null && w.pct < 15).length)

interface Incident {
  id: string
  severity: 'critical' | 'warning' | 'info'
  icon: string
  title: string
  detail: string
}

const incidents = computed<Incident[]>(() => {
  const list: Incident[] = []

  if (props.aqi != null) {
    if (props.aqi > 200) {
      list.push({ id: 'air-c', severity: 'critical', icon: '🌫️', title: 'คุณภาพอากาศอันตราย', detail: `AQI ${props.aqi} อยู่ในระดับอันตราย ควรลดกิจกรรมกลางแจ้ง` })
    } else if (props.aqi > 150) {
      list.push({ id: 'air-w', severity: 'warning', icon: '🌫️', title: 'คุณภาพอากาศไม่ดีต่อสุขภาพ', detail: `AQI ${props.aqi} ควรสวมหน้ากากและหลีกเลี่ยงกิจกรรมกลางแจ้ง` })
    } else if (props.aqi > 100) {
      list.push({ id: 'air-i', severity: 'info', icon: '🌫️', title: 'คุณภาพอากาศปานกลาง', detail: `AQI ${props.aqi} กลุ่มเสี่ยงควรเฝ้าระวัง` })
    }
  }

  const { jam, slow } = props.traffic
  if (jam > 5) {
    list.push({ id: 'traf-c', severity: 'critical', icon: '🚦', title: 'จราจรติดขัดหนัก', detail: `พบเส้นทางติดขัด ${jam} เส้น และช้า ${slow} เส้น` })
  } else if (jam > 0 && slow > 3) {
    list.push({ id: 'traf-w', severity: 'warning', icon: '🚦', title: 'จราจรชะลอตัวหลายจุด', detail: `ติดขัด ${jam} เส้น และช้า ${slow} เส้น` })
  } else if (jam > 0) {
    list.push({ id: 'traf-i', severity: 'info', icon: '🚦', title: 'มีจุดติดขัดเล็กน้อย', detail: `ติดขัด ${jam} เส้น` })
  }

  if (props.lampsTotal > 0) {
    const fault = props.lampsTotal - props.lampsOn
    const faultPct = fault / props.lampsTotal
    if (faultPct > 0.5) {
      list.push({ id: 'lamp-c', severity: 'critical', icon: '💡', title: 'ไฟถนนขัดข้องจำนวนมาก', detail: `ดับ ${fault}/${props.lampsTotal} จุด (${Math.round(faultPct * 100)}%)` })
    } else if (faultPct > 0.2) {
      list.push({ id: 'lamp-w', severity: 'warning', icon: '💡', title: 'ไฟถนนขัดข้องหลายจุด', detail: `ดับ ${fault}/${props.lampsTotal} จุด (${Math.round(faultPct * 100)}%)` })
    }
  }

  const hw = props.waterSources.filter(w => w.pct != null && w.pct > 85)
  const lw = props.waterSources.filter(w => w.pct != null && w.pct < 15)
  if (hw.length) {
    list.push({ id: 'water-w', severity: 'warning', icon: '💧', title: `ระดับน้ำสูง ${hw.length} แห่ง`, detail: hw.slice(0, 3).map(w => `${w.name} ${w.pct}%`).join(' · ') })
  }
  if (lw.length) {
    list.push({ id: 'water-i', severity: 'info', icon: '💧', title: `ระดับน้ำต่ำ ${lw.length} แห่ง`, detail: lw.slice(0, 3).map(w => `${w.name} ${w.pct}%`).join(' · ') })
  }

  if (jam > 3 && (props.weather.humidity ?? 0) > 85) {
    list.push({ id: 'corr-w', severity: 'warning', icon: '⛈️', title: 'จราจรติดขัดร่วมกับความชื้นสูง', detail: `พบจราจรติดขัด ${jam} เส้น และความชื้น ${props.weather.humidity}%` })
  }

  return list.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]))
})

const alertCount = computed(() => incidents.value.filter(i => i.severity !== 'info').length)

function severityColor(s: string) {
  return s === 'critical' ? '#ef4444' : s === 'warning' ? '#f59e0b' : '#3b82f6'
}

function severityBadge(s: string) {
  if (s === 'critical') return 'background:#feecec;color:#dc2626;border:1px solid #fecaca'
  if (s === 'warning') return 'background:#fff7e5;color:#b45309;border:1px solid #fde68a'
  return 'background:#eaf2ff;color:#2563eb;border:1px solid #bfdbfe'
}

function severityLabel(s: string) {
  return s === 'critical' ? 'วิกฤต' : s === 'warning' ? 'เฝ้าระวัง' : 'แจ้งเตือน'
}

const kpiSnapshot = computed(() => ({
  location: props.locationName || 'ไม่ระบุ',
  timestamp: new Date().toLocaleString('th-TH'),
  airQuality: {
    aqi: props.aqi,
    level: aqiLabel.value,
    pm25: props.pm25,
    temp: props.weather.temp,
    wind: props.weather.wind,
    humidity: props.weather.humidity,
  },
  traffic: {
    free: props.traffic.free,
    slow: props.traffic.slow,
    jam: props.traffic.jam,
    total: props.traffic.free + props.traffic.slow + props.traffic.jam,
    status: trafficStatus.value,
  },
  lighting: {
    on: props.lampsOn,
    total: props.lampsTotal,
    faultPct: props.lampsTotal > 0 ? Math.round(((props.lampsTotal - props.lampsOn) / props.lampsTotal) * 100) : 0,
  },
  water: {
    monitored: props.waterSources.length,
    highLevelCount: highWaterCount.value,
    lowLevelCount: lowWaterCount.value,
    avgPct: props.waterSources.filter(w => w.pct != null).length > 0
      ? Math.round(props.waterSources.filter(w => w.pct != null).reduce((s, w) => s + (w.pct ?? 0), 0) / props.waterSources.filter(w => w.pct != null).length)
      : null,
  },
  infrastructure: {
    cctvCount: props.cctvCount,
    modelCount: props.modelCount,
  },
  incidents: incidents.value.map(i => `[${i.severity.toUpperCase()}] ${i.title}: ${i.detail}`),
}))

async function generateReport() {
  if (reportLoading.value) return
  reportLoading.value = true
  reportError.value = ''
  reportSaved.value = false
  try {
    const response = await $fetch<{
      report?: string | { content?: string }
    }>('/api/mepbeta/ai-report', {
      method: 'POST',
      body: {
        report_type: 'daily',
        refresh: true,
      },
    })

    const reportText = typeof response?.report === 'string'
      ? response.report
      : response?.report?.content

    if (!reportText) {
      throw new Error('ไม่พบเนื้อหารายงานจากระบบ')
    }

    aiReport.value = reportText
    reportGeneratedAt.value = new Date().toLocaleString('th-TH')
  } catch (err: any) {
    reportError.value = err?.data?.message || err?.message || 'ไม่สามารถสร้างรายงานได้ในขณะนี้'
  } finally {
    reportLoading.value = false
  }
}

async function saveReport() {
  if (!aiReport.value || savingReport.value) return
  savingReport.value = true
  try {
    await $supabase.from('ai_reports').insert({
      report_type: 'daily',
      location: props.locationName || null,
      content: aiReport.value,
      kpi_snapshot: kpiSnapshot.value,
      incidents: incidents.value,
      created_by: authUser.value?.id || null,
    })
    reportSaved.value = true
  } catch {
    // Ignore insert error when table is not present.
  } finally {
    savingReport.value = false
  }
}
</script>

<style scoped>
.ai-panel-enter-active { animation: aiSlideUp .28s cubic-bezier(.22,.61,.36,1); }
.ai-panel-leave-active { animation: aiSlideUp .2s cubic-bezier(.22,.61,.36,1) reverse; }
@keyframes aiSlideUp {
  from { opacity: 0; transform: translateY(-16px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.ai-fab {
  position: fixed;
  right: 10px;
  top: 10px;
  z-index: 200;
  width: 108px;
  height: 54px;
  border-radius: 12px;
  border: 1px solid #e4d3c1;
  background: #fffdf9;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(86, 60, 36, .20);
}

.ai-fab img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.fab-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  padding: 0 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #fff;
  border: 2px solid #fff;
}

.ai-panel-shell {
  position: fixed;
  right: 10px;
  top: 74px;
  z-index: 200;
  width: min(390px, calc(100vw - 18px));
  max-height: min(78vh, 620px);
  border-radius: 18px;
  background: #fffdf9;
  border: 1px solid #e4d3c1;
  box-shadow: 0 20px 60px rgba(86, 60, 36, .25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #3f2c1f;
}

.ai-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #fffaf4, #f7ecdf);
  border-bottom: 1px solid #e7d8c8;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-brand {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.ai-brand img {
  display: block;
  width: min(100%, 190px);
  max-height: 44px;
  object-fit: contain;
}

.ai-actions { display: flex; gap: 6px; }

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 0;
  background: #f6ece1;
  color: #9a7b5c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover {
  background: #ead8c4;
  color: #6c4727;
}

.ai-tabs {
  display: flex;
  border-bottom: 1px solid #e7d8c8;
  background: #fffdf9;
}

.ai-tab {
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: #a18467;
  padding: 10px 4px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.ai-tab.active {
  color: #8b5e34;
  border-bottom-color: #b57a3c;
}

.tab-badge {
  margin-left: 3px;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  font-size: 8px;
  padding: 1px 4px;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 14px;
}

.stack { display: flex; flex-direction: column; gap: 10px; }

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card {
  background: #fff;
  border: 1px solid #f1e5d8;
  border-radius: 12px;
  padding: 12px;
}

.label {
  margin: 0 0 6px;
  font-size: 9px;
  font-weight: 700;
  color: #9a7b5c;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.aqi-value { margin: 0; font-size: 24px; line-height: 1; font-weight: 800; }
.metric { margin: 0; font-size: 22px; line-height: 1.1; }
.metric strong { font-weight: 800; }
.metric span { font-size: 11px; color: #9a7b5c; margin-left: 4px; }

.hint {
  margin: 4px 0 0;
  font-size: 10px;
  color: #9a7b5c;
  line-height: 1.5;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  gap: 6px;
  margin-bottom: 4px;
}

.row strong { font-size: 14px; color: #3f2c1f; }
.muted { flex: 1; color: #a18467; }
.dot { margin-right: 2px; }

.progress {
  height: 4px;
  border-radius: 4px;
  background: #f4e8dd;
  overflow: hidden;
  margin-top: 6px;
}

.progress-fill { height: 100%; border-radius: 4px; }

.pill {
  display: inline-block;
  margin-top: 5px;
  border-radius: 8px;
  padding: 2px 7px;
  font-size: 9px;
  font-weight: 700;
}

.env-card .env-grid {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.env-card .env-grid > div {
  text-align: center;
  min-width: 46px;
}

.env-card span { font-size: 10px; display: block; }
.env-card strong { display: block; margin-top: 2px; font-size: 14px; }
.env-card small { display: block; margin-top: 2px; font-size: 9px; color: #a18467; }

.ok { color: #15803d; font-weight: 600; }
.warn { color: #b45309; font-weight: 600; font-size: 10px; margin: 4px 0 0; }
.info { color: #2563eb; font-weight: 600; font-size: 10px; margin: 4px 0 0; }

.footnote {
  margin: 0;
  font-size: 9px;
  color: #a18467;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 28px 0;
}

.empty-state .emoji {
  margin: 0 0 8px;
  font-size: 28px;
}

.incident-card {
  border-left: 3px solid #f59e0b;
}

.incident-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.incident-head strong { flex: 1; font-size: 11px; }

.summary-strip {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 10px;
  font-weight: 600;
}

.summary-strip .critical { color: #dc2626; }
.summary-strip .warning { color: #b45309; }
.summary-strip .info { color: #2563eb; }

.note-card { background: #fbf3e8; border-color: #ead7bf; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  font-size: 9px;
  background: #f7efe5;
  color: #a18467;
  border-radius: 6px;
  padding: 2px 7px;
}

.primary-btn {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 11px;
  background: linear-gradient(135deg, #b57a3c, #8c5b2e);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.error-card {
  background: #fff0f0;
  border-color: #fecaca;
  color: #dc2626;
}

.report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0e4d6;
  font-size: 10px;
  color: #9a7b5c;
}

.report-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: #3f2c1f;
  white-space: pre-wrap;
}

.ghost-btn {
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid #dcbf9d;
  background: transparent;
  color: #8b5e34;
  font-size: 10px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
}

.ghost-btn:hover { background: #f9efe2; }

@media (max-width: 768px) {
  .ai-fab {
    right: 10px;
    bottom: 66px;
    width: 94px;
    height: 48px;
  }

  .ai-panel-shell {
    width: calc(100vw - 12px);
    right: 6px;
    bottom: 60px;
    max-height: calc(100vh - 88px);
    border-radius: 16px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .env-card .env-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 8px;
  }
}
</style>
