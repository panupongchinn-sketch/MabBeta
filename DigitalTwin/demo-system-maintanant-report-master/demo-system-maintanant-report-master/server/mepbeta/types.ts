export const SOURCE_TYPES = [
  'traffic',
  'lighting',
  'cctv',
  'water',
  'air_quality',
  'weather',
  'gis',
] as const

export type SourceType = typeof SOURCE_TYPES[number]
export type Severity = 'info' | 'warning' | 'critical'
export type IngestMode = 'poll' | 'webhook'

export interface RawSourceEnvelope {
  sourceType: SourceType
  fetchedAt: string
  receivedVia: IngestMode
  ok: boolean
  note?: string
  payload: unknown
}

export interface CanonicalRecord {
  source_type: SourceType
  asset_id: string | null
  location_lat: number | null
  location_lng: number | null
  zone: string | null
  status: string | null
  value: number | string | null
  unit: string | null
  severity: Severity
  timestamp: string
  metadata: Record<string, unknown>
}

export interface Incident {
  id: string
  source_type: SourceType | 'correlation'
  severity: Severity
  title: string
  detail: string
  zone: string | null
  timestamp: string
}

export interface TopIncident {
  title: string
  severity: Severity
  summary: string
}

export interface KpiSnapshot {
  traffic_congestion_zones: number
  lighting_fault_points: number
  water_risk_areas: number
  avg_pm25: number | null
  highest_pm25_zone: string | null
  top_incidents: TopIncident[]
}

export interface RuleEvaluation {
  generatedAt: string
  kpi: KpiSnapshot
  incidents: Incident[]
}

export interface SourceHealth {
  source_type: SourceType
  mode: IngestMode
  ok: boolean
  fetched_at: string
  record_count: number
  note: string | null
}

export interface PipelineSnapshot {
  generated_at: string
  records_ingested: number
  recent_window_minutes: number
  source_health: SourceHealth[]
  kpi: KpiSnapshot
  incidents: Incident[]
}

export interface AiReportRecord {
  id: string
  created_at: string
  report_type: 'daily' | 'incident' | 'weekly'
  content: string
  kpi_snapshot: KpiSnapshot
  incidents: Incident[]
}
