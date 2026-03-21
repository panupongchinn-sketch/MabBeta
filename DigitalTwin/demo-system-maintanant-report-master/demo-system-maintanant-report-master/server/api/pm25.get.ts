export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = parseFloat(query.lat as string) || 13.7563
  const lng = parseFloat(query.lng as string) || 100.5018

  function haversineDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function parsePm25Sec(aqiLast: any): { value: number; aqi: number } {
    const sec =
      aqiLast?.PM25 ??
      aqiLast?.PM2_5 ??
      aqiLast?.pm25 ??
      aqiLast?.pm2_5 ?? {}
    const value = parseFloat(sec.value ?? '')
    const aqi   = parseFloat(sec.aqi   ?? '')
    return {
      value: isNaN(value) ? 0 : Math.round(value * 10) / 10,
      aqi:   isNaN(aqi)   ? 0 : Math.round(aqi),
    }
  }

  try {
    const res = await fetch('https://air4thai.pcd.go.th/services/getAQI_JSON.php', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`Air4Thai HTTP ${res.status}`)
    const json = await res.json()

    const stations: any[] = json.stations ?? json.data ?? []

    const nearby = stations
      .map((s: any) => {
        const sLat = parseFloat(s.lat)
        const sLng = parseFloat(s.long ?? s.lng ?? s.lon ?? '')
        if (isNaN(sLat) || isNaN(sLng)) return null
        const dist = haversineDist(lat, lng, sLat, sLng)
        const aqiLast = s.AQILast ?? s.aqiLast ?? {}
        const { value, aqi } = parsePm25Sec(aqiLast)
        return {
          name:    s.nameTH ?? s.nameEN ?? 'สถานี',
          value,
          aqi,
          updated: `${aqiLast.date ?? ''} ${aqiLast.time ?? ''}`.trim(),
          dist:    Math.round(dist * 10) / 10,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && (s.value > 0 || s.aqi > 0))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)

    return { ok: true, stations: nearby, source: 'air4thai' }
  } catch (e: any) {
    return { ok: false, stations: [], error: e?.message ?? 'fetch failed' }
  }
})
