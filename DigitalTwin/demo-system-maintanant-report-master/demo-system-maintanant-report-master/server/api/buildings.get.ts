export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const south = parseFloat(q.south as string)
  const west  = parseFloat(q.west  as string)
  const north = parseFloat(q.north as string)
  const east  = parseFloat(q.east  as string)
  if ([south, west, north, east].some(isNaN)) throw createError({ statusCode: 400, message: 'south,west,north,east required' })

  const config = useRuntimeConfig()
  const supabaseUrl = config.SUPABASE_URL || config.public.SUPABASE_URL
  const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.public.SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase env is missing' })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('buildings_ml')
    .select('lat,lng,geometry,area_m2')
    .gte('lat', south).lte('lat', north)
    .gte('lng', west).lte('lng', east)
    .limit(5000)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
