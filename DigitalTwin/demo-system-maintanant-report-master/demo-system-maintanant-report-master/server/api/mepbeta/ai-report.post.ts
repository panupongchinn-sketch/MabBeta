import { appendAiReport, getLatestSnapshot, getLatestReports } from '../../mepbeta/platform-store'
import { runMepBetaPipeline } from '../../mepbeta/pipeline'
import { generateAiReport } from '../../mepbeta/reporting'
import type { AiReportRecord } from '../../mepbeta/types'

function createReportId(): string {
  return `mepbeta_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event) as unknown as Record<string, unknown>
  const body = (await readBody(event).catch(() => ({}))) as Record<string, unknown>
  const forceRefresh = body.refresh === true

  const snapshot = forceRefresh || !getLatestSnapshot()
    ? await runMepBetaPipeline(runtimeConfig)
    : getLatestSnapshot()

  if (!snapshot) {
    throw createError({ statusCode: 500, message: 'Failed to produce MepBeta snapshot' })
  }

  const content = await generateAiReport({
    apiKey: (runtimeConfig.GEMINI_API_KEY as string | undefined) ?? undefined,
    kpi: snapshot.kpi,
    incidents: snapshot.incidents,
    reportType: (body.report_type as 'daily' | 'incident' | 'weekly') ?? 'daily',
  })

  const report: AiReportRecord = {
    id: createReportId(),
    created_at: new Date().toISOString(),
    report_type: (body.report_type as AiReportRecord['report_type']) ?? 'daily',
    content,
    kpi_snapshot: snapshot.kpi,
    incidents: snapshot.incidents,
  }

  appendAiReport(report)

  return {
    ok: true,
    report,
    latest_reports: getLatestReports(5),
  }
})
