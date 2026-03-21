import { getLatestReports } from '../../mepbeta/platform-store'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const parsedLimit = Number(query.limit ?? 20)
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, Math.floor(parsedLimit))) : 20

  return {
    ok: true,
    reports: getLatestReports(limit),
  }
})
