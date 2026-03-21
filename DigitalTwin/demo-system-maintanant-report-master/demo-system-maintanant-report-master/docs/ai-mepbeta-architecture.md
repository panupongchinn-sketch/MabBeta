# Ai MepBeta Architecture

This project now includes a layered backend structure for Ai MepBeta aligned with:

- A. Data Source Layer
- B. Integration Layer
- C. Data Platform Layer
- D. Rule and Analytics Engine
- E. AI Reporting Layer
- F. Application Layer
- G. Notification Layer (hook point)

## File Mapping

### A. Data Source Layer

- `server/mepbeta/sources.ts`
  - Polls source APIs (traffic, lighting, cctv, water, air quality, weather, gis)
  - Falls back to mock payloads when API URLs are not configured

### B. Integration Layer

- `server/mepbeta/normalize.ts`
  - Validates and normalizes each source payload into one canonical schema
  - Deduplicates records
- `server/api/mepbeta/webhook/[source].post.ts`
  - Receives push events per source

Canonical schema fields:

- `source_type`
- `asset_id`
- `location_lat`
- `location_lng`
- `status`
- `value`
- `unit`
- `severity`
- `timestamp`

### C. Data Platform Layer

- `server/mepbeta/platform-store.ts`
  - In-memory store for:
    - raw events
    - normalized events
    - incidents
    - ai reports
    - latest snapshot
- SQL schema:
  - `sql/mepbeta_core.sql`
  - Includes raw/normalized/time-series and domain event tables

### D. Rule and Analytics Engine

- `server/mepbeta/rules.ts`
  - KPI calculation
  - Threshold checks
  - Cross-source correlation rules
  - Incident ranking by severity

### E. AI Reporting Layer

- `server/mepbeta/reporting.ts`
  - Takes KPI + incidents and generates executive report text
  - Uses Gemini API when configured
  - Provides deterministic fallback report when unavailable
- `server/api/mepbeta/ai-report.post.ts`
  - Generates and stores report output

### F. Application Layer

HTTP endpoints for frontend modules:

- `GET /api/mepbeta/snapshot`
- `POST /api/mepbeta/webhook/:source`
- `POST /api/mepbeta/ai-report`
- `GET /api/mepbeta/reports`

### G. Notification Layer

Notification logs table exists in:

- `alert_logs` (`sql/mepbeta_core.sql`)

You can connect line/email/telegram/web notifier worker to this table and dispatch policy.

## Runtime Environment Variables

Configured in `nuxt.config.ts`:

- `MEPBETA_TRAFFIC_API_URL`
- `MEPBETA_LIGHTING_API_URL`
- `MEPBETA_CCTV_API_URL`
- `MEPBETA_WATER_API_URL`
- `MEPBETA_AIR_QUALITY_API_URL`
- `MEPBETA_WEATHER_API_URL`
- `MEPBETA_GIS_API_URL`
- `MEPBETA_PULL_INTERVAL_MS`
- `MEPBETA_SCHEDULER_ENABLED`
- `GEMINI_API_KEY`

## Flow

1. Poll APIs or receive webhook payload
2. Validate and normalize to canonical events
3. Store raw and normalized events
4. Run rules and KPI calculations
5. Generate AI report from KPI and incidents
6. Serve results via snapshot/report endpoints
7. Trigger notifications via incident + alert log integration
