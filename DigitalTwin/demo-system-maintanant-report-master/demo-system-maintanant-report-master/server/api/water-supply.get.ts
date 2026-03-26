// server/api/water-supply.get.ts
// ระบบโครงสร้างประปา — แหล่งน้ำดิบ → โรงกรอง → ถังพัก → ท่อจ่าย → ผู้ใช้

export interface WaterNode {
  id: string
  type: 'source' | 'treatment' | 'storage' | 'pump_station' | 'pressure_zone' | 'consumer_zone'
  name: string
  lat: number
  lng: number
  zone: string
  status: 'normal' | 'warning' | 'critical' | 'offline'
  metrics: Record<string, number | string | null>
}

export interface WaterPipe {
  id: string
  from: string        // node id
  to: string          // node id
  diameter_mm: number
  material: 'pvc' | 'ductile_iron' | 'steel' | 'hdpe'
  length_m: number
  flow_m3h: number    // อัตราการไหล ลบ.ม./ชม.
  pressure_bar: number
  status: 'normal' | 'leaking' | 'blocked' | 'maintenance'
  nrw_pct?: number    // Non-Revenue Water %
}

export interface WaterSupplySnapshot {
  generated_at: string
  nodes: WaterNode[]
  pipes: WaterPipe[]
  kpi: {
    total_production_m3d: number       // ปริมาณผลิต ลบ.ม./วัน
    total_distributed_m3d: number      // ปริมาณจ่าย ลบ.ม./วัน
    nrw_pct: number                    // สูญเสียน้ำ %
    avg_pressure_bar: number           // แรงดันเฉลี่ย
    low_pressure_zones: number         // โซนแรงดันต่ำ
    active_leaks: number               // จุดรั่วที่ตรวจพบ
    treatment_efficiency_pct: number   // ประสิทธิภาพโรงกรอง %
    consumer_zones_served: number      // โซนผู้ใช้น้ำที่ให้บริการ
  }
  alerts: {
    id: string
    severity: 'info' | 'warning' | 'critical'
    node_id?: string
    pipe_id?: string
    message: string
    timestamp: string
  }[]
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
// พื้นที่: กรุงเทพมหานคร บริเวณเกาะรัตนโกสินทร์และพื้นที่ใกล้เคียง
// ศูนย์กลางแผนที่: lat 13.7563, lng 100.5018
// โครงสร้าง: แม่น้ำเจ้าพระยา → สูบดิบ → โรงกรอง 2 แห่ง → ถังพัก → หอถัง → ท่อจ่าย → 6 โซน

function now() {
  return new Date().toISOString()
}

function jitter(base: number, range: number) {
  return Math.round((base + (Math.random() - 0.5) * range) * 100) / 100
}

function buildSnapshot(): WaterSupplySnapshot {
  const t = now()

  // ─── Nodes ─────────────────────────────────────────────────────────────────
  const nodes: WaterNode[] = [
    // 1. แหล่งน้ำดิบ — สูบจากแม่น้ำเจ้าพระยา
    {
      id: 'SRC-001',
      type: 'source',
      name: 'สถานีสูบน้ำดิบแม่น้ำเจ้าพระยา',
      lat: 13.754,
      lng: 100.490,
      zone: 'north',
      status: 'normal',
      metrics: {
        raw_flow_m3h: jitter(480, 40),
        turbidity_ntu: jitter(12, 8),
        ph: jitter(7.2, 0.4),
        pump_count: 3,
        pump_active: 2,
      },
    },
    // 2. โรงกรองน้ำ A (หลัก)
    {
      id: 'WTP-001',
      type: 'treatment',
      name: 'โรงกรองน้ำประปาสาขา A',
      lat: 13.758,
      lng: 100.494,
      zone: 'north',
      status: 'normal',
      metrics: {
        capacity_m3d: 20000,
        production_m3d: jitter(17500, 800),
        efficiency_pct: jitter(96, 3),
        turbidity_out_ntu: jitter(0.3, 0.2),
        ph_out: jitter(7.1, 0.2),
        chlorine_mg_l: jitter(0.6, 0.2),
        operating_hrs: 22,
      },
    },
    // 3. โรงกรองน้ำ B (สำรอง/เสริม)
    {
      id: 'WTP-002',
      type: 'treatment',
      name: 'โรงกรองน้ำประปาสาขา B',
      lat: 13.752,
      lng: 100.495,
      zone: 'north',
      status: 'normal',
      metrics: {
        capacity_m3d: 8000,
        production_m3d: jitter(6200, 400),
        efficiency_pct: jitter(94, 4),
        turbidity_out_ntu: jitter(0.4, 0.2),
        ph_out: jitter(7.0, 0.2),
        chlorine_mg_l: jitter(0.55, 0.15),
        operating_hrs: 20,
      },
    },
    // 4. ถังพักน้ำใส (Clear Water Reservoir)
    {
      id: 'STG-001',
      type: 'storage',
      name: 'ถังพักน้ำใสกลาง',
      lat: 13.756,
      lng: 100.500,
      zone: 'central',
      status: 'normal',
      metrics: {
        capacity_m3: 5000,
        level_m3: jitter(3800, 300),
        level_pct: jitter(76, 8),
        min_safe_m3: 1000,
      },
    },
    // 5. หอถังสูงโซนเหนือ
    {
      id: 'STG-002',
      type: 'storage',
      name: 'หอถังสูงโซนเหนือ',
      lat: 13.763,
      lng: 100.505,
      zone: 'north',
      status: 'warning',
      metrics: {
        capacity_m3: 1000,
        level_m3: jitter(280, 80),
        level_pct: jitter(28, 10),   // ต่ำกว่าเกณฑ์
        height_m: 25,
      },
    },
    // 6. สถานีสูบจ่าย (Booster Pump)
    {
      id: 'PMP-001',
      type: 'pump_station',
      name: 'สถานีเพิ่มแรงดันโซนตะวันออก',
      lat: 13.752,
      lng: 100.508,
      zone: 'east',
      status: 'normal',
      metrics: {
        pressure_in_bar: jitter(1.8, 0.2),
        pressure_out_bar: jitter(3.5, 0.3),
        flow_m3h: jitter(120, 15),
        pump_count: 2,
        pump_active: 2,
        power_kw: jitter(45, 5),
      },
    },
    // 7–12. โซนจ่ายน้ำผู้ใช้
    {
      id: 'DZ-001',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — ชุมชนตลาดเก่า',
      lat: 13.759,
      lng: 100.501,
      zone: 'central',
      status: 'normal',
      metrics: {
        households: 1240,
        pressure_bar: jitter(2.8, 0.3),
        flow_m3h: jitter(95, 10),
        nrw_pct: jitter(14, 4),
      },
    },
    {
      id: 'DZ-002',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — นิคมอุตสาหกรรม',
      lat: 13.749,
      lng: 100.512,
      zone: 'east',
      status: 'normal',
      metrics: {
        households: 320,
        pressure_bar: jitter(3.2, 0.3),
        flow_m3h: jitter(180, 20),
        nrw_pct: jitter(8, 3),
      },
    },
    {
      id: 'DZ-003',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — ที่พักอาศัยโซนใต้',
      lat: 13.748,
      lng: 100.499,
      zone: 'south',
      status: 'warning',
      metrics: {
        households: 2100,
        pressure_bar: jitter(1.4, 0.2),  // แรงดันต่ำ
        flow_m3h: jitter(140, 15),
        nrw_pct: jitter(22, 5),           // สูญเสียน้ำสูง
      },
    },
    {
      id: 'DZ-004',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — ตลาดและพาณิชยกรรม',
      lat: 13.762,
      lng: 100.496,
      zone: 'west',
      status: 'normal',
      metrics: {
        households: 890,
        pressure_bar: jitter(2.5, 0.3),
        flow_m3h: jitter(110, 12),
        nrw_pct: jitter(16, 4),
      },
    },
    {
      id: 'DZ-005',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — หมู่บ้านเชิงนิคม',
      lat: 13.756,
      lng: 100.514,
      zone: 'east',
      status: 'normal',
      metrics: {
        households: 680,
        pressure_bar: jitter(3.0, 0.2),
        flow_m3h: jitter(75, 8),
        nrw_pct: jitter(11, 3),
      },
    },
    {
      id: 'DZ-006',
      type: 'consumer_zone',
      name: 'โซนจ่ายน้ำ — ชุมชนเหนือ',
      lat: 13.766,
      lng: 100.508,
      zone: 'north',
      status: 'critical',
      metrics: {
        households: 450,
        pressure_bar: jitter(0.8, 0.2),  // วิกฤต — แรงดันต่ำมาก
        flow_m3h: jitter(30, 10),
        nrw_pct: jitter(32, 6),          // รั่วสูงมาก
      },
    },
  ]

  // ─── Pipes ─────────────────────────────────────────────────────────────────
  const pipes: WaterPipe[] = [
    // ท่อดิบ: แหล่งน้ำ → โรงกรอง A
    {
      id: 'PIPE-R01',
      from: 'SRC-001', to: 'WTP-001',
      diameter_mm: 600, material: 'ductile_iron', length_m: 1800,
      flow_m3h: jitter(350, 30), pressure_bar: jitter(1.5, 0.2),
      status: 'normal',
    },
    // ท่อดิบ: แหล่งน้ำ → โรงกรอง B
    {
      id: 'PIPE-R02',
      from: 'SRC-001', to: 'WTP-002',
      diameter_mm: 400, material: 'ductile_iron', length_m: 2100,
      flow_m3h: jitter(150, 20), pressure_bar: jitter(1.4, 0.2),
      status: 'normal',
    },
    // ท่อน้ำสะอาด: โรงกรอง A → ถังพัก
    {
      id: 'PIPE-C01',
      from: 'WTP-001', to: 'STG-001',
      diameter_mm: 500, material: 'ductile_iron', length_m: 1200,
      flow_m3h: jitter(400, 30), pressure_bar: jitter(2.0, 0.2),
      status: 'normal',
    },
    // ท่อน้ำสะอาด: โรงกรอง B → ถังพัก
    {
      id: 'PIPE-C02',
      from: 'WTP-002', to: 'STG-001',
      diameter_mm: 300, material: 'steel', length_m: 900,
      flow_m3h: jitter(180, 20), pressure_bar: jitter(1.8, 0.2),
      status: 'normal',
    },
    // ท่อประธาน: ถังพัก → หอถังโซนเหนือ
    {
      id: 'PIPE-M01',
      from: 'STG-001', to: 'STG-002',
      diameter_mm: 400, material: 'ductile_iron', length_m: 2400,
      flow_m3h: jitter(90, 15), pressure_bar: jitter(2.2, 0.3),
      status: 'normal',
    },
    // ท่อประธาน: ถังพัก → สถานีสูบ
    {
      id: 'PIPE-M02',
      from: 'STG-001', to: 'PMP-001',
      diameter_mm: 400, material: 'ductile_iron', length_m: 1800,
      flow_m3h: jitter(300, 25), pressure_bar: jitter(2.5, 0.3),
      status: 'normal',
    },
    // ท่อจ่าย: ถังพัก → โซนกลาง
    {
      id: 'PIPE-D01',
      from: 'STG-001', to: 'DZ-001',
      diameter_mm: 250, material: 'pvc', length_m: 1500,
      flow_m3h: jitter(95, 10), pressure_bar: jitter(2.8, 0.3),
      status: 'normal', nrw_pct: 14,
    },
    // ท่อจ่าย: สถานีสูบ → โซนตะวันออก (นิคม)
    {
      id: 'PIPE-D02',
      from: 'PMP-001', to: 'DZ-002',
      diameter_mm: 300, material: 'hdpe', length_m: 1200,
      flow_m3h: jitter(180, 20), pressure_bar: jitter(3.2, 0.3),
      status: 'normal', nrw_pct: 8,
    },
    // ท่อจ่าย: ถังพัก → โซนใต้ (มีปัญหา)
    {
      id: 'PIPE-D03',
      from: 'STG-001', to: 'DZ-003',
      diameter_mm: 200, material: 'pvc', length_m: 2800,
      flow_m3h: jitter(140, 15), pressure_bar: jitter(1.4, 0.2),
      status: 'leaking', nrw_pct: 22,
    },
    // ท่อจ่าย: ถังพัก → โซนตะวันตก
    {
      id: 'PIPE-D04',
      from: 'STG-001', to: 'DZ-004',
      diameter_mm: 200, material: 'pvc', length_m: 1100,
      flow_m3h: jitter(110, 12), pressure_bar: jitter(2.5, 0.3),
      status: 'normal', nrw_pct: 16,
    },
    // ท่อจ่าย: สถานีสูบ → หมู่บ้านเชิงนิคม
    {
      id: 'PIPE-D05',
      from: 'PMP-001', to: 'DZ-005',
      diameter_mm: 150, material: 'hdpe', length_m: 900,
      flow_m3h: jitter(75, 8), pressure_bar: jitter(3.0, 0.2),
      status: 'normal', nrw_pct: 11,
    },
    // ท่อจ่าย: หอถัง → ชุมชนเหนือ (วิกฤต)
    {
      id: 'PIPE-D06',
      from: 'STG-002', to: 'DZ-006',
      diameter_mm: 150, material: 'pvc', length_m: 600,
      flow_m3h: jitter(30, 10), pressure_bar: jitter(0.8, 0.2),
      status: 'blocked', nrw_pct: 32,
    },
  ]

  // ─── KPI ───────────────────────────────────────────────────────────────────
  const wtp1 = nodes.find(n => n.id === 'WTP-001')!.metrics
  const wtp2 = nodes.find(n => n.id === 'WTP-002')!.metrics
  const total_production = (wtp1.production_m3d as number) + (wtp2.production_m3d as number)
  const total_distributed = pipes
    .filter(p => p.id.startsWith('PIPE-D'))
    .reduce((s, p) => s + p.flow_m3h * 20, 0) // ประมาณ 20 ชม./วัน
  const nrw = Math.round(((total_production - total_distributed) / total_production) * 100)
  const pressures = nodes
    .filter(n => n.type === 'consumer_zone')
    .map(n => n.metrics.pressure_bar as number)
  const avg_pressure = Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length * 100) / 100
  const low_pressure_zones = pressures.filter(p => p < 1.5).length
  const active_leaks = pipes.filter(p => p.status === 'leaking' || p.status === 'blocked').length
  const efficiency = Math.round(
    ((wtp1.efficiency_pct as number) * (wtp1.production_m3d as number) +
      (wtp2.efficiency_pct as number) * (wtp2.production_m3d as number)) /
    total_production * 100
  ) / 100

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const alerts: WaterSupplySnapshot['alerts'] = []

  if ((nodes.find(n => n.id === 'STG-002')!.metrics.level_pct as number) < 35) {
    alerts.push({
      id: 'ALT-001', severity: 'warning',
      node_id: 'STG-002',
      message: `หอถังสูงโซนเหนือ: ระดับน้ำต่ำกว่าเกณฑ์ (${nodes.find(n => n.id === 'STG-002')!.metrics.level_pct}%)`,
      timestamp: t,
    })
  }

  alerts.push({
    id: 'ALT-002', severity: 'critical',
    node_id: 'DZ-006', pipe_id: 'PIPE-D06',
    message: 'ชุมชนเหนือ: แรงดันน้ำวิกฤต (< 1.0 bar) — ตรวจสอบท่อ PIPE-D06 ด่วน',
    timestamp: t,
  })

  alerts.push({
    id: 'ALT-003', severity: 'warning',
    node_id: 'DZ-003', pipe_id: 'PIPE-D03',
    message: 'โซนใต้: ตรวจพบรอยรั่วในท่อ PIPE-D03 — NRW สูงผิดปกติ (22%)',
    timestamp: t,
  })

  if (nrw > 20) {
    alerts.push({
      id: 'ALT-004', severity: 'warning',
      message: `ภาพรวม: อัตราการสูญเสียน้ำ (NRW) รวม ${nrw}% สูงกว่าเกณฑ์มาตรฐาน (≤ 20%)`,
      timestamp: t,
    })
  }

  return {
    generated_at: t,
    nodes,
    pipes,
    kpi: {
      total_production_m3d: Math.round(total_production),
      total_distributed_m3d: Math.round(total_distributed),
      nrw_pct: nrw,
      avg_pressure_bar: avg_pressure,
      low_pressure_zones,
      active_leaks,
      treatment_efficiency_pct: efficiency,
      consumer_zones_served: nodes.filter(n => n.type === 'consumer_zone').length,
    },
    alerts,
  }
}

export default defineEventHandler(async () => {
  return buildSnapshot()
})
