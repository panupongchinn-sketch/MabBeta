# MapBeta Digital Twin

Nuxt 4 based digital twin app with Ai MepBeta layered backend.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Ai MepBeta Backend

Layered backend modules are in `server/mepbeta`:

- Data source connectors (poll and webhook)
- Canonical normalization layer
- Data platform in-memory store + SQL schema
- Rule and KPI engine
- AI reporting engine

### API endpoints

- `GET /api/mepbeta/snapshot`
- `POST /api/mepbeta/webhook/:source`
- `POST /api/mepbeta/ai-report`
- `GET /api/mepbeta/reports`

### Optional environment variables

- `GEMINI_API_KEY`
- `MEPBETA_TRAFFIC_API_URL`
- `MEPBETA_LIGHTING_API_URL`
- `MEPBETA_CCTV_API_URL`
- `MEPBETA_WATER_API_URL`
- `MEPBETA_AIR_QUALITY_API_URL`
- `MEPBETA_WEATHER_API_URL`
- `MEPBETA_GIS_API_URL`
- `MEPBETA_PULL_INTERVAL_MS`
- `MEPBETA_SCHEDULER_ENABLED=true`

### Schema and architecture docs

- SQL starter schema: `sql/mepbeta_core.sql`
- Architecture map: `docs/ai-mepbeta-architecture.md`
