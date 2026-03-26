/**
 * One-time script: Download Google Open Buildings for Thailand → Supabase
 * Run: node scripts/load-buildings.mjs
 *
 * Covers tokens:  30d (N.Thailand), 30f (C.Thailand-W), 311 (C.Thailand-E), 313 (NE.Thailand)
 *                 305 (S.Thailand),  307 (Myanmar/Andaman)
 *
 * Requires the SQL table to exist first — run this in Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS buildings_ml (
 *     id BIGSERIAL PRIMARY KEY,
 *     lat FLOAT8 NOT NULL,
 *     lng FLOAT8 NOT NULL,
 *     geometry TEXT NOT NULL,
 *     area_m2 FLOAT4,
 *     confidence FLOAT4
 *   );
 *   CREATE INDEX ON buildings_ml USING brin(lat, lng);
 */

import https from 'https'
import zlib from 'zlib'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
const envPath = resolve(process.cwd(), '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY in .env')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Thailand bbox filter
const BBOX = { south: 5.5, north: 20.5, west: 97.5, east: 105.7 }

// S2 level-4 tokens ที่ครอบคลุมทั้งประเทศไทย
// (script จะ skip token ที่ไม่มีข้อมูลโดยอัตโนมัติ)
const TOKENS = [
  // ภาคใต้ & คาบสมุทรมลายู
  '303', '305', '307',
  // ภาคตะวันตก & ภาคกลางฝั่งตะวันตก
  '309', '30b', '30d',
  // ภาคกลาง & กรุงเทพฯ
  '30e', '30f', '311',
  // ภาคเหนือ
  '30c',
  // ภาคตะวันออกเฉียงเหนือ (อีสาน)
  '313', '315', '317',
  // ภาคตะวันออก & ชายแดนกัมพูชา
  '312', '314',
]

async function streamToken(token) {
  const url = `https://storage.googleapis.com/open-buildings-data/v3/polygons_s2_level_4_gzip/${token}_buildings.csv.gz`
  console.log(`\n→ Streaming ${token} from Google Open Buildings...`)

  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 404) { console.log(`  ⚠ ${token} ไม่มีข้อมูล (404) — ข้ามไป`); resolve(); return }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      const gunzip = zlib.createGunzip()
      const rl = readline.createInterface({ input: res.pipe(gunzip) })

      let header = true
      let batch = []
      let total = 0
      let inBbox = 0

      const flush = async () => {
        if (!batch.length) return
        const { error } = await supabase.from('buildings_ml').insert(batch)
        if (error) console.error('Insert error:', error.message)
        else { inBbox += batch.length; process.stdout.write(`\r  Inserted ${inBbox} buildings...`) }
        batch = []
      }

      rl.on('line', async line => {
        if (header) { header = false; return }
        total++
        const cols = line.split(',')
        const [latRaw, lngRaw, areaRaw, confidenceRaw, ...geometryParts] = cols
        const geometry = geometryParts.join(',').replace(/^"|"$/g, '')
        const lat = parseFloat(latRaw)
        const lng = parseFloat(lngRaw)
        if (lat < BBOX.south || lat > BBOX.north || lng < BBOX.west || lng > BBOX.east) return

        batch.push({
          lat,
          lng,
          area_m2: parseFloat(areaRaw),
          confidence: parseFloat(confidenceRaw),
          geometry
        })
        if (batch.length >= 1000) { rl.pause(); await flush(); rl.resume() }
      })
      rl.on('close', async () => { await flush(); console.log(`\n  Done ${token}: ${inBbox}/${total} rows in Thailand bbox`) ; resolve() })
      rl.on('error', reject)
    }).on('error', reject)
  })
}

console.log('=== Google Open Buildings → Supabase loader ===')
console.log('Thailand bbox:', BBOX)
for (const token of TOKENS) {
  try { await streamToken(token) } catch (e) { console.error(`Failed ${token}:`, e.message) }
}
console.log('\n✓ All done! Buildings loaded into Supabase table: buildings_ml')
