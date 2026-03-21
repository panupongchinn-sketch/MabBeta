import { toNumber } from './geo'
import type { CanonicalRecord, Incident, KpiSnapshot, RuleEvaluation, Severity } from './types'

const AIR_PM25_THRESHOLD = 50
const AIR_WIND_LOW_THRESHOLD = 6
const WATER_RISE_WARNING_CM_PER_HR = 8
const WATER_RISE_CRITICAL_CM_PER_HR = 15
const LIGHTING_FEEDER_FAULT_THRESHOLD = 10
const TRAFFIC_JAM_MIN_POINTS = 3

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function average(values: number[]): number | null {
  if (!values.length) return null
  return round(values.reduce((sum, current) => sum + current, 0) / values.length)
}

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter((value): value is string => !!value)).size
}

function severityRank(severity: Severity): number {
  if (severity === 'critical') return 3
  if (severity === 'warning') return 2
  return 1
}

function buildIncident(
  id: string,
  severity: Severity,
  source_type: Incident['source_type'],
  title: string,
  detail: string,
  zone: string | null,
  timestamp: string,
): Incident {
  return { id, severity, source_type, title, detail, zone, timestamp }
}

export function evaluateRulesAndKpis(records: CanonicalRecord[]): RuleEvaluation {
  const nowIso = new Date().toISOString()

  const pm25Records = records.filter((record) => record.source_type === 'air_quality' && record.metadata.metric === 'pm25')
  const windRecords = records.filter((record) => record.source_type === 'weather' && record.metadata.metric === 'wind_kmh')
  const rainRecords = records.filter((record) => record.source_type === 'weather' && record.metadata.metric === 'rain_mm')
  const waterRecords = records.filter((record) => record.source_type === 'water')
  const lightingRecords = records.filter((record) => record.source_type === 'lighting')
  const trafficJamRecords = records.filter((record) => record.source_type === 'traffic' && (record.status ?? '').toLowerCase().includes('jam'))
  const cctvIncidentRecords = records.filter(
    (record) => record.source_type === 'cctv' && (record.metadata.incident === true || (record.status ?? '').toLowerCase().includes('incident')),
  )

  const pm25Values = pm25Records.map((record) => toNumber(record.value)).filter((value): value is number => value != null)
  const windValues = windRecords.map((record) => toNumber(record.value)).filter((value): value is number => value != null)
  const avgPm25 = average(pm25Values)
  const avgWind = average(windValues)

  const incidents: Incident[] = []

  if (avgPm25 != null && avgPm25 > AIR_PM25_THRESHOLD && avgWind != null && avgWind < AIR_WIND_LOW_THRESHOLD) {
    incidents.push(
      buildIncident(
        'rule-air-001',
        'warning',
        'air_quality',
        'Air quality risk from PM2.5 and low wind',
        `Average PM2.5 ${avgPm25} ug/m3 with low wind ${avgWind} km/h`,
        null,
        nowIso,
      ),
    )
  }

  const waterRiskByZone = new Map<string, number>()
  for (const record of waterRecords) {
    const rise = toNumber(record.metadata.rise_cm_per_hr)
    if (rise == null || !record.zone) continue
    if (rise >= WATER_RISE_WARNING_CM_PER_HR) {
      waterRiskByZone.set(record.zone, Math.max(waterRiskByZone.get(record.zone) ?? 0, rise))
    }
  }
  for (const [zone, rise] of waterRiskByZone.entries()) {
    const severity: Severity = rise >= WATER_RISE_CRITICAL_CM_PER_HR ? 'critical' : 'warning'
    incidents.push(
      buildIncident(
        `rule-water-${zone}`,
        severity,
        'water',
        'Rapid water rise detected',
        `Water rise rate reached ${round(rise)} cm/h in zone ${zone}`,
        zone,
        nowIso,
      ),
    )
  }

  const offlineByZone = new Map<string, number>()
  for (const record of lightingRecords) {
    const status = (record.status ?? '').toLowerCase()
    if (!record.zone) continue
    if (status.includes('offline') || status.includes('fault')) {
      offlineByZone.set(record.zone, (offlineByZone.get(record.zone) ?? 0) + 1)
    }
  }
  for (const [zone, count] of offlineByZone.entries()) {
    if (count >= LIGHTING_FEEDER_FAULT_THRESHOLD) {
      incidents.push(
        buildIncident(
          `rule-lighting-${zone}`,
          'warning',
          'lighting',
          'Potential feeder fault in street lighting network',
          `${count} lamps are offline in the same zone`,
          zone,
          nowIso,
        ),
      )
    }
  }

  const rainDetected = rainRecords.some((record) => (toNumber(record.value) ?? 0) > 0)
  if (trafficJamRecords.length >= TRAFFIC_JAM_MIN_POINTS && rainDetected && cctvIncidentRecords.length > 0) {
    incidents.push(
      buildIncident(
        'rule-correlation-001',
        'critical',
        'correlation',
        'Major event from traffic, weather, and CCTV correlation',
        `${trafficJamRecords.length} jam segments + rain + ${cctvIncidentRecords.length} CCTV incidents`,
        trafficJamRecords[0]?.zone ?? null,
        nowIso,
      ),
    )
  }

  incidents.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))

  const lightingFaultPoints = lightingRecords.filter((record) => {
    const status = (record.status ?? '').toLowerCase()
    return status.includes('offline') || status.includes('fault')
  }).length

  const waterRiskAreas = uniqueCount(
    waterRecords
      .filter((record) => (toNumber(record.metadata.rise_cm_per_hr) ?? 0) >= WATER_RISE_WARNING_CM_PER_HR)
      .map((record) => record.zone),
  )

  let highestPm25Zone: string | null = null
  let highestPm25Value = -Infinity
  for (const record of pm25Records) {
    const value = toNumber(record.value)
    if (value == null) continue
    if (value > highestPm25Value) {
      highestPm25Value = value
      highestPm25Zone = record.zone
    }
  }

  const kpi: KpiSnapshot = {
    traffic_congestion_zones: uniqueCount(trafficJamRecords.map((record) => record.zone)),
    lighting_fault_points: lightingFaultPoints,
    water_risk_areas: waterRiskAreas,
    avg_pm25: avgPm25,
    highest_pm25_zone: highestPm25Zone,
    top_incidents: incidents.slice(0, 5).map((incident) => ({
      title: incident.title,
      severity: incident.severity,
      summary: incident.detail,
    })),
  }

  return {
    generatedAt: nowIso,
    kpi,
    incidents,
  }
}
