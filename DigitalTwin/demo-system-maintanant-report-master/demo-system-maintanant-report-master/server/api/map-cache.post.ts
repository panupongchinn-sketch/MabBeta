const DEFAULT_SUPABASE_URL = 'https://ezaccpveuyilyfownpzs.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lu9mwNQ95NC6C2ajzQSSXg_pqzEIfMA'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tileX, tileY, zoom, zoneIndex, data, userId } = body ?? {}
  if (tileX == null || tileY == null || zoom == null || zoneIndex == null || !data || !userId)
    throw createError({ statusCode: 400, message: 'tileX,tileY,zoom,zoneIndex,data,userId required' })

  const config = useRuntimeConfig()
  const supabaseUrl = config.SUPABASE_URL || config.public.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.public.SUPABASE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Validate: only super_admin or allowed email may save
  const { data: userRow } = await supabase
    .from('app_users')
    .select('role,email')
    .eq('id', userId)
    .single()
  const isAllowed = userRow?.role === 'super_admin' || userRow?.email === 'panupong.chinn@gmail.com'
  if (!isAllowed)
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const { error } = await supabase
    .from('map_cache')
    .upsert({
      tile_x: tileX,
      tile_y: tileY,
      zoom,
      zone_index: zoneIndex,
      data,
      created_by: userId,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'tile_x,tile_y,zoom,zone_index' })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
