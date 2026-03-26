import type { Incident, KpiSnapshot } from './types'

interface GenerateReportInput {
  apiKey?: string
  kpi: KpiSnapshot
  incidents: Incident[]
  reportType?: 'daily' | 'incident' | 'weekly'
}

function buildPrompt(kpi: KpiSnapshot, incidents: Incident[]): string {
  const incidentLines = incidents.length
    ? incidents.map((incident) => `- [${incident.severity}] ${incident.title}: ${incident.detail}`).join('\n')
    : '- No significant incidents'

  return `
You are an AI reporting assistant for an urban digital twin platform.
Write in Thai language in a concise executive style.

KPI:
- traffic_congestion_zones: ${kpi.traffic_congestion_zones}
- lighting_fault_points: ${kpi.lighting_fault_points}
- water_risk_areas: ${kpi.water_risk_areas}
- avg_pm25: ${kpi.avg_pm25 ?? 'N/A'}
- highest_pm25_zone: ${kpi.highest_pm25_zone ?? 'N/A'}

Incidents:
${incidentLines}

Please output exactly 4 sections:
1) Executive summary
2) High-priority watch areas
3) Suggested immediate actions
4) Suggested follow-up checks for next 24 hours
`.trim()
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(25000),
    },
  )

  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`)
    throw new Error(`Gemini API error: ${message}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned empty content')
  }
  return text.trim()
}

function buildFallbackReport(kpi: KpiSnapshot, incidents: Incident[]): string {
  const risks: string[] = []
  if (kpi.traffic_congestion_zones > 0) risks.push(`การจราจรติดขัด ${kpi.traffic_congestion_zones} โซน`)
  if (kpi.lighting_fault_points > 0) risks.push(`ไฟส่องสว่างขัดข้อง ${kpi.lighting_fault_points} จุด`)
  if (kpi.water_risk_areas > 0) risks.push(`ความเสี่ยงน้ำท่วม ${kpi.water_risk_areas} พื้นที่`)
  if ((kpi.avg_pm25 ?? 0) > 50) risks.push(`PM2.5 สูงกว่าเกณฑ์ (เฉลี่ย ${kpi.avg_pm25})`)

  const summary = risks.length
    ? `วันนี้พบประเด็นที่ต้องเฝ้าระวัง ได้แก่ ${risks.join(', ')}`
    : 'ภาพรวมระบบทั้งหมดอยู่ในเกณฑ์ปกติ ไม่พบความเสี่ยงสำคัญในขณะนี้'

  const topLines = incidents.length
    ? incidents.slice(0, 3).map((incident, index) => `${index + 1}. ${incident.title} (${incident.severity})`).join('\n')
    : '1. ไม่พบเหตุการณ์ที่ต้องเฝ้าระวังเร่งด่วน'

  return [
    '▸ สถานการณ์โดยรวม',
    summary,
    '',
    '▸ จุดที่ต้องเฝ้าระวัง',
    topLines,
    '',
    '▸ ข้อเสนอแนะเร่งด่วน',
    '1. ตรวจสอบคุณภาพเซ็นเซอร์ในพื้นที่ที่มีการแจ้งเตือนซ้ำ',
    '2. ส่งทีมภาคสนามดูแลจุดวิกฤตก่อน',
    '3. รายงานสถานการณ์ต่อศูนย์ปฏิบัติการทุก 60 นาที',
    '',
    '▸ แผนติดตามผลใน 24 ชั่วโมงข้างหน้า',
    '1. ติดตาม PM2.5 ระดับน้ำ และแนวโน้มการจราจรอย่างต่อเนื่อง',
    '2. ยืนยันสถานะการแก้ไขระบบไฟส่องสว่างและกล้อง CCTV',
  ].join('\n')
}

export async function generateAiReport(input: GenerateReportInput): Promise<string> {
  const { apiKey, kpi, incidents } = input
  const prompt = buildPrompt(kpi, incidents)

  if (apiKey && apiKey.trim() && apiKey !== 'your-gemini-key-here') {
    try {
      return await generateWithGemini(apiKey.trim(), prompt)
    } catch {
      return buildFallbackReport(kpi, incidents)
    }
  }

  return buildFallbackReport(kpi, incidents)
}
