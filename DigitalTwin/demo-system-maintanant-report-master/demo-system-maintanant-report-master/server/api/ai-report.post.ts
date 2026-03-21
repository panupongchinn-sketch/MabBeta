// server/api/ai-report.post.ts
// E. AI Reporting Layer — รับ KPI snapshot ที่ Rule Engine คำนวณแล้ว → สร้างรายงานภาษาไทยด้วย Gemini

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.GEMINI_API_KEY as string | undefined

  if (!apiKey || apiKey === 'your-gemini-key-here') {
    throw createError({
      statusCode: 503,
      message: 'ยังไม่ได้ตั้งค่า Gemini API Key — กรุณาเพิ่ม GEMINI_API_KEY ใน .env',
    })
  }

  const body = await readBody(event)
  if (!body?.kpi) throw createError({ statusCode: 400, message: 'กรุณาส่งข้อมูล KPI' })

  const prompt = buildPrompt(body.kpi)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.35 },
      }),
      signal: AbortSignal.timeout(25000),
    }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`)
    throw createError({ statusCode: 502, message: `Gemini API: ${errText}` })
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw createError({ statusCode: 502, message: 'Gemini ไม่ส่งผลลัพธ์กลับมา' })

  return { report: text.trim() }
})

// ─── Prompt Builder ──────────────────────────────────────────────────────────
function buildPrompt(kpi: any): string {
  const loc   = kpi.location   ?? 'ไม่ระบุ'
  const time  = kpi.timestamp  ?? new Date().toLocaleString('th-TH')
  const air   = kpi.airQuality ?? {}
  const traf  = kpi.traffic    ?? {}
  const lamp  = kpi.lighting   ?? {}
  const water = kpi.water      ?? {}
  const infra = kpi.infrastructure ?? {}

  const incLines: string = Array.isArray(kpi.incidents) && kpi.incidents.length
    ? kpi.incidents.map((i: string) => `  • ${i}`).join('\n')
    : '  • ไม่มีเหตุการณ์ผิดปกติ'

  return `คุณคือระบบ AI สรุปรายงานสถานการณ์ Smart City สำหรับผู้บริหาร เขียนเป็นภาษาไทย กระชับ เป็นทางการ

พื้นที่: ${loc}
เวลาสรุป: ${time}

ข้อมูล KPI ที่ Rule Engine คำนวณ:
━━ คุณภาพอากาศ ━━
  AQI: ${air.aqi ?? 'ไม่มีข้อมูล'} (${air.level ?? '-'})
  PM2.5: ${air.pm25 ?? '-'} µg/m³
  อุณหภูมิ: ${air.temp ?? '-'}°C  ลม: ${air.wind ?? '-'} km/h  ความชื้น: ${air.humidity ?? '-'}%

━━ การจราจร ━━
  ปกติ: ${traf.free ?? 0} เส้น  ช้า: ${traf.slow ?? 0} เส้น  ติดขัด: ${traf.jam ?? 0} เส้น  (รวม ${traf.total ?? 0} เส้น)

━━ ไฟส่องสว่าง ━━
  เปิด: ${lamp.on ?? '-'}/${lamp.total ?? '-'} ดวง  ขัดข้อง: ${lamp.faultPct ?? 0}%

━━ แหล่งน้ำ / เขื่อน ━━
  ติดตาม: ${water.monitored ?? 0} แห่ง  ระดับสูง: ${water.highLevelCount ?? 0}  ระดับต่ำ: ${water.lowLevelCount ?? 0}
  เฉลี่ย: ${water.avgPct != null ? water.avgPct + '%' : 'ไม่มีข้อมูล'}

━━ โครงสร้างพื้นฐาน ━━
  CCTV: ${infra.cctvCount ?? 0} กล้อง  โมเดล 3D: ${infra.modelCount ?? 0} รายการ

━━ เหตุการณ์ที่ตรวจพบโดย Rule Engine ━━
${incLines}

กรุณาสรุปรายงานเป็น 3 ส่วน ดังนี้ (ไม่ต้องใช้ Markdown heading ใช้ขึ้นต้นชื่อหัวข้อด้วย "▸ " แทน):

▸ สถานการณ์โดยรวม
[สรุปภาพรวมสถานการณ์วันนี้ 2-3 ประโยค ครอบคลุมทุกระบบ]

▸ จุดที่ต้องเฝ้าระวัง
[รายการจุดสำคัญที่ต้องติดตาม ถ้าไม่มีให้ระบุว่าปกติ]

▸ ข้อเสนอแนะ
[แนวทางปฏิบัติ 2-3 ข้อที่เหมาะกับสถานการณ์]`
}
