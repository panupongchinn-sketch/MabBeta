import type { RawSourceEnvelope, SourceType } from './types'

type RuntimeConfigLike = Record<string, unknown>

interface SourceConfigItem {
  sourceType: SourceType
  url: string | null
  mockFactory: () => unknown
}

function asUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return await response.json()
}

function jitter(n: number, seed: number): number {
  const value = Math.sin(seed * 12.345 + n * 45.67) * 10000
  return value - Math.floor(value)
}

function mockTrafficPayload(): unknown {
  const minute = new Date().getUTCMinutes()
  const jamOffset = minute % 6
  return {
    events: [
      { asset_id: 'TR-001', lat: 13.749, lng: 100.501, speed: 14, status: 'jam', zone: 'east' },
      { asset_id: 'TR-002', lat: 13.762, lng: 100.485, speed: 27 + jamOffset, status: 'slow', zone: 'west' },
      { asset_id: 'TR-003', lat: 13.768, lng: 100.516, speed: 9 + jamOffset, status: jamOffset > 2 ? 'jam' : 'slow', zone: 'east' },
      { asset_id: 'TR-004', lat: 13.771, lng: 100.498, speed: 34, status: 'free', zone: 'north' },
    ],
  }
}

function mockLightingPayload(): unknown {
  const minute = new Date().getUTCMinutes()
  const faultCount = 8 + (minute % 5)
  const assets = []
  for (let i = 0; i < 18; i += 1) {
    assets.push({
      asset_id: `LG-${String(i + 1).padStart(3, '0')}`,
      lat: 13.74 + i * 0.0015,
      lng: 100.50 + i * 0.0008,
      status: i < faultCount ? 'offline' : 'online',
      zone: i < faultCount ? 'east' : 'west',
    })
  }
  return { assets }
}

function mockCctvPayload(): unknown {
  const minute = new Date().getUTCMinutes()
  const hasIncident = minute % 2 === 0
  return {
    cameras: [
      { asset_id: 'CCTV-001', lat: 13.754, lng: 100.506, status: 'online', incident: hasIncident, zone: 'east' },
      { asset_id: 'CCTV-002', lat: 13.759, lng: 100.491, status: 'online', incident: false, zone: 'west' },
      { asset_id: 'CCTV-003', lat: 13.768, lng: 100.512, status: hasIncident ? 'incident' : 'online', incident: hasIncident, zone: 'east' },
    ],
  }
}

function mockWaterPayload(): unknown {
  const now = new Date().getUTCMinutes()
  return {
    points: [
      { asset_id: 'WT-001', lat: 13.72, lng: 100.49, level_cm: 182, rise_cm_per_hr: 3, zone: 'south' },
      { asset_id: 'WT-002', lat: 13.735, lng: 100.518, level_cm: 214, rise_cm_per_hr: 11 + (now % 4), zone: 'east' },
      { asset_id: 'WT-003', lat: 13.71, lng: 100.505, level_cm: 167, rise_cm_per_hr: 2, zone: 'south' },
    ],
  }
}

function mockAirQualityPayload(): unknown {
  const minute = new Date().getUTCMinutes()
  const base = 38 + Math.round(jitter(1, minute) * 18)
  return {
    stations: [
      { asset_id: 'AQ-001', lat: 13.758, lng: 100.503, pm25: base + 8, aqi: base + 36, zone: 'central' },
      { asset_id: 'AQ-002', lat: 13.739, lng: 100.497, pm25: base - 4, aqi: base + 12, zone: 'south' },
      { asset_id: 'AQ-003', lat: 13.772, lng: 100.517, pm25: base + 2, aqi: base + 20, zone: 'east' },
    ],
  }
}

function mockWeatherPayload(): unknown {
  const minute = new Date().getUTCMinutes()
  return {
    current: {
      lat: 13.7563,
      lng: 100.5018,
      temp_c: 31,
      humidity_pct: 79 + (minute % 8),
      wind_kmh: 2 + (minute % 4),
      rain_mm: minute % 3 === 0 ? 8 : 0,
    },
  }
}

function mockGisPayload(): unknown {
  return {
    zones: [
      { asset_id: 'ZONE-EAST', zone: 'east', centroid_lat: 13.758, centroid_lng: 100.515 },
      { asset_id: 'ZONE-WEST', zone: 'west', centroid_lat: 13.758, centroid_lng: 100.488 },
      { asset_id: 'ZONE-SOUTH', zone: 'south', centroid_lat: 13.732, centroid_lng: 100.501 },
    ],
  }
}

function buildConfig(runtimeConfig: RuntimeConfigLike): SourceConfigItem[] {
  return [
    { sourceType: 'traffic', url: asUrl(runtimeConfig.MEPBETA_TRAFFIC_API_URL), mockFactory: mockTrafficPayload },
    { sourceType: 'lighting', url: asUrl(runtimeConfig.MEPBETA_LIGHTING_API_URL), mockFactory: mockLightingPayload },
    { sourceType: 'cctv', url: asUrl(runtimeConfig.MEPBETA_CCTV_API_URL), mockFactory: mockCctvPayload },
    { sourceType: 'water', url: asUrl(runtimeConfig.MEPBETA_WATER_API_URL), mockFactory: mockWaterPayload },
    { sourceType: 'air_quality', url: asUrl(runtimeConfig.MEPBETA_AIR_QUALITY_API_URL), mockFactory: mockAirQualityPayload },
    { sourceType: 'weather', url: asUrl(runtimeConfig.MEPBETA_WEATHER_API_URL), mockFactory: mockWeatherPayload },
    { sourceType: 'gis', url: asUrl(runtimeConfig.MEPBETA_GIS_API_URL), mockFactory: mockGisPayload },
  ]
}

async function pullSingleSource(item: SourceConfigItem): Promise<RawSourceEnvelope> {
  const fetchedAt = new Date().toISOString()
  if (!item.url) {
    return {
      sourceType: item.sourceType,
      fetchedAt,
      receivedVia: 'poll',
      ok: true,
      note: 'mock_source_used',
      payload: item.mockFactory(),
    }
  }

  try {
    const payload = await fetchJson(item.url)
    return {
      sourceType: item.sourceType,
      fetchedAt,
      receivedVia: 'poll',
      ok: true,
      payload,
    }
  } catch (error: any) {
    return {
      sourceType: item.sourceType,
      fetchedAt,
      receivedVia: 'poll',
      ok: false,
      note: error?.message ?? 'fetch_failed',
      payload: item.mockFactory(),
    }
  }
}

export async function pullAllSources(runtimeConfig: RuntimeConfigLike): Promise<RawSourceEnvelope[]> {
  const config = buildConfig(runtimeConfig)
  return await Promise.all(config.map((item) => pullSingleSource(item)))
}
