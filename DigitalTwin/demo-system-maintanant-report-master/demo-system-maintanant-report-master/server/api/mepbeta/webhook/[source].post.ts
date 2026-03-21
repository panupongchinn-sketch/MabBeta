import { ingestEnvelopes } from '../../../mepbeta/pipeline'
import { SOURCE_TYPES, type RawSourceEnvelope, type SourceType } from '../../../mepbeta/types'

function isSourceType(value: string): value is SourceType {
  return (SOURCE_TYPES as readonly string[]).includes(value)
}

export default defineEventHandler(async (event) => {
  const params = event.context.params ?? {}
  const sourceParam = String(params.source ?? '')
  if (!isSourceType(sourceParam)) {
    throw createError({ statusCode: 400, message: `Unsupported source type: ${sourceParam}` })
  }

  const payload = await readBody(event)
  const envelope: RawSourceEnvelope = {
    sourceType: sourceParam,
    fetchedAt: new Date().toISOString(),
    receivedVia: 'webhook',
    ok: true,
    note: 'webhook_ingest',
    payload,
  }

  const snapshot = ingestEnvelopes([envelope], 24 * 60)
  return {
    ok: true,
    accepted_source: sourceParam,
    records_ingested: snapshot.records_ingested,
    incidents: snapshot.incidents.length,
    snapshot_generated_at: snapshot.generated_at,
  }
})
