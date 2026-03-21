import { runMepBetaPipeline } from '../mepbeta/pipeline'

const SCHEDULER_KEY = '__mepbeta_scheduler_started__'

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig() as unknown as Record<string, unknown>
  const enabled = String(runtimeConfig.MEPBETA_SCHEDULER_ENABLED ?? '').toLowerCase() === 'true'
  if (!enabled) return

  const globalWithFlag = globalThis as typeof globalThis & { [SCHEDULER_KEY]?: boolean }
  if (globalWithFlag[SCHEDULER_KEY]) return
  globalWithFlag[SCHEDULER_KEY] = true

  const parsedInterval = Number(runtimeConfig.MEPBETA_PULL_INTERVAL_MS ?? 300000)
  const intervalMs = Number.isFinite(parsedInterval) ? Math.max(60000, parsedInterval) : 300000

  const runOnce = async () => {
    try {
      await runMepBetaPipeline(runtimeConfig)
    } catch {
      // Keep scheduler resilient; errors are tolerated and next tick retries.
    }
  }

  runOnce()
  setInterval(runOnce, intervalMs)
})
