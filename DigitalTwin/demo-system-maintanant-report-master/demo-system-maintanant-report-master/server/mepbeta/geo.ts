const CITY_CENTER = { lat: 13.7563, lng: 100.5018 }

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeTimestamp(value: unknown, fallbackIso = new Date().toISOString()): string {
  if (typeof value === 'string' && value.trim()) {
    const iso = new Date(value).toISOString()
    if (iso !== 'Invalid Date') return iso
  }
  return fallbackIso
}

export function inferZone(lat: number | null, lng: number | null, hint?: unknown): string {
  if (typeof hint === 'string' && hint.trim()) return hint.trim().toLowerCase()
  if (lat == null || lng == null) return 'unknown'
  const ns = lat >= CITY_CENTER.lat ? 'north' : 'south'
  const ew = lng >= CITY_CENTER.lng ? 'east' : 'west'
  return `${ns}_${ew}`
}

export function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
  }
  return []
}
