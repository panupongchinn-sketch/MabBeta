import type { AiReportRecord, CanonicalRecord, Incident, PipelineSnapshot, RawSourceEnvelope } from './types'

interface MepBetaStoreState {
  rawEvents: RawSourceEnvelope[]
  normalizedEvents: CanonicalRecord[]
  incidents: Incident[]
  reports: AiReportRecord[]
  latestSnapshot: PipelineSnapshot | null
}

const STORE_KEY = '__mepbeta_store__'
const RAW_LIMIT = 5000
const NORMALIZED_LIMIT = 50000
const REPORT_LIMIT = 1000

function trimToLimit<T>(arr: T[], limit: number): void {
  if (arr.length <= limit) return
  arr.splice(0, arr.length - limit)
}

function getStoreState(): MepBetaStoreState {
  const globalWithStore = globalThis as typeof globalThis & { [STORE_KEY]?: MepBetaStoreState }
  if (!globalWithStore[STORE_KEY]) {
    globalWithStore[STORE_KEY] = {
      rawEvents: [],
      normalizedEvents: [],
      incidents: [],
      reports: [],
      latestSnapshot: null,
    }
  }
  return globalWithStore[STORE_KEY]!
}

export function appendRawEvents(events: RawSourceEnvelope[]): void {
  if (!events.length) return
  const store = getStoreState()
  store.rawEvents.push(...events)
  trimToLimit(store.rawEvents, RAW_LIMIT)
}

export function appendNormalizedEvents(events: CanonicalRecord[]): void {
  if (!events.length) return
  const store = getStoreState()
  store.normalizedEvents.push(...events)
  trimToLimit(store.normalizedEvents, NORMALIZED_LIMIT)
}

export function getRecentNormalizedEvents(windowMinutes: number): CanonicalRecord[] {
  const store = getStoreState()
  const cutoff = Date.now() - windowMinutes * 60 * 1000
  return store.normalizedEvents.filter((record) => {
    const ts = new Date(record.timestamp).getTime()
    return Number.isFinite(ts) && ts >= cutoff
  })
}

export function replaceIncidents(incidents: Incident[]): void {
  getStoreState().incidents = incidents
}

export function setLatestSnapshot(snapshot: PipelineSnapshot): void {
  getStoreState().latestSnapshot = snapshot
}

export function getLatestSnapshot(): PipelineSnapshot | null {
  return getStoreState().latestSnapshot
}

export function appendAiReport(report: AiReportRecord): void {
  const store = getStoreState()
  store.reports.push(report)
  trimToLimit(store.reports, REPORT_LIMIT)
}

export function getLatestReports(limit = 20): AiReportRecord[] {
  const store = getStoreState()
  return store.reports.slice(Math.max(0, store.reports.length - limit)).reverse()
}

export function getStoreStats(): { raw_count: number; normalized_count: number; report_count: number } {
  const store = getStoreState()
  return {
    raw_count: store.rawEvents.length,
    normalized_count: store.normalizedEvents.length,
    report_count: store.reports.length,
  }
}
