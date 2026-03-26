const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

export default defineEventHandler(async (event) => {
  const { query } = await readBody<{ query: string }>(event)
  if (!query) throw createError({ statusCode: 400, message: 'query required' })

  let lastErr = ''
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(65_000),
      })
      if (res.status === 429) { lastErr = '429'; continue }
      if (!res.ok) { lastErr = `${res.status}`; continue }
      return res.json()
    } catch (e: any) {
      lastErr = e?.message || 'fetch failed'
    }
  }
  throw createError({ statusCode: 503, message: `All Overpass endpoints failed: ${lastErr}` })
})
