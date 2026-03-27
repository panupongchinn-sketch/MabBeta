const DEFAULT_SUPABASE_URL = 'https://ezaccpveuyilyfownpzs.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lu9mwNQ95NC6C2ajzQSSXg_pqzEIfMA'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const tileX = parseInt(q.tileX as string)
  const tileY = parseInt(q.tileY as string)
  const zoom  = parseInt(q.zoom  as string)
  if ([tileX, tileY, zoom].some(isNaN))
    throw createError({ statusCode: 400, message: 'tileX,tileY,zoom required' })

  const config = useRuntimeConfig()
  const supabaseUrl = config.SUPABASE_URL || config.public.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.public.SUPABASE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('map_cache')
    .select('zone_index,data')
    .eq('tile_x', tileX)
    .eq('tile_y', tileY)
    .eq('zoom', zoom)
    .order('zone_index')

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
