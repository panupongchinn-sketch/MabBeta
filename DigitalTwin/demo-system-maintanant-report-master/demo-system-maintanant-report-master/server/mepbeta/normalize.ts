import { asArray, inferZone, normalizeTimestamp, toNumber } from './geo'
import type { CanonicalRecord, RawSourceEnvelope, Severity } from './types'

function pickArray(payload: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) return asArray(payload)
  if (!payload || typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>
  for (const key of keys) {
    if (key in obj) return asArray(obj[key])
  }
  return []
}

function str(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function severityFromValue(value: number | null, warn: number, critical: number): Severity {
  if (value == null) return 'info'
  if (value >= critical) return 'critical'
  if (value >= warn) return 'warning'
  return 'info'
}

function normalizeTraffic(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['events', 'data', 'items', 'traffic'])
  return rows.map((row, index) => {
    const lat = toNumber(row.lat ?? row.latitude)
    const lng = toNumber(row.lng ?? row.longitude ?? row.lon)
    const speed = toNumber(row.speed ?? row.avg_speed ?? row.velocity)
    const status = str(row.status ?? row.congestion) ?? (speed != null && speed < 15 ? 'jam' : speed != null && speed < 30 ? 'slow' : 'free')
    const severity: Severity =
      status.includes('jam') || status.includes('high') ? 'warning'
      : status.includes('incident') ? 'critical'
      : 'info'

    return {
      source_type: 'traffic',
      asset_id: str(row.asset_id ?? row.id) ?? `traffic-${index + 1}`,
      location_lat: lat,
      location_lng: lng,
      zone: inferZone(lat, lng, row.zone ?? row.district),
      status,
      value: speed,
      unit: speed == null ? null : 'km/h',
      severity,
      timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt),
      metadata: {
        road_name: str(row.road_name ?? row.name),
        incident: Boolean(row.incident),
      },
    }
  })
}

function normalizeLighting(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['assets', 'lights', 'data', 'items'])
  return rows.map((row, index) => {
    const lat = toNumber(row.lat ?? row.latitude)
    const lng = toNumber(row.lng ?? row.longitude ?? row.lon)
    const status = str(row.status) ?? (row.on === false ? 'offline' : 'online')
    const lowered = status.toLowerCase()
    const severity: Severity = lowered.includes('offline') || lowered.includes('fault') ? 'warning' : 'info'
    const brightness = toNumber(row.brightness ?? row.intensity)
    return {
      source_type: 'lighting',
      asset_id: str(row.asset_id ?? row.id) ?? `lighting-${index + 1}`,
      location_lat: lat,
      location_lng: lng,
      zone: inferZone(lat, lng, row.zone ?? row.area),
      status,
      value: brightness,
      unit: brightness == null ? null : 'lux',
      severity,
      timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt),
      metadata: {
        on: row.on ?? !lowered.includes('offline'),
      },
    }
  })
}

function normalizeCctv(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['cameras', 'events', 'data', 'items'])
  return rows.map((row, index) => {
    const lat = toNumber(row.lat ?? row.latitude)
    const lng = toNumber(row.lng ?? row.longitude ?? row.lon)
    const incident = Boolean(row.incident)
    const status = str(row.status) ?? (incident ? 'incident' : 'online')
    const lowered = status.toLowerCase()
    const severity: Severity = incident || lowered.includes('incident') ? 'warning' : lowered.includes('offline') ? 'warning' : 'info'

    return {
      source_type: 'cctv',
      asset_id: str(row.asset_id ?? row.id) ?? `cctv-${index + 1}`,
      location_lat: lat,
      location_lng: lng,
      zone: inferZone(lat, lng, row.zone ?? row.area),
      status,
      value: incident ? 1 : 0,
      unit: 'event',
      severity,
      timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt),
      metadata: {
        incident,
        stream_url: str(row.stream_url ?? row.url),
        snapshot_url: str(row.snapshot_url),
      },
    }
  })
}

function normalizeWater(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['points', 'stations', 'sensors', 'data', 'items'])
  return rows.map((row, index) => {
    const lat = toNumber(row.lat ?? row.latitude)
    const lng = toNumber(row.lng ?? row.longitude ?? row.lon)
    const levelCm = toNumber(row.level_cm ?? row.level ?? row.water_level)
    const riseRate = toNumber(row.rise_cm_per_hr ?? row.rise_rate_cm_hr ?? row.flow_rate)
    const status = str(row.status) ?? (riseRate != null && riseRate > 8 ? 'rising_fast' : 'normal')
    const severity: Severity =
      riseRate != null && riseRate >= 15 ? 'critical'
      : riseRate != null && riseRate >= 8 ? 'warning'
      : levelCm != null && levelCm >= 220 ? 'warning'
      : 'info'

    return {
      source_type: 'water',
      asset_id: str(row.asset_id ?? row.id) ?? `water-${index + 1}`,
      location_lat: lat,
      location_lng: lng,
      zone: inferZone(lat, lng, row.zone ?? row.basin),
      status,
      value: levelCm ?? riseRate,
      unit: levelCm != null ? 'cm' : riseRate != null ? 'cm/h' : null,
      severity,
      timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt),
      metadata: {
        metric: levelCm != null ? 'water_level_cm' : 'rise_cm_per_hr',
        rise_cm_per_hr: riseRate,
      },
    }
  })
}

function normalizeAirQuality(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['stations', 'data', 'items'])
  const records: CanonicalRecord[] = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const lat = toNumber(row.lat ?? row.latitude)
    const lng = toNumber(row.lng ?? row.longitude ?? row.lon ?? row.long)
    const assetId = str(row.asset_id ?? row.id) ?? `air-${index + 1}`
    const zone = inferZone(lat, lng, row.zone ?? row.area)
    const ts = normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt)
    const pm25 = toNumber(row.pm25 ?? row.pm2_5 ?? row.pm2_5_ugm3)
    const aqi = toNumber(row.aqi ?? row.us_aqi)

    if (pm25 != null) {
      records.push({
        source_type: 'air_quality',
        asset_id: assetId,
        location_lat: lat,
        location_lng: lng,
        zone,
        status: pm25 >= 50 ? 'elevated_pm25' : 'normal',
        value: pm25,
        unit: 'ug/m3',
        severity: severityFromValue(pm25, 50, 90),
        timestamp: ts,
        metadata: { metric: 'pm25' },
      })
    }

    if (aqi != null) {
      records.push({
        source_type: 'air_quality',
        asset_id: assetId,
        location_lat: lat,
        location_lng: lng,
        zone,
        status: aqi >= 100 ? 'elevated_aqi' : 'normal',
        value: aqi,
        unit: 'aqi',
        severity: severityFromValue(aqi, 100, 150),
        timestamp: ts,
        metadata: { metric: 'aqi' },
      })
    }
  }

  return records
}

function normalizeWeather(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const source = (envelope.payload && typeof envelope.payload === 'object'
    ? (envelope.payload as Record<string, unknown>)
    : {}) as Record<string, unknown>

  const current = (source.current && typeof source.current === 'object'
    ? source.current
    : source.weather && typeof source.weather === 'object'
      ? source.weather
      : source) as Record<string, unknown>

  const lat = toNumber(current.lat ?? current.latitude)
  const lng = toNumber(current.lng ?? current.longitude ?? current.lon)
  const zone = inferZone(lat, lng, current.zone)
  const ts = normalizeTimestamp(current.timestamp ?? current.updated_at, envelope.fetchedAt)
  const metrics: Array<{ metric: string; value: number | null; unit: string }> = [
    { metric: 'temp_c', value: toNumber(current.temp_c ?? current.temperature_c ?? current.temp), unit: 'C' },
    { metric: 'humidity_pct', value: toNumber(current.humidity_pct ?? current.humidity), unit: '%' },
    { metric: 'wind_kmh', value: toNumber(current.wind_kmh ?? current.wind_speed_kmh ?? current.wind), unit: 'km/h' },
    { metric: 'rain_mm', value: toNumber(current.rain_mm ?? current.precipitation_mm ?? current.rain), unit: 'mm' },
  ]

  return metrics
    .filter((metric) => metric.value != null)
    .map((metric, index) => {
      const severity: Severity = metric.metric === 'rain_mm' && (metric.value ?? 0) >= 20 ? 'warning' : 'info'
      return {
        source_type: 'weather',
        asset_id: `weather-${index + 1}`,
        location_lat: lat,
        location_lng: lng,
        zone,
        status: metric.metric === 'rain_mm' && (metric.value ?? 0) > 0 ? 'rain' : 'normal',
        value: metric.value,
        unit: metric.unit,
        severity,
        timestamp: ts,
        metadata: { metric: metric.metric },
      }
    })
}

function normalizeGis(envelope: RawSourceEnvelope): CanonicalRecord[] {
  const rows = pickArray(envelope.payload, ['zones', 'areas', 'features', 'data', 'items'])
  return rows.map((row, index) => {
    const lat = toNumber(row.centroid_lat ?? row.lat ?? row.latitude)
    const lng = toNumber(row.centroid_lng ?? row.lng ?? row.longitude ?? row.lon)
    return {
      source_type: 'gis',
      asset_id: str(row.asset_id ?? row.id) ?? `gis-${index + 1}`,
      location_lat: lat,
      location_lng: lng,
      zone: inferZone(lat, lng, row.zone ?? row.name),
      status: 'mapped',
      value: null,
      unit: null,
      severity: 'info',
      timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, envelope.fetchedAt),
      metadata: {
        geometry_type: str(row.geometry_type ?? row.type),
      },
    }
  })
}

export function normalizeSourceEnvelope(envelope: RawSourceEnvelope): CanonicalRecord[] {
  switch (envelope.sourceType) {
    case 'traffic':
      return normalizeTraffic(envelope)
    case 'lighting':
      return normalizeLighting(envelope)
    case 'cctv':
      return normalizeCctv(envelope)
    case 'water':
      return normalizeWater(envelope)
    case 'air_quality':
      return normalizeAirQuality(envelope)
    case 'weather':
      return normalizeWeather(envelope)
    case 'gis':
      return normalizeGis(envelope)
    default:
      return []
  }
}

export function deduplicateCanonical(records: CanonicalRecord[]): CanonicalRecord[] {
  const seen = new Set<string>()
  const result: CanonicalRecord[] = []
  for (const record of records) {
    const key = [
      record.source_type,
      record.asset_id ?? '',
      record.status ?? '',
      record.zone ?? '',
      record.timestamp,
      typeof record.value === 'number' ? record.value.toFixed(2) : String(record.value ?? ''),
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(record)
  }
  return result
}
