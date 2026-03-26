<template>
  <div class="water-panel">
    <!-- Header -->
    <div class="panel-header">
      <span class="panel-title">💧 ระบบโครงสร้างประปา</span>
      <button class="refresh-btn" :disabled="loading" @click="load">
        <span :class="{ spinning: loading }">⟳</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">กำลังโหลดข้อมูลระบบประปา...</div>

    <template v-else-if="data">
      <!-- KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">ผลิตน้ำ/วัน</div>
          <div class="kpi-value">{{ data.kpi.total_production_m3d.toLocaleString() }}</div>
          <div class="kpi-unit">ลบ.ม.</div>
        </div>
        <div class="kpi-card" :class="nrwClass">
          <div class="kpi-label">สูญเสียน้ำ (NRW)</div>
          <div class="kpi-value">{{ data.kpi.nrw_pct }}%</div>
          <div class="kpi-unit">เกณฑ์ ≤ 20%</div>
        </div>
        <div class="kpi-card" :class="pressureClass">
          <div class="kpi-label">แรงดันเฉลี่ย</div>
          <div class="kpi-value">{{ data.kpi.avg_pressure_bar }}</div>
          <div class="kpi-unit">bar</div>
        </div>
        <div class="kpi-card" :class="leakClass">
          <div class="kpi-label">จุดรั่ว/อุดตัน</div>
          <div class="kpi-value">{{ data.kpi.active_leaks }}</div>
          <div class="kpi-unit">จุด</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">ประสิทธิภาพโรงกรอง</div>
          <div class="kpi-value">{{ data.kpi.treatment_efficiency_pct }}%</div>
          <div class="kpi-unit"></div>
        </div>
        <div class="kpi-card" :class="data.kpi.low_pressure_zones > 0 ? 'warn' : ''">
          <div class="kpi-label">โซนแรงดันต่ำ</div>
          <div class="kpi-value">{{ data.kpi.low_pressure_zones }}</div>
          <div class="kpi-unit">โซน</div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="data.alerts.length" class="section">
        <div class="section-title">⚠️ การแจ้งเตือน</div>
        <div
          v-for="alert in data.alerts"
          :key="alert.id"
          class="alert-item"
          :class="alert.severity"
        >
          <span class="alert-icon">{{ alert.severity === 'critical' ? '🔴' : '🟡' }}</span>
          <span>{{ alert.message }}</span>
        </div>
      </div>

      <!-- Flow Diagram -->
      <div class="section">
        <div class="section-title">🗺️ โครงสร้างระบบ</div>
        <div class="flow-diagram">
          <div class="flow-step source">
            <div class="flow-icon">🌊</div>
            <div class="flow-name">แหล่งน้ำดิบ</div>
            <div class="flow-detail">แม่น้ำท่าจีน</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step treatment">
            <div class="flow-icon">🏭</div>
            <div class="flow-name">โรงกรองน้ำ</div>
            <div class="flow-detail">2 สาขา</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step storage">
            <div class="flow-icon">🏗️</div>
            <div class="flow-name">ถังพัก / หอถัง</div>
            <div class="flow-detail">2 แห่ง</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step pump">
            <div class="flow-icon">⚙️</div>
            <div class="flow-name">สถานีสูบ</div>
            <div class="flow-detail">เพิ่มแรงดัน</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step consumer">
            <div class="flow-icon">🏘️</div>
            <div class="flow-name">โซนผู้ใช้</div>
            <div class="flow-detail">{{ data.kpi.consumer_zones_served }} โซน</div>
          </div>
        </div>
      </div>

      <!-- Node List -->
      <div class="section">
        <div class="section-title">📍 จุดสำคัญในระบบ</div>
        <div class="node-list">
          <div
            v-for="node in data.nodes"
            :key="node.id"
            class="node-item"
            :class="node.status"
          >
            <div class="node-left">
              <span class="node-icon">{{ nodeIcon(node.type) }}</span>
              <div>
                <div class="node-name">{{ node.name }}</div>
                <div class="node-id">{{ node.id }} — {{ zoneLabel(node.zone) }}</div>
              </div>
            </div>
            <div class="node-status" :class="node.status">
              {{ statusLabel(node.status) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Pipe List -->
      <div class="section">
        <div class="section-title">🔧 สถานะท่อจ่ายน้ำ</div>
        <div class="pipe-list">
          <div
            v-for="pipe in data.pipes"
            :key="pipe.id"
            class="pipe-item"
            :class="pipe.status"
          >
            <div class="pipe-id">{{ pipe.id }}</div>
            <div class="pipe-info">
              ⌀{{ pipe.diameter_mm }}mm · {{ pipe.material.toUpperCase() }} · {{ pipe.length_m }}m
            </div>
            <div class="pipe-metrics">
              {{ pipe.flow_m3h }} ลบ.ม./ชม. · {{ pipe.pressure_bar }} bar
              <span v-if="pipe.nrw_pct !== undefined" :class="pipe.nrw_pct > 20 ? 'warn-text' : ''">
                · NRW {{ pipe.nrw_pct }}%
              </span>
            </div>
            <div class="pipe-status" :class="pipe.status">{{ pipeStatusLabel(pipe.status) }}</div>
          </div>
        </div>
      </div>

      <div class="update-time">อัพเดต: {{ formatTime(data.generated_at) }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { WaterSupplySnapshot, WaterNode, WaterPipe } from '~/server/api/water-supply.get'

const data = ref<WaterSupplySnapshot | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    data.value = await $fetch<WaterSupplySnapshot>('/api/water-supply')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const nrwClass = computed(() => {
  if (!data.value) return ''
  return data.value.kpi.nrw_pct > 25 ? 'critical' : data.value.kpi.nrw_pct > 20 ? 'warn' : 'good'
})
const pressureClass = computed(() => {
  if (!data.value) return ''
  return data.value.kpi.avg_pressure_bar < 1.5 ? 'critical' : data.value.kpi.avg_pressure_bar < 2.0 ? 'warn' : 'good'
})
const leakClass = computed(() => {
  if (!data.value) return ''
  return data.value.kpi.active_leaks > 1 ? 'critical' : data.value.kpi.active_leaks > 0 ? 'warn' : 'good'
})

function nodeIcon(type: WaterNode['type']) {
  const icons: Record<WaterNode['type'], string> = {
    source: '🌊',
    treatment: '🏭',
    storage: '🗄️',
    pump_station: '⚙️',
    pressure_zone: '📊',
    consumer_zone: '🏘️',
  }
  return icons[type]
}

function statusLabel(s: WaterNode['status']) {
  return { normal: 'ปกติ', warning: 'เฝ้าระวัง', critical: 'วิกฤต', offline: 'ออฟไลน์' }[s]
}

function pipeStatusLabel(s: WaterPipe['status']) {
  return { normal: 'ปกติ', leaking: '⚠️ รั่ว', blocked: '🔴 อุดตัน', maintenance: '🔧 ซ่อมบำรุง' }[s]
}

function zoneLabel(z: string) {
  return { north: 'โซนเหนือ', south: 'โซนใต้', east: 'โซนตะวันออก', west: 'โซนตะวันตก', central: 'โซนกลาง' }[z] ?? z
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH')
}
</script>

<style scoped>
.water-panel {
  background: #0d1b2a;
  color: #e0f0ff;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Sarabun', sans-serif;
  font-size: 13px;
  max-height: 90vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #60cfff;
}

.refresh-btn {
  background: none;
  border: 1px solid #2a4a6a;
  color: #60cfff;
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
}

.spinning { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.loading-state { text-align: center; padding: 24px; color: #6a9abf; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.kpi-card {
  background: #112233;
  border: 1px solid #1e3a5a;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}
.kpi-card.good { border-color: #1a6a3a; background: #0a2218; }
.kpi-card.warn { border-color: #8a6010; background: #1e1600; }
.kpi-card.critical { border-color: #8a1a1a; background: #1e0808; }

.kpi-label { font-size: 10px; color: #8aabcf; margin-bottom: 2px; }
.kpi-value { font-size: 18px; font-weight: 700; color: #e0f0ff; }
.kpi-unit { font-size: 10px; color: #6a8aaf; }

/* Alerts */
.section { margin-bottom: 14px; }
.section-title { font-size: 12px; font-weight: 700; color: #60cfff; margin-bottom: 6px; border-bottom: 1px solid #1e3a5a; padding-bottom: 4px; }

.alert-item {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 6px 8px;
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 12px;
}
.alert-item.critical { background: #1e0808; border-left: 3px solid #e05050; }
.alert-item.warning  { background: #1e1600; border-left: 3px solid #e0a030; }
.alert-icon { flex-shrink: 0; }

/* Flow Diagram */
.flow-diagram {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 0;
}
.flow-step {
  text-align: center;
  min-width: 64px;
  padding: 6px;
  border-radius: 8px;
  background: #112233;
  border: 1px solid #1e3a5a;
  flex-shrink: 0;
}
.flow-icon { font-size: 18px; }
.flow-name { font-size: 10px; font-weight: 600; color: #aad0f0; margin-top: 2px; }
.flow-detail { font-size: 10px; color: #6a8aaf; }
.flow-arrow { color: #60cfff; font-size: 16px; flex-shrink: 0; }

/* Nodes */
.node-list { display: flex; flex-direction: column; gap: 4px; }
.node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background: #112233;
  border-left: 3px solid #1e3a5a;
}
.node-item.warning { border-left-color: #e0a030; }
.node-item.critical { border-left-color: #e05050; background: #180a0a; }
.node-left { display: flex; align-items: center; gap: 8px; }
.node-icon { font-size: 16px; }
.node-name { font-size: 12px; font-weight: 600; color: #cce4ff; }
.node-id { font-size: 10px; color: #6a8aaf; }
.node-status { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.node-status.normal   { background: #0a2218; color: #40c070; }
.node-status.warning  { background: #1e1600; color: #e0a030; }
.node-status.critical { background: #1e0808; color: #e05050; }
.node-status.offline  { background: #1a1a1a; color: #888; }

/* Pipes */
.pipe-list { display: flex; flex-direction: column; gap: 4px; }
.pipe-item {
  display: grid;
  grid-template-columns: 80px 1fr 1fr 80px;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  background: #112233;
  font-size: 11px;
}
.pipe-item.leaking  { background: #1e1200; }
.pipe-item.blocked  { background: #180a0a; }
.pipe-id { font-weight: 700; color: #60cfff; }
.pipe-info { color: #7a9abf; }
.pipe-metrics { color: #aac0d8; }
.warn-text { color: #e0a030; }
.pipe-status { text-align: right; }
.pipe-status.normal      { color: #40c070; }
.pipe-status.leaking     { color: #e0a030; }
.pipe-status.blocked     { color: #e05050; }
.pipe-status.maintenance { color: #8080e0; }

.update-time { text-align: right; font-size: 10px; color: #4a6a8a; margin-top: 8px; }
</style>
