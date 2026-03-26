/**
 * Waze Live Map traffic proxy — ฟรี ไม่ต้อง API key
 * ครอบคลุมเมืองใหญ่ทั่วไทย (กรุงเทพ เชียงใหม่ ภูเก็ต ขอนแก่น ฯลฯ)
 * อัปเดตทุก 2-5 นาทีจาก crowdsourced GPS ของผู้ใช้ Waze
 */
const ENDPOINTS = [
  'https://www.waze.com/live-map/api/georss',
  'https://www.waze.com/row-rtserver/web/TGeoRSS',
]

export default defineEventHandler(async (event) => {
  const q     = getQuery(event)
  const north = parseFloat(q.north as string)
  const south = parseFloat(q.south as string)
  const east  = parseFloat(q.east  as string)
  const west  = parseFloat(q.west  as string)
  if ([north, south, east, west].some(isNaN))
    throw createError({ statusCode: 400, message: 'north,south,east,west required' })

  for (const base of ENDPOINTS) {
    try {
      const url = `${base}?top=${north}&bottom=${south}&left=${west}&right=${east}&env=row&types=traffic`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Referer':    'https://www.waze.com/live-map',
          'Accept':     'application/json',
        },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue
      const data = await res.json()

      // Normalise Waze jams → { points, jamFactor } (same schema as HERE)
      // Waze level 0-5 → jamFactor 0-10
      const segments = (data.jams ?? [])
        .filter((j: any) => Array.isArray(j.line) && j.line.length >= 2)
        .map((j: any) => ({
          points:      (j.line as { x: number; y: number }[]).map(p => ({ lat: p.y, lng: p.x })),
          jamFactor:   Math.min(10, (j.level ?? 2) * 2),
          speedKMH:    j.speedKMH   ?? -1,
          freeFlowKMH: j.freeFlow   ?? -1,
          name:        j.street     ?? '',
        }))

      return { source: 'waze', segments }
    } catch { /* try next endpoint */ }
  }

  // Both endpoints failed — return empty, client will show OSM roads as green
  return { source: 'none', segments: [] }
})
