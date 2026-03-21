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
  if (kpi.traffic_congestion_zones > 0) risks.push(`traffic congestion in ${kpi.traffic_congestion_zones} zones`)
  if (kpi.lighting_fault_points > 0) risks.push(`street-light faults ${kpi.lighting_fault_points} points`)
  if (kpi.water_risk_areas > 0) risks.push(`water risk in ${kpi.water_risk_areas} areas`)
  if ((kpi.avg_pm25 ?? 0) > 50) risks.push(`elevated PM2.5 (avg ${kpi.avg_pm25})`)

  const summary = risks.length
    ? `Today we identified key watch areas: ${risks.join(', ')}.`
    : 'Today all monitored systems are in normal range with no major risks detected.'

  const topLines = incidents.length
    ? incidents.slice(0, 3).map((incident, index) => `${index + 1}. ${incident.title} (${incident.severity})`).join('\n')
    : '1. No high-priority incidents'

  return [
    'Executive summary:',
    summary,
    '',
    'High-priority watch areas:',
    topLines,
    '',
    'Suggested immediate actions:',
    '1. Validate sensor quality for zones with repeated alerts.',
    '2. Dispatch field teams to critical incidents first.',
    '3. Keep operations center informed every 60 minutes.',
    '',
    'Suggested follow-up checks for next 24 hours:',
    '1. Recheck PM2.5, water rise, and traffic correlation trends.',
    '2. Confirm recovery status on lighting and CCTV assets.',
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
