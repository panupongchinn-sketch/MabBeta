/**
 * Microsoft Global ML Building Footprints proxy
 * Source: https://github.com/microsoft/GlobalMLBuildingFootprints
 * Covers rural Thailand where OSM / buildings_ml have no data.
 */
import { createGunzip } from 'node:zlib'

const DATASET_LINKS_URL =
  'https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv'

type LinkEntry  = { qk: string; url: string }
type BuildingRow = { lat: number; lng: number; geometry: string; area_m2: number }

// ── simple in-process caches (survive across requests in the same process) ──
const linksCache: { data: LinkEntry[] | null; expires: number } = { data: null, expires: 0 }
const fileCache  = new Map<string, { rows: BuildingRow[]; expires: number }>()

// ── quadkey helpers ──
function lonToTileX(lng: number, z: number) { return Math.floor((lng + 180) / 360 * (1 << z)) }
function latToTileY(lat: number, z: number) {
  const s = Math.sin(lat * Math.PI / 180)
  return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * (1 << z))
}
function toQuadKey(tx: number, ty: number, z: number) {
  let qk = ''
  for (let i = z; i > 0; i--) {
    let d = 0
    const mask = 1 << (i - 1)
    if (tx & mask) d++
    if (ty & mask) d += 2
    qk += d
  }
  return qk
}

// ── fetch & parse the dataset-links.csv index ──
async function fetchLinks(): Promise<LinkEntry[]> {
  if (linksCache.data && Date.now() < linksCache.expires) return linksCache.data
  try {
    const r = await fetch(DATASET_LINKS_URL, { signal: AbortSignal.timeout(12_000) })
    if (!r.ok) return []
    const txt = await r.text()
    const result: LinkEntry[] = []
    for (const line of txt.split('\n').slice(1)) {
      const cols = line.split(',')
      if (cols.length >= 3) result.push({ qk: cols[1].trim(), url: cols[2].trim() })
    }
    linksCache.data   = result
    linksCache.expires = Date.now() + 86_400_000   // 24 h
    return result
  } catch {
    return []
  }
}

// ── decompress gzip buffer → string ──
function gunzipBuffer(buf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const gz     = createGunzip()
    const chunks: Buffer[] = []
    gz.on('data', (c: Buffer) => chunks.push(c))
    gz.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')))
    gz.on('error', reject)
    gz.end(buf)
  })
}

// ── download one tile file and parse buildings ──
async function fetchBuildingsForUrl(url: string): Promise<BuildingRow[]> {
  const cached = fileCache.get(url)
  if (cached && Date.now() < cached.expires) return cached.rows

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(40_000) })
    if (!r.ok) return []

    const buf  = Buffer.from(await r.arrayBuffer())
    const isGz = url.toLowerCase().endsWith('.gz') ||
                 (r.headers.get('content-type') || '').includes('gzip')
    const text = isGz ? await gunzipBuffer(buf) : buf.toString('utf8')

    const rows: BuildingRow[] = []

    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      try {
        if (line.startsWith('{')) {
          // ── GeoJSONL format ──
          const feat = JSON.parse(line)
          const geom = feat.geometry
          if (!geom) continue
          const ring: number[][] =
            geom.type === 'Polygon'      ? geom.coordinates[0] :
            geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : null
          if (!ring?.length) continue

          let cx = 0, cy = 0
          for (const [x, y] of ring) { cx += x; cy += y }
          cx /= ring.length; cy /= ring.length

          // Shoelace area (rough m²)
          let area = 0
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
          }
          area = Math.abs(area / 2) * 111_320 * 111_320 * Math.cos(cy * Math.PI / 180)

          rows.push({ lat: cy, lng: cx, geometry: JSON.stringify(geom), area_m2: area })
        } else {
          // ── CSV format: latitude,longitude,area_in_meters,confidence,geometry,… ──
          const cols = line.split(',')
          if (cols.length < 5) continue
          const lat  = parseFloat(cols[0])
          const lng  = parseFloat(cols[1])
          const area = parseFloat(cols[2])
          // geometry is WKT (may span many columns if it contains commas inside quotes)
          const geomRaw = cols.slice(4).join(',').replace(/^"|"$/g, '')
          if (!isFinite(lat) || !isFinite(lng)) continue
          rows.push({ lat, lng, geometry: geomRaw, area_m2: area })
        }
      } catch { /* skip bad line */ }
    }

    // Keep at most 20 files in cache to bound memory usage
    if (fileCache.size >= 20) fileCache.delete(fileCache.keys().next().value!)
    fileCache.set(url, { rows, expires: Date.now() + 3_600_000 })   // 1 h
    return rows
  } catch {
    return []
  }
}

export default defineEventHandler(async (event) => {
  const q     = getQuery(event)
  const south = parseFloat(q.south as string)
  const west  = parseFloat(q.west  as string)
  const north = parseFloat(q.north as string)
  const east  = parseFloat(q.east  as string)
  if ([south, west, north, east].some(isNaN)) {
    throw createError({ statusCode: 400, message: 'south,west,north,east required' })
  }

  // Compute zoom-9 quadkeys that cover the requested bbox
  const ZOOM  = 9
  const txMin = lonToTileX(west,  ZOOM)
  const txMax = lonToTileX(east,  ZOOM)
  const tyMin = latToTileY(north, ZOOM)  // north → smaller Y in tile coords
  const tyMax = latToTileY(south, ZOOM)

  const neededQks = new Set<string>()
  for (let tx = txMin; tx <= txMax; tx++)
    for (let ty = tyMin; ty <= tyMax; ty++)
      neededQks.add(toQuadKey(tx, ty, ZOOM))

  // Match against the index (prefix match in either direction)
  const links      = await fetchLinks()
  const matchedUrls = new Set<string>()
  for (const { qk, url } of links)
    for (const nqk of neededQks)
      if (qk.startsWith(nqk) || nqk.startsWith(qk)) { matchedUrls.add(url); break }

  if (!matchedUrls.size) return []

  // Download in parallel (capped at 4 simultaneous)
  const urls   = [...matchedUrls].slice(0, 4)
  const results = await Promise.allSettled(urls.map(fetchBuildingsForUrl))

  const all: BuildingRow[] = []
  for (const r of results)
    if (r.status === 'fulfilled') all.push(...r.value)

  // Filter to bbox & deduplicate by centroid
  const seen    = new Set<string>()
  const filtered = all.filter(b => {
    if (b.lat < south || b.lat > north || b.lng < west || b.lng > east) return false
    const k = `${b.lat.toFixed(5)},${b.lng.toFixed(5)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return filtered.slice(0, 5000)
})
