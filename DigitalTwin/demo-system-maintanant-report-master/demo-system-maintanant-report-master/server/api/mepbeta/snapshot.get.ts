import { getStoreStats } from '../../mepbeta/platform-store'
import { getOrCreateSnapshot } from '../../mepbeta/pipeline'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceRefresh = query.refresh === '1' || query.refresh === 'true'
  const runtimeConfig = useRuntimeConfig(event) as unknown as Record<string, unknown>

  const snapshot = await getOrCreateSnapshot(runtimeConfig, forceRefresh)
  return {
    ok: true,
    snapshot,
    store: getStoreStats(),
  }
})
