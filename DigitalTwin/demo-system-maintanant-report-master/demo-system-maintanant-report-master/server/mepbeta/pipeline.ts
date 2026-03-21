import { deduplicateCanonical, normalizeSourceEnvelope } from './normalize'
import {
  appendNormalizedEvents,
  appendRawEvents,
  getLatestSnapshot,
  getRecentNormalizedEvents,
  replaceIncidents,
  setLatestSnapshot,
} from './platform-store'
import { evaluateRulesAndKpis } from './rules'
import { pullAllSources } from './sources'
import type { PipelineSnapshot, RawSourceEnvelope, SourceHealth } from './types'

const DEFAULT_WINDOW_MINUTES = 24 * 60

function sourceHealthFromEnvelopes(envelopes: RawSourceEnvelope[], recordCountBySource: Map<string, number>): SourceHealth[] {
  return envelopes.map((envelope) => ({
    source_type: envelope.sourceType,
    mode: envelope.receivedVia,
    ok: envelope.ok,
    fetched_at: envelope.fetchedAt,
    record_count: recordCountBySource.get(envelope.sourceType) ?? 0,
    note: envelope.note ?? null,
  }))
}

export function ingestEnvelopes(envelopes: RawSourceEnvelope[], recentWindowMinutes = DEFAULT_WINDOW_MINUTES): PipelineSnapshot {
  appendRawEvents(envelopes)

  const normalizedByEnvelope = envelopes.map((envelope) => normalizeSourceEnvelope(envelope))
  const normalized = deduplicateCanonical(normalizedByEnvelope.flat())
  appendNormalizedEvents(normalized)

  const recentRecords = getRecentNormalizedEvents(recentWindowMinutes)
  const evaluation = evaluateRulesAndKpis(recentRecords)
  replaceIncidents(evaluation.incidents)

  const recordCountBySource = new Map<string, number>()
  for (const record of normalized) {
    recordCountBySource.set(record.source_type, (recordCountBySource.get(record.source_type) ?? 0) + 1)
  }

  const snapshot: PipelineSnapshot = {
    generated_at: evaluation.generatedAt,
    records_ingested: normalized.length,
    recent_window_minutes: recentWindowMinutes,
    source_health: sourceHealthFromEnvelopes(envelopes, recordCountBySource),
    kpi: evaluation.kpi,
    incidents: evaluation.incidents,
  }

  setLatestSnapshot(snapshot)
  return snapshot
}

export async function runMepBetaPipeline(runtimeConfig: Record<string, unknown>, recentWindowMinutes = DEFAULT_WINDOW_MINUTES): Promise<PipelineSnapshot> {
  const envelopes = await pullAllSources(runtimeConfig)
  return ingestEnvelopes(envelopes, recentWindowMinutes)
}

export function getOrCreateSnapshot(runtimeConfig: Record<string, unknown>, forceRefresh = false): Promise<PipelineSnapshot> {
  const latest = getLatestSnapshot()
  if (!forceRefresh && latest) return Promise.resolve(latest)
  return runMepBetaPipeline(runtimeConfig)
}
