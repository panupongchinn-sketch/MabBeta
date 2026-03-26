<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"

definePageMeta({ layout: 'empty' })

const { user: authUser, signOut, initSession, refreshUser } = useCustomAuth()
if (!authUser.value) initSession()

const onLogout = () => {
  signOut()
  navigateTo('/login')
}

const viewport = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref("")
const statusText = ref("Ready")
const errorText = ref("")
const loadedAssetCount = ref(0)
const viewerReady = ref(false)
const wallTransparentOn = ref(false)
const hasModel = ref(false)
const modelEntities = ref<{ id: number; name: string; root: any; pinToMap: boolean }[]>([])
const selectedModelId = ref<number | null>(null)
const modelClipboard = ref<{ name: string; root: any; sourceRelPath: string | null } | null>(null)
const transformX = ref(0)
const transformY = ref(0)
const transformZ = ref(0)
const transformRotY = ref(0)
const transformScale = ref(1)
const mapLat = ref(13.7563)
const mapLng = ref(100.5018)
const mapZoom = ref(16)
const mapSearchQuery = ref("")
const mapSearchLoading = ref(false)
const mapSearchError = ref("")
const mapSearchResults = ref<{ display: string; lat: number; lng: number }[]>([])
const mapDragSelectOn = ref(false)
const projectName = ref("")
const savingProject = ref(false)
const projectSaveError = ref("")
const projectSaveSuccess = ref("")
const savedProjects = ref<{ id: string; name: string; created_at: string; owner_id: string | null }[]>([])
const loadingProjects = ref(false)
const projectActionBusyId = ref<string | null>(null)
const projectLoadError = ref("")
const projectLoadSuccess = ref("")
const projectDeleteError = ref("")
const projectDeleteSuccess = ref("")
const userLicenseNote = ref<string | null>(null)
const isDemoUser = computed(() => userLicenseNote.value?.toUpperCase().includes('DEMO') ?? false)
const is7DayUser = computed(() => userLicenseNote.value?.includes('7 วัน') ?? false)
const isLimitedUser = computed(() => isDemoUser.value || is7DayUser.value)
const panelMapOpen = ref(true)
const panelModelOpen = ref(false)
const panelStatusOpen = ref(false)
const paletteOpen = ref(true)
const dayMode = ref(true)
const roadToolActive = ref(false)
const roadToolHint = ref("เปิด Road Tool แล้วลากบนพื้นเพื่อวาดถนน")
const roadCount = ref(0)
const lightDevices = ref<{ id: number; name: string; on: boolean }[]>([])
const lightPlaceMode = ref(false)
const dragLightActive = ref(false)
const dragLightHint = ref("ลากไอคอนหลอดไฟไปวางบนโมเดล")
const loadingSteps = ref([
  { label: "โหลด 3D Engine",         done: false },
  { label: "โหลด Plugins & Loaders", done: false },
  { label: "สร้าง Scene & Camera",    done: false },
  { label: "ตั้งค่า Environment",     done: false },
  { label: "โหลดแผนที่",              done: false },
])
const selectedStreetLightId = ref<number | null>(null)
const showStreetLightDetail = ref(false)
const panelLampOpen = ref(false)
const showCctvPanel = ref(false)
const cctvCameras = ref<{ id: number; name: string; url: string }[]>([])
const cctvNewName = ref("")
const cctvNewUrl = ref("")
const cctvMarkers = ref<{ id: number; cameraId: number; worldX: number; worldY: number; worldZ: number }[]>([])
const cctvScreenPos = ref<{ id: number; x: number; y: number; visible: boolean }[]>([])
const cctvDragCamId = ref<number | null>(null)
const cctvDragOver = ref(false)
const cctvActiveFeed = ref<{ markerId: number; cameraId: number } | null>(null)
let cctvIdSeed = 1
let cctvMarkerIdSeed = 1
const compassAngle = ref(0)
const tourRef = ref<any>(null)

function updateCctvMarkerPositions() {
  if (!camera || !renderer || !THREE || !cctvMarkers.value.length) {
    if (cctvScreenPos.value.length) cctvScreenPos.value = []
    return
  }
  const rect = renderer.domElement.getBoundingClientRect()
  cctvScreenPos.value = cctvMarkers.value.map(m => {
    const v = new THREE.Vector3(m.worldX, m.worldY, m.worldZ)
    v.project(camera)
    return {
      id: m.id,
      x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
      visible: v.z < 1
    }
  })
}

function addCctvCamera() {
  const url = cctvNewUrl.value.trim()
  const name = cctvNewName.value.trim() || `Camera ${cctvIdSeed}`
  if (!url) return
  cctvCameras.value.push({ id: cctvIdSeed++, name, url })
  cctvNewName.value = ""
  cctvNewUrl.value = ""
}
function removeCctvCamera(id: number) {
  cctvCameras.value = cctvCameras.value.filter(c => c.id !== id)
  cctvMarkers.value = cctvMarkers.value.filter(m => m.cameraId !== id)
  if (cctvActiveFeed.value?.cameraId === id) cctvActiveFeed.value = null
}
function removeCctvMarker(id: number) {
  cctvMarkers.value = cctvMarkers.value.filter(m => m.id !== id)
  if (cctvActiveFeed.value?.markerId === id) cctvActiveFeed.value = null
}
function getCctvCamera(id: number) {
  return cctvCameras.value.find(c => c.id === id)
}
function cctvStreamType(url: string): 'mjpeg' | 'video' | 'iframe' {
  const u = url.toLowerCase()
  if (u.includes('mjpeg') || u.includes('.mjpg') || u.includes('videostream') || u.endsWith('/video') || u.includes('/mjpg/video')) return 'mjpeg'
  if (u.includes('.mp4') || u.includes('.webm') || u.includes('.ogg') || u.includes('.m3u8')) return 'video'
  return 'iframe'
}
function onCctvDragStart(camId: number) {
  cctvDragCamId.value = camId
}
function onCctvDropOnMap(e: DragEvent) {
  if (cctvDragCamId.value === null) return
  e.preventDefault()
  cctvDragOver.value = false
  const hit = getRaycastHit(e.clientX, e.clientY)
  if (!hit) { cctvDragCamId.value = null; return }
  cctvMarkers.value.push({
    id: cctvMarkerIdSeed++,
    cameraId: cctvDragCamId.value,
    worldX: hit.point.x,
    worldY: hit.point.y,
    worldZ: hit.point.z
  })
  cctvDragCamId.value = null
}
const showLightRotateMenu = ref(false)
const lightRotateMenuId = ref<number | null>(null)
const lightRotateMenuX = ref(0)
const lightRotateMenuY = ref(0)
const lightRotateMenuAngle = ref(0)
let lrmDragging = false
let lrmDragOffX = 0
let lrmDragOffY = 0

let THREE: any
let mergeGeometries: any
let renderer: any
let scene: any
let camera: any
let controls: any
let pmrem: any
let loader: any
let loadingManager: any
let groundMesh: any = null
let mapSurfaceMesh: any = null
let mapTexture: any = null
let mapLoadToken = 0
let mapSearchToken = 0
let roadGroup: any = null
let modelFocusLight: any = null
let selectedModelMarker: any = null
let hemiLight: any = null
let sunLight: any = null
let nightStars: any = null
let cityGlowLight: any = null
let moonMesh: any = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let initPromise: Promise<void> | null = null
let pointerDownMoved = false
let pointerDownX = 0
let pointerDownY = 0
let activePointerId: number | null = null
let draggingModelId: number | null = null
let dragPlane: any = null
let dragOffset: any = null
let draggingLightId: number | null = null
let lightDragOffset: any = null
let roadDrawing = false
let roadPreview: any = null
let roadIdSeed = 1
const roadCurrentPoints: any[] = []
const roadSnapDistance = 1.2
let roadStartConnected = false
let mapDragging = false
let mapDragMoved = false
let mapDragStartPoint: any = null
let mapDragStartLat = 0
let mapDragStartLng = 0
let mapDragStartZoom = 16
let lightIdSeed = 1
let modelIdSeed = 1
const lightDeviceMap = new Map<number, any>()
const { $supabase } = useNuxtApp() as any

let defaultCamPos: [number, number, number] = [5, 3, 7]
let defaultTarget: [number, number, number] = [0, 1.2, 0]
const walkMode = ref(false)
const walkHint = ref("")
const walkDragActive = ref(false)
let walkKeys: Record<string, boolean> = {}
let walkSavedCamPos: [number,number,number] | null = null
let walkSavedTarget: [number,number,number] | null = null
const topViewMode = ref(false)
let topViewSavedPos: [number,number,number] | null = null
let topViewSavedTarget: [number,number,number] | null = null
let topViewSavedMinPolar = Math.PI * 0.2
let topViewSavedMaxPolar = Math.PI * 0.48

function toggleWalkMode() {
  if (!camera || !controls || !THREE) return
  if (walkMode.value) { exitWalkMode(); return }
  // save current view
  walkSavedCamPos = [camera.position.x, camera.position.y, camera.position.z]
  walkSavedTarget = [controls.target.x, controls.target.y, controls.target.z]
  // move camera to eye level at current target
  const eyeH = 1.75
  const dir = camera.position.clone().sub(controls.target).normalize()
  dir.y = 0; dir.normalize()
  const cx = controls.target.x + dir.x * 3
  const cz = controls.target.z + dir.z * 3
  camera.position.set(cx, eyeH, cz)
  controls.target.set(controls.target.x, eyeH, controls.target.z)
  controls.minDistance = 0.2
  controls.maxDistance = 8
  controls.minPolarAngle = 0.05
  controls.maxPolarAngle = Math.PI * 0.92
  controls.dampingFactor = 0.10
  walkMode.value = true
  walkHint.value = "W/A/S/D หรือ ↑↓←→ เดิน · เม้าส์ลาก หมุน · ESC ออก"
  window.addEventListener('keydown', onWalkKey)
  window.addEventListener('keyup', onWalkKeyUp)
}

function exitWalkMode() {
  if (!camera || !controls) return
  if (walkSavedCamPos) camera.position.set(...walkSavedCamPos)
  if (walkSavedTarget) controls.target.set(...walkSavedTarget)
  controls.minDistance = 0.1
  controls.maxDistance = 50000
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI / 2 - 0.01
  controls.dampingFactor = 0.06
  walkMode.value = false
  walkKeys = {}
  window.removeEventListener('keydown', onWalkKey)
  window.removeEventListener('keyup', onWalkKeyUp)
}

function onWalkPersonDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", "walk-person")
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy"
  walkDragActive.value = true
}

function onWalkPersonDragEnd() {
  walkDragActive.value = false
}

function dropWalkPerson(clientX: number, clientY: number) {
  if (!camera || !controls || !THREE) return
  const hit = getRaycastHit(clientX, clientY)
  if (!hit) return
  const eyeH = 1.75
  // save current view if not already in walk mode
  if (!walkMode.value) {
    walkSavedCamPos = [camera.position.x, camera.position.y, camera.position.z]
    walkSavedTarget = [controls.target.x, controls.target.y, controls.target.z]
    controls.minDistance = 0.2
    controls.maxDistance = 8
    controls.minPolarAngle = 0.05
    controls.maxPolarAngle = Math.PI * 0.92
    controls.dampingFactor = 0.10
    window.addEventListener('keydown', onWalkKey)
    window.addEventListener('keyup', onWalkKeyUp)
  }
  // place camera slightly behind drop point, looking forward
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation)
  dir.y = 0; dir.normalize()
  camera.position.set(hit.point.x - dir.x * 2, eyeH, hit.point.z - dir.z * 2)
  controls.target.set(hit.point.x, eyeH, hit.point.z)
  walkMode.value = true
  walkHint.value = "W/A/S/D หรือ ↑↓←→ เดิน · เม้าส์ลาก หมุน · ESC ออก"
}

function onWalkKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { exitWalkMode(); return }
  walkKeys[e.key.toLowerCase()] = true
}
function onWalkKeyUp(e: KeyboardEvent) {
  walkKeys[e.key.toLowerCase()] = false
}

function updateWalkMovement() {
  if (!walkMode.value || !camera || !controls || !THREE) return
  const speed = 0.07
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)
  dir.y = 0; dir.normalize()
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).normalize()
  const move = new THREE.Vector3()
  if (walkKeys['w'] || walkKeys['arrowup'])    move.add(dir)
  if (walkKeys['s'] || walkKeys['arrowdown'])  move.sub(dir)
  if (walkKeys['a'] || walkKeys['arrowleft'])  move.sub(right)
  if (walkKeys['d'] || walkKeys['arrowright']) move.add(right)
  if (move.length() > 0) {
    move.normalize().multiplyScalar(speed)
    camera.position.add(move)
    controls.target.add(move)
  }
}
let modelRadius = 1
let modelCenter: any = null
let lastWallSig = ""
const MAP_SURFACE_SIZE = 1100
const MAP_TILE_SPAN = 11
const PROJECT_ASSET_BUCKET = "digital-twin-project-files"
const TERRAIN_SEG = 64                        // 64×64 subdivisions → 65×65 vertices
const TERRAIN_ELEV_SCALE = 1.0                // 1.0 = proportional to building scale (wupm)
const BUILDING_CURVE_SEGMENTS = 1
const BUILDING_YIELD_EVERY = 40
const TREE_YIELD_EVERY = 120
const MAX_BUILDING_GEOMETRY_CACHE = 1200
const objectUrlPool: string[] = []
let osmBuildingGroup: any = null
let osmOuterBuildingGroups: any[] = []
let osmTreeGroup: any = null
let osmLoadToken = 0
// terrain heightfield (in world units), indexed [iy*(TERRAIN_SEG+1)+ix]
let terrainField: Float32Array | null = null
let terrainWorldUnitsPerMeter = 0
interface BuildingsMlRow {
  lat: number
  lng: number
  geometry: string
  area_m2?: number | null
}
interface OSMSceneData {
  osm: any
  buildings: BuildingsMlRow[]
}
const buildingGeometryCache = new Map<string, number[][][]>()
const osmDataCache    = new Map<string, OSMSceneData>()         // cache by "tileX,tileY,z"
const osmFetchInFlight = new Map<string, Promise<OSMSceneData>>() // dedup concurrent fetches
const osmBuilding3dLoading = ref(false)
const osmLoadingPct = ref(0)
const osmLoadingStep = ref("")
let trafficGroup: any = null
let trafficLoadToken = 0
let trafficRefreshTimer: any = null
let waterGroup: any = null
let waterLoadToken = 0

interface WaterSource {
  id: number; name: string; type: string
  worldX: number; worldZ: number
  lat?: number; lng?: number
  pct?: number; levelM?: number; storedMCM?: number; capacityMCM?: number
  inflowMCM?: number; releasedMCM?: number; province?: string
}
interface ThaiDamRec {
  id: number; name_th: string; name_en: string
  lat: number; lng: number
  pct?: number; levelM?: number; storedMCM?: number; capacityMCM?: number
  inflowMCM?: number; releasedMCM?: number; province?: string
}
const panelWaterOpen = ref(false)
const showWaterSupplyPanel = ref(false)
const waterVisible   = ref(false)
const waterLoading   = ref(false)
const waterLastUpdate = ref("")
const waterSources   = ref<WaterSource[]>([])
const waterScreenPos = ref<{ id: number; x: number; y: number; visible: boolean; source: WaterSource }[]>([])
const selectedWater  = ref<WaterSource | null>(null)

// ── Water Pipe Layer (ผังประปา) ──────────────────────────────────
const panelWaterPipeOpen = ref(false)
const waterPipeVisible   = ref(false)
const waterPipeLoading   = ref(false)
let waterPipeGroup: any = null
let waterPipeLoadToken = 0
interface WPNode { id: string; name: string; type: string; status: string; worldX: number; worldZ: number }
interface WPSeg  { id: string; label: string; status: string; midX: number; midZ: number }
const waterPipeNodes    = ref<WPNode[]>([])
const waterPipeSegs     = ref<WPSeg[]>([])
const wpNodeScreenPos   = ref<{ id: string; x: number; y: number; visible: boolean; node: WPNode }[]>([])
const wpSegScreenPos    = ref<{ id: string; x: number; y: number; visible: boolean; seg: WPSeg }[]>([])
const selectedWPNode    = ref<WPNode | null>(null)

// ── Water Pipe Drawing Tool ───────────────────────────────────────
const wpToolOpen    = ref(false)
const wpToolMode    = ref<'pipe'|'valve'|'hydrant'|'meter'>('pipe')
const wpToolDiam    = ref(150)
const wpToolMat     = ref<'pvc'|'ductile_iron'|'hdpe'|'steel'>('pvc')
const wpToolStatus  = ref<'normal'|'leaking'|'blocked'>('normal')
let   wpDrawing     = false
const wpDrawPoints: any[] = []
let   wpPreviewLine: any  = null
let   wpUserGroup:  any   = null
let   wpUserIdSeed  = 0
interface WPUserPipe { id:string; pts:{x:number;z:number}[]; diam:number; mat:string; status:string; label:string; midX:number; midZ:number }
interface WPUserNode { id:string; type:'valve'|'hydrant'|'meter'; x:number; z:number }
const wpUserPipes = ref<WPUserPipe[]>([])
const wpUserNodes = ref<WPUserNode[]>([])
const wpUserPipeScreen = ref<{id:string;x:number;y:number;visible:boolean;pipe:WPUserPipe}[]>([])
const wpUserNodeScreen = ref<{id:string;x:number;y:number;visible:boolean;node:WPUserNode}[]>([])

// ── อบต. Boundary Layer ──────────────────────────────────────────
const tambonVisible = ref(false)
const tambonLoading = ref(false)
const tambonError = ref("")
let tambonGroup: any = null
let tambonLoadToken = 0
interface TambonArea { id: number; name: string; midX: number; midZ: number }
const tambonAreas = ref<TambonArea[]>([])
const tambonLabelPos = ref<{ id: number; x: number; y: number; visible: boolean; name: string }[]>([])

const panelTrafficOpen = ref(false)
const trafficVisible = ref(false)
const trafficLoading = ref(false)
const trafficLastUpdate = ref("")
const trafficStats = ref({ free: 0, slow: 0, jam: 0 })
const TRAFFIC_REFRESH_MS = 60_000

// ── PM2.5 ──
const pm25PanelOpen = ref(true)
const pm25Stations = ref<{ name: string; value: number; aqi: number; updated: string; dist: number }[]>([])
const pm25Loading = ref(false)
const pm25LastUpdate = ref("")
const pm25Error = ref("")
const pm25Weather = ref<{ temp: number | null; wind: number | null; humidity: number | null }>({ temp: null, wind: null, humidity: null })
const pm25DetailOpen = ref(false)
const pm25DetailLoading = ref(false)
const pm25HourlyData = ref<{ time: string; aqi: number; temp: number; wind: number; humidity: number; wcode: number }[]>([])
const pm25DailyData  = ref<{ date: string; aqi: number; maxT: number; minT: number; wind: number; humidity: number; wcode: number }[]>([])
const pm25Pollutants = ref<{ pm25: number; o3: number; no2: number; so2: number; co: number } | null>(null)
const pm25LocationName = ref("")

// Traffic level → 3D color config (shared by HERE & Waze)
// level 0 = ไหลดี, 1-2 = เริ่มติด, 3-4 = ติดหนัก, 5 = หยุดนิ่ง
// jamFactor (HERE 0-10) → level: 0-1=0, 2-3=1, 4-5=2, 6-7=3, 8-9=4, 10=5
function jamFactorToLevel(jf: number): number {
  if (jf < 2)  return 0
  if (jf < 4)  return 1
  if (jf < 6)  return 2
  if (jf < 8)  return 3
  if (jf < 10) return 4
  return 5
}
const WAZE_LEVEL_CFG = [
  { color: 0x166534, emissive: 0x16a34a, glow: 0x16a34a, w: 0.60, opacity: 0.92 }, // 0 free
  { color: 0x3b6b00, emissive: 0x65a30d, glow: 0x84cc16, w: 0.65, opacity: 0.92 }, // 1 light
  { color: 0x854d0e, emissive: 0xca8a04, glow: 0xfbbf24, w: 0.70, opacity: 0.94 }, // 2 moderate
  { color: 0x9a3412, emissive: 0xea580c, glow: 0xfb923c, w: 0.75, opacity: 0.96 }, // 3 heavy
  { color: 0x7f1d1d, emissive: 0xdc2626, glow: 0xf87171, w: 0.80, opacity: 0.97 }, // 4 very heavy
  { color: 0x450a0a, emissive: 0xb91c1c, glow: 0xef4444, w: 0.82, opacity: 0.99 }, // 5 standstill
]

async function loadTrafficLayer() {
  if (!scene || !THREE || !mapSurfaceMesh) return
  trafficLoading.value = true
  ++trafficLoadToken
  const token = trafficLoadToken
  try {
    const z    = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
    const half = MAP_TILE_SPAN / 2
    const cx   = lonToTileX(mapLng.value, z)
    const cy   = latToTileY(mapLat.value, z)
    const south = tileYToLat(cy + half, z)
    const north = tileYToLat(cy - half, z)
    const west  = tileXToLon(cx - half, z)
    const east  = tileXToLon(cx + half, z)

    // ── 1. Fetch traffic segments from server proxy (HERE → Waze fallback) ──
    const res = await fetch(`/api/traffic-flow?north=${north}&south=${south}&east=${east}&west=${west}`)
    if (token !== trafficLoadToken) return
    const trafficData = res.ok ? await res.json() : { source: 'none', segments: [] }
    const segments: {
      points: { lat: number; lng: number }[]
      jamFactor: number
      speedKMH: number
      freeFlowKMH: number
    }[] = trafficData.segments ?? []

    // ── 2. Waze returns only jammed roads → still need OSM for green roads base
    const needOsm = true
    let osmElements: any[] = []
    let nodeMap = new Map<number, { lat: number; lon: number }>()

    if (needOsm) {
      const bbox = `${south},${west},${north},${east}`
      const osmQ = `[out:json][timeout:20];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"](${bbox});(._;>;);out body;`
      for (const mirror of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
        try {
          const osmRes = await fetch(`${mirror}?data=${encodeURIComponent(osmQ)}`, { signal: AbortSignal.timeout(25_000) })
          if (osmRes.ok) {
            const osmData = await osmRes.json()
            osmElements = osmData.elements ?? []
            for (const el of osmElements)
              if (el.type === 'node') nodeMap.set(el.id, { lat: el.lat, lon: el.lon })
            break
          }
        } catch { /* try next mirror */ }
      }
    }
    if (token !== trafficLoadToken) return

    // ── 3. Build jam spatial grid for OSM road colouring ──────────────────
    // jamFactor 0–10 → level index 0–5
    const jamGrid = new Map<string, number>()
    for (const seg of segments) {
      const lvl = jamFactorToLevel(seg.jamFactor)
      if (lvl === 0) continue  // free flow — don't need to mark grid
      for (let i = 0; i < seg.points.length - 1; i++) {
        const mlat = ((seg.points[i].lat + seg.points[i + 1].lat) / 2).toFixed(4)
        const mlng = ((seg.points[i].lng + seg.points[i + 1].lng) / 2).toFixed(4)
        const key  = `${mlat},${mlng}`
        if (!jamGrid.has(key) || jamGrid.get(key)! < lvl) jamGrid.set(key, lvl)
      }
    }

    // ── 4. Build Three.js scene ────────────────────────────────────────────
    clearTrafficLayer()
    trafficGroup = new THREE.Group()
    scene.add(trafficGroup)

    const mats = WAZE_LEVEL_CFG.map(c => new THREE.MeshStandardMaterial({
      color: c.color, emissive: c.emissive, emissiveIntensity: 2.6,
      roughness: 0, metalness: 0, transparent: true, opacity: c.opacity, depthWrite: false,
    }))
    const glowMats = WAZE_LEVEL_CFG.map(c => new THREE.MeshStandardMaterial({
      color: c.glow, emissive: c.glow, emissiveIntensity: 1.8,
      transparent: true, opacity: 0.18, roughness: 0, metalness: 0, depthWrite: false,
    }))

    const Y = 0.12, ROAD_H = 0.07

    function addRoadSeg(pts: any[], level: number) {
      const cfg = WAZE_LEVEL_CFG[level]
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1]
        const segLen = a.distanceTo(b)
        if (segLen < 0.01) continue
        const mid   = a.clone().add(b).multiplyScalar(0.5)
        const angle = Math.atan2(b.x - a.x, b.z - a.z)
        const seg = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, ROAD_H, segLen), mats[level])
        seg.position.copy(mid); seg.rotation.y = angle
        trafficGroup.add(seg)
        const glow = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 3, ROAD_H * 0.3, segLen), glowMats[level])
        glow.position.copy(mid); glow.position.y -= 0.01; glow.rotation.y = angle
        trafficGroup.add(glow)
      }
    }

    let free = 0, slow = 0, jam = 0

    // Pass A: OSM roads coloured by nearest Waze jam cell
    for (const el of osmElements) {
      if (el.type !== 'way' || !el.nodes) continue
      const pts: any[] = []
      for (const nid of el.nodes) {
        const nd = nodeMap.get(nid); if (!nd) continue
        const wp = latLngToWorld(nd.lat, nd.lon, mapLat.value, mapLng.value, z)
        pts.push(new THREE.Vector3(wp.x, Y, wp.z))
      }
      if (pts.length < 2) continue

      let worstLevel = 0
      for (let i = 0; i < el.nodes.length - 1; i++) {
        const nd1 = nodeMap.get(el.nodes[i])
        const nd2 = nodeMap.get(el.nodes[i + 1])
        if (!nd1 || !nd2) continue
        const mlat = ((nd1.lat + nd2.lat) / 2).toFixed(4)
        const mlng = ((nd1.lon + nd2.lon) / 2).toFixed(4)
        for (let dlat = -1; dlat <= 1; dlat++) {
          for (let dlng = -1; dlng <= 1; dlng++) {
            const k = `${(parseFloat(mlat) + dlat * 0.0001).toFixed(4)},${(parseFloat(mlng) + dlng * 0.0001).toFixed(4)}`
            const lvl = jamGrid.get(k)
            if (lvl !== undefined && lvl > worstLevel) worstLevel = lvl
          }
        }
      }
      if (worstLevel === 0) free++; else if (worstLevel <= 2) slow++; else jam++
      addRoadSeg(pts, worstLevel)
    }

    // Pass B: Waze jam polylines overlay (fill gaps not in OSM)
    for (const seg of segments) {
      const lvl = jamFactorToLevel(seg.jamFactor)
      if (lvl === 0) continue
      const pts = seg.points.map((p: any) => {
        const wp = latLngToWorld(p.lat, p.lng, mapLat.value, mapLng.value, z)
        return new THREE.Vector3(wp.x, Y + 0.02, wp.z)
      })
      if (pts.length >= 2) addRoadSeg(pts, lvl)
    }

    trafficStats.value = { free, slow, jam }
    trafficLastUpdate.value = new Date().toLocaleTimeString('th-TH')
  } catch (e) {
    console.warn('Traffic load failed:', e)
  } finally {
    if (token === trafficLoadToken) trafficLoading.value = false
  }
}

function clearTrafficLayer() {
  if (trafficGroup) { scene?.remove(trafficGroup); trafficGroup = null }
}


function toggleTrafficLayer() {
  trafficVisible.value = !trafficVisible.value
  if (trafficVisible.value) {
    loadTrafficLayer()
    trafficRefreshTimer = setInterval(() => {
      if (trafficVisible.value) loadTrafficLayer()
    }, TRAFFIC_REFRESH_MS)
  } else {
    clearTrafficLayer()
    clearInterval(trafficRefreshTimer)
    trafficRefreshTimer = null
  }
}
// ─── PM2.5 Layer ───────────────────────────────────────────────
// ─── PM2.5 AQI helpers (US AQI scale) ───────────────────────────
function pm25AqiBg(aqi: number | null): string {
  if (aqi === null) return 'linear-gradient(135deg,#f1f5f9,#e2e8f0)'
  if (aqi <= 50)  return 'linear-gradient(135deg,#bbf7d0,#6ee7b7)'
  if (aqi <= 100) return 'linear-gradient(135deg,#fef9c3,#fde047)'
  if (aqi <= 150) return 'linear-gradient(135deg,#ffedd5,#fb923c)'
  if (aqi <= 200) return 'linear-gradient(135deg,#fee2e2,#f87171)'
  if (aqi <= 300) return 'linear-gradient(135deg,#f3e8ff,#c084fc)'
  return 'linear-gradient(135deg,#fce7f3,#9f1239)'
}
function pm25AqiColor(aqi: number | null): string {
  if (aqi === null) return '#64748b'
  if (aqi <= 50)  return '#166534'
  if (aqi <= 100) return '#854d0e'
  if (aqi <= 150) return '#9a3412'
  if (aqi <= 200) return '#991b1b'
  if (aqi <= 300) return '#6b21a8'
  return '#881337'
}
function pm25AqiBoxBg(aqi: number | null): string {
  if (aqi === null) return 'rgba(0,0,0,0.08)'
  if (aqi <= 50)  return 'rgba(22,101,52,0.15)'
  if (aqi <= 100) return 'rgba(133,77,14,0.15)'
  if (aqi <= 150) return 'rgba(154,52,18,0.15)'
  if (aqi <= 200) return 'rgba(153,27,27,0.15)'
  if (aqi <= 300) return 'rgba(107,33,168,0.15)'
  return 'rgba(136,19,55,0.15)'
}
function pm25LevelLabel(aqi: number | null): string {
  if (aqi === null) return 'ไม่มีข้อมูล'
  if (aqi <= 50)  return 'ดี'
  if (aqi <= 100) return 'ปานกลาง'
  if (aqi <= 150) return 'ไม่ดีต่อผู้อ่อนไหว'
  if (aqi <= 200) return 'ไม่ดีต่อสุขภาพ'
  if (aqi <= 300) return 'อันตรายมาก'
  return 'อันตราย'
}
function pm25FacePath(aqi: number | null): string {
  // mouth path: positive = smile, 0 = flat, negative = frown
  if (aqi === null) return 'M10 19 Q16 19 22 19'
  if (aqi <= 50)  return 'M10 18 Q16 22 22 18'
  if (aqi <= 100) return 'M10 19 Q16 19 22 19'
  if (aqi <= 150) return 'M10 20 Q16 17 22 20'
  return 'M10 21 Q16 16 22 21'
}
function pm25Color(val: number | null): string { return pm25AqiColor(val) }
function pm25Avg(): number | null {
  const vals = pm25Stations.value.map(s => s.aqi).filter(v => v > 0)
  if (!vals.length) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
function pm25Pm25Avg(): number | null {
  const vals = pm25Stations.value.map(s => s.value).filter(v => v >= 0)
  if (!vals.length) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
}
const aiPollutants = computed<{ label: string; value: string }[]>(() => {
  const p = pm25Pollutants.value
  if (!p) return []
  return [
    { label: 'PM2.5', value: `${p.pm25} µg/m³` },
    { label: 'O₃', value: `${p.o3} µg/m³` },
    { label: 'NO₂', value: `${p.no2} µg/m³` },
    { label: 'SO₂', value: `${p.so2} µg/m³` },
    { label: 'CO', value: `${p.co} µg/m³` },
  ]
})

async function refreshAiMapBeta() {
  const jobs: Promise<unknown>[] = [loadPm25()]
  if (viewerReady.value) {
    jobs.push(loadTrafficLayer(), loadWaterLayer())
  }
  await Promise.allSettled(jobs)
}

function pm25WxIcon(code: number): string {
  if (code === 0) return `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="12" r="5" fill="#facc15"/><g stroke="#facc15" stroke-width="2" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></g></svg>`
  if (code <= 3)  return `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="9" cy="13" r="4" fill="#facc15"/><ellipse cx="15" cy="14" rx="5" ry="4" fill="#94a3b8"/><ellipse cx="11" cy="16" rx="6" ry="4" fill="#cbd5e1"/></svg>`
  if (code <= 48) return `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><ellipse cx="12" cy="14" rx="7" ry="5" fill="#94a3b8"/><ellipse cx="8" cy="15" rx="4" ry="3" fill="#cbd5e1"/></svg>`
  if (code <= 67) return `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><ellipse cx="12" cy="11" rx="7" ry="5" fill="#94a3b8"/><g stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round"><line x1="9" y1="17" x2="8" y2="20"/><line x1="13" y1="17" x2="12" y2="20"/><line x1="17" y1="17" x2="16" y2="20"/></g></svg>`
  return `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><ellipse cx="12" cy="11" rx="7" ry="5" fill="#64748b"/><g stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"><line x1="9" y1="17" x2="8" y2="20"/><line x1="13" y1="17" x2="12" y2="20"/></g></svg>`
}
function pm25DayName(dateStr: string, idx: number): string {
  if (idx === 0) return 'วันนี้'
  if (idx === 1) return 'พรุ่งนี้'
  const d = new Date(dateStr)
  const days = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']
  return days[d.getDay()] ?? ''
}
function pm25HaversineDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
async function loadPm25Weather(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&wind_speed_unit=kmh`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return
    const j = await res.json()
    const c = j.current
    pm25Weather.value = {
      temp:     c?.temperature_2m     !== undefined ? Math.round(c.temperature_2m)     : null,
      wind:     c?.wind_speed_10m     !== undefined ? Math.round(c.wind_speed_10m)     : null,
      humidity: c?.relative_humidity_2m !== undefined ? Math.round(c.relative_humidity_2m) : null,
    }
  } catch { /* weather is optional */ }
}
async function loadLocationName(lat: number, lng: number) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    )
    if (!r.ok) return
    const j = await r.json()
    const a = j.address ?? {}
    pm25LocationName.value = a.suburb ?? a.quarter ?? a.neighbourhood ?? a.village ?? a.town ?? a.city ?? a.county ?? a.state ?? j.display_name?.split(',')[0] ?? ''
  } catch { /* optional */ }
}

async function loadPm25() {
  pm25Loading.value = true
  pm25Stations.value = []
  pm25Error.value = ''
  pm25LocationName.value = ''
  const lat = mapLat.value
  const lng = mapLng.value
  try {
    // Open-Meteo Air Quality API — free, no auth, CORS-enabled (same provider as weather)
    const r = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm2_5,us_aqi&timezone=auto`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!r.ok) throw new Error(`Open-Meteo AQ HTTP ${r.status}`)
    const j = await r.json()
    const pm25Val: number | undefined = j.current?.pm2_5
    const aqiVal: number | undefined  = j.current?.us_aqi
    if (pm25Val === undefined && aqiVal === undefined) throw new Error('ไม่มีข้อมูลจาก Open-Meteo')
    pm25Stations.value = [{
      name: 'Open-Meteo (พิกัดปัจจุบัน)',
      value: pm25Val !== undefined ? Math.round(pm25Val * 10) / 10 : 0,
      aqi:   aqiVal !== undefined  ? Math.round(aqiVal) : 0,
      updated: j.current?.time ?? '',
      dist: 0,
    }]
    pm25LastUpdate.value = new Date().toLocaleTimeString('th-TH')
    loadPm25Weather(lat, lng)
    loadLocationName(lat, lng)
  } catch (e: any) {
    console.error('[PM2.5]', e)
    pm25Error.value = e?.message ?? 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    pm25Loading.value = false
  }
}

async function loadPm25Detail() {
  pm25DetailOpen.value = true
  pm25DetailLoading.value = true
  const lat = mapLat.value
  const lng = mapLng.value
  try {
    const [aqRes, wxRes] = await Promise.all([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,us_aqi&timezone=auto&forecast_days=7`, { signal: AbortSignal.timeout(12000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m_max&wind_speed_unit=kmh&timezone=auto&forecast_days=7`, { signal: AbortSignal.timeout(12000) }),
    ])
    const aq = await aqRes.json()
    const wx = await wxRes.json()
    const aqTimes: string[] = aq.hourly?.time ?? []
    const wxTimes: string[] = wx.hourly?.time ?? []
    // Find current hour
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    // Use local time string matching Open-Meteo format
    const localHour = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
    let nowIdx = aqTimes.indexOf(localHour)
    if (nowIdx < 0) nowIdx = 0
    // Hourly: current + next 16 hours
    const hourly = []
    for (let i = nowIdx; i < Math.min(nowIdx + 17, aqTimes.length); i++) {
      const t = aqTimes[i] ?? ''
      const wxIdx = wxTimes.indexOf(t)
      const label = i === nowIdx ? 'ขณะนี้' : (t.split('T')[1]?.slice(0, 5) ?? '')
      hourly.push({
        time:     label,
        aqi:      Math.round(aq.hourly?.us_aqi?.[i] ?? 0),
        temp:     Math.round(wx.hourly?.temperature_2m?.[wxIdx] ?? 0),
        wind:     Math.round(wx.hourly?.wind_speed_10m?.[wxIdx] ?? 0),
        humidity: Math.round(wx.hourly?.relative_humidity_2m?.[wxIdx] ?? 0),
        wcode:    wx.hourly?.weather_code?.[wxIdx] ?? 0,
      })
    }
    pm25HourlyData.value = hourly
    // Daily: 7 days
    const dailyTimes: string[] = wx.daily?.time ?? []
    const daily = dailyTimes.slice(0, 7).map((date, d) => {
      const midday = date + 'T12:00'
      const aqIdx = aqTimes.indexOf(midday)
      return {
        date,
        aqi:      aqIdx >= 0 ? Math.round(aq.hourly?.us_aqi?.[aqIdx] ?? 0) : 0,
        maxT:     Math.round(wx.daily?.temperature_2m_max?.[d] ?? 0),
        minT:     Math.round(wx.daily?.temperature_2m_min?.[d] ?? 0),
        wind:     Math.round(wx.daily?.wind_speed_10m_max?.[d] ?? 0),
        humidity: Math.round(wx.daily?.relative_humidity_2m_max?.[d] ?? 0),
        wcode:    wx.daily?.weather_code?.[d] ?? 0,
      }
    })
    pm25DailyData.value = daily
    // Current pollutants
    pm25Pollutants.value = {
      pm25: Math.round((aq.hourly?.pm2_5?.[nowIdx] ?? 0) * 10) / 10,
      o3:   Math.round((aq.hourly?.ozone?.[nowIdx] ?? 0) * 10) / 10,
      no2:  Math.round((aq.hourly?.nitrogen_dioxide?.[nowIdx] ?? 0) * 10) / 10,
      so2:  Math.round((aq.hourly?.sulphur_dioxide?.[nowIdx] ?? 0) * 10) / 10,
      co:   Math.round((aq.hourly?.carbon_monoxide?.[nowIdx] ?? 0) * 10) / 10,
    }
  } catch (e) {
    console.error('[PM2.5 Detail]', e)
  } finally {
    pm25DetailLoading.value = false
  }
}

// ─── Water Layer ───────────────────────────────────────────────
async function fetchThaiDamData(): Promise<ThaiDamRec[]> {
  try {
    const res = await fetch(
      'https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/dam',
      { signal: AbortSignal.timeout(12000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json.result !== 'OK') throw new Error('API result not OK')

    const recs: ThaiDamRec[] = []
    let idSeed = 1

    // dam_daily — large reservoirs with coordinates
    for (const d of json.data?.dam_daily ?? []) {
      const lat = parseFloat(d.dam?.dam_lat ?? '')
      const lng = parseFloat(d.dam?.dam_long ?? '')
      if (isNaN(lat) || isNaN(lng)) continue
      recs.push({
        id: idSeed++,
        name_th: d.dam?.dam_name?.th ?? '',
        name_en: d.dam?.dam_name?.en ?? '',
        lat, lng,
        pct:         parseNum(d.dam_storage_percent),
        levelM:      parseNum(d.dam_level),
        storedMCM:   parseNum(d.dam_storage),
        capacityMCM: parseNum(d.dam?.max_storage),
        inflowMCM:   parseNum(d.dam_inflow),
        releasedMCM: parseNum(d.dam_released),
        province:    d.dam?.province?.province_name?.th,
      })
    }

    // dam_small_tele — small dams (supplement large)
    for (const d of json.data?.dam_small_tele ?? []) {
      const lat = parseFloat(d.dam?.dam_lat ?? '')
      const lng = parseFloat(d.dam?.dam_long ?? '')
      if (isNaN(lat) || isNaN(lng)) continue
      recs.push({
        id: idSeed++,
        name_th: d.dam?.smalldam_name?.th ?? '',
        name_en: d.dam?.smalldam_name?.en ?? '',
        lat, lng,
        pct:         parseNum(d.percent_storage),
        levelM:      parseNum(d.water_level),
        storedMCM:   parseNum(d.volume),
        capacityMCM: parseNum(d.dam?.normal_storage),
      })
    }

    console.log(`[Water] Loaded ${recs.length} dams from api-v3.thaiwater.net`)
    return recs
  } catch (e) {
    console.warn('[Water] fetchThaiDamData failed:', e)
    return []
  }
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Spatial match: find nearest dam within threshold
function matchDamByLatLng(lat: number, lng: number, recs: ThaiDamRec[], thresholdKm = 5): ThaiDamRec | null {
  let best: ThaiDamRec | null = null
  let bestDist = Infinity
  for (const r of recs) {
    const d = haversineKm(lat, lng, r.lat, r.lng)
    if (d < bestDist) { bestDist = d; best = r }
  }
  return bestDist <= thresholdKm ? best : null
}

// World coords → lat/lng (inverse of latLngToWorld)
function worldToLatLng(wx: number, wz: number, centerLat: number, centerLng: number, z: number) {
  const unitsPerTile = MAP_SURFACE_SIZE / MAP_TILE_SPAN
  const tileX = Math.floor(lonToTileX(centerLng, z))
  const tileY = Math.floor(latToTileY(centerLat, z))
  const tx = wx / unitsPerTile + tileX + 0.5
  const ty = wz / unitsPerTile + tileY + 0.5
  return { lat: tileYToLat(ty, z), lng: tileXToLon(tx, z) }
}

function parseNum(...keys: any[]): number | undefined {
  for (const v of keys) {
    const n = parseFloat(String(v ?? ''))
    if (!isNaN(n) && isFinite(n)) return n
  }
  return undefined
}


function updateWaterMarkerPositions() {
  if (!camera || !renderer || !THREE || !waterSources.value.length) {
    if (waterScreenPos.value.length) waterScreenPos.value = []
    return
  }
  const rect = renderer.domElement.getBoundingClientRect()
  waterScreenPos.value = waterSources.value.map(s => {
    const v = new THREE.Vector3(s.worldX, 0.5, s.worldZ)
    v.project(camera)
    return {
      id: s.id,
      x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
      visible: v.z < 1,
      source: s,
    }
  })
}

function clearWaterLayer() {
  if (waterGroup) { scene?.remove(waterGroup); waterGroup = null }
  waterSources.value = []
  waterScreenPos.value = []
  selectedWater.value = null
}

async function loadWaterLayer() {
  if (!scene || !THREE || !mapSurfaceMesh) return
  waterLoading.value = true
  ++waterLoadToken
  const token = waterLoadToken
  try {
    const z    = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
    const half = Math.floor(MAP_TILE_SPAN / 2)
    const tX   = Math.floor(lonToTileX(mapLng.value, z))
    const tY   = Math.floor(latToTileY(mapLat.value, z))
    const north = tileYToLat(tY - half, z)
    const south = tileYToLat(tY + half + 1, z)
    const west  = tileXToLon(tX - half, z)
    const east  = tileXToLon(tX + half + 1, z)
    const bbox  = `${south},${west},${north},${east}`

    // ── Fetch OSM water features ──
    const q = `[out:json][timeout:20];(
      way["natural"="water"](${bbox});>;
      way["water"~"^(reservoir|lake|pond)$"](${bbox});>;
      way["landuse"="reservoir"](${bbox});>;
      node["waterway"="dam"](${bbox});
      way["waterway"="dam"](${bbox});>;
      node["natural"="water"]["water"="reservoir"](${bbox});
    );out body;`
    let data: any = null
    for (const mirror of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
      try {
        const res = await fetch(`${mirror}?data=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(25_000) })
        if (res.ok) { data = await res.json(); break }
      } catch { /* try next mirror */ }
    }
    if (!data) { console.warn('Water: Overpass unavailable'); data = { elements: [] } }
    if (token !== waterLoadToken) return

    // ── Fetch Thai dam API (parallel with OSM) ──
    const damRecs = await fetchThaiDamData()

    // ── Build node map ──
    const nodeMap = new Map<number, { lat: number; lon: number; tags: any }>()
    for (const el of data.elements) {
      if (el.type === 'node') nodeMap.set(el.id, { lat: el.lat, lon: el.lon, tags: el.tags })
    }

    clearWaterLayer()
    waterGroup = new THREE.Group()
    scene.add(waterGroup)

    const waterMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9, transparent: true, opacity: 0.50,
      side: THREE.DoubleSide, depthWrite: false,
    })
    const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 1 })
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 1.2,
    })

    const sources: WaterSource[] = []

    for (const el of data.elements) {
      if (token !== waterLoadToken) return
      const isWaterWay = el.type === 'way' && el.nodes?.length >= 3 && (
        el.tags?.natural === 'water' || el.tags?.water ||
        el.tags?.landuse === 'reservoir' || el.tags?.waterway === 'dam'
      )
      if (isWaterWay) {
        const pts2: THREE.Vector2[] = []
        const pts3: THREE.Vector3[] = []
        for (const nid of el.nodes) {
          const nd = nodeMap.get(nid)
          if (!nd) continue
          const wp = latLngToWorld(nd.lat, nd.lon, mapLat.value, mapLng.value, z)
          pts2.push(new THREE.Vector2(wp.x, -wp.z))
          pts3.push(new THREE.Vector3(wp.x, 0.018, wp.z))
        }
        if (pts2.length < 3) continue

        // Water surface
        const shape = new THREE.Shape(pts2)
        const geo = new THREE.ShapeGeometry(shape)
        geo.rotateX(-Math.PI / 2)
        const mesh = new THREE.Mesh(geo, waterMat.clone())
        mesh.position.y = 0.018
        waterGroup.add(mesh)

        // Border outline
        const bGeo = new THREE.BufferGeometry().setFromPoints([...pts3, pts3[0]])
        waterGroup.add(new THREE.Line(bGeo, borderMat))

        const cx = pts2.reduce((s, p) => s + p.x, 0) / pts2.length
        const cz = pts2.reduce((s, p) => s - p.y, 0) / pts2.length
        const name = el.tags?.name || el.tags?.['name:th'] || el.tags?.['name:en'] || ''
        const type = el.tags?.water || el.tags?.landuse || el.tags?.natural || 'water'

        // Spatial match: find nearest dam within 5 km of water body center
        const centerLL = worldToLatLng(cx, cz, mapLat.value, mapLng.value, z)
        const dam = matchDamByLatLng(centerLL.lat, centerLL.lng, damRecs, 5)

        // OSM fallback capacity tag (m³ → MCM)
        const osmCapM3 = parseNum(el.tags?.['capacity:storage'])
        const osmCapMCM = osmCapM3 != null ? osmCapM3 / 1_000_000 : undefined

        sources.push({
          id: el.id, name: dam?.name_th || name, type,
          worldX: cx, worldZ: cz,
          lat: centerLL.lat, lng: centerLL.lng,
          pct:         dam?.pct,
          storedMCM:   dam?.storedMCM,
          capacityMCM: dam?.capacityMCM ?? osmCapMCM,
          levelM:      dam?.levelM ?? parseNum(el.tags?.ele),
          inflowMCM:   dam?.inflowMCM,
          releasedMCM: dam?.releasedMCM,
          province:    dam?.province,
        })

        // Marker pin at center
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8), markerMat.clone())
        pin.position.set(cx, 0.36, cz)
        waterGroup.add(pin)
      }

      // Dam node (point feature)
      if (el.type === 'node' && (el.tags?.waterway === 'dam' || (el.tags?.water === 'reservoir' && el.tags?.name))) {
        const wp = latLngToWorld(el.lat, el.lon, mapLat.value, mapLng.value, z)
        const name = el.tags?.name || el.tags?.['name:th'] || 'เขื่อน'
        const dam = matchDamByLatLng(el.lat, el.lon, damRecs, 5)
        sources.push({
          id: el.id, name: dam?.name_th || name, type: el.tags?.waterway || 'dam',
          worldX: wp.x, worldZ: wp.z,
          lat: el.lat, lng: el.lon,
          pct:         dam?.pct,
          storedMCM:   dam?.storedMCM,
          capacityMCM: dam?.capacityMCM,
          levelM:      dam?.levelM ?? parseNum(el.tags?.ele),
          inflowMCM:   dam?.inflowMCM,
          releasedMCM: dam?.releasedMCM,
          province:    dam?.province,
        })
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), markerMat.clone())
        pin.position.set(wp.x, 0.5, wp.z)
        waterGroup.add(pin)
      }
    }

    // ── Also add dam API stations not found in OSM (within map bbox) ──
    const osmIds = new Set(sources.map(s => `${s.lat?.toFixed(3)},${s.lng?.toFixed(3)}`))
    for (const r of damRecs) {
      if (r.lat < south || r.lat > north || r.lng < west || r.lng > east) continue
      const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`
      if (osmIds.has(key)) continue  // already matched
      const wp = latLngToWorld(r.lat, r.lng, mapLat.value, mapLng.value, z)
      sources.push({
        id: -r.id, name: r.name_th || r.name_en, type: 'dam',
        worldX: wp.x, worldZ: wp.z,
        lat: r.lat, lng: r.lng,
        pct: r.pct, storedMCM: r.storedMCM, capacityMCM: r.capacityMCM,
        levelM: r.levelM, inflowMCM: r.inflowMCM, releasedMCM: r.releasedMCM,
        province: r.province,
      })
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), markerMat.clone())
      pin.position.set(wp.x, 0.5, wp.z)
      waterGroup.add(pin)
    }

    waterSources.value = sources
    waterLastUpdate.value = new Date().toLocaleTimeString('th-TH')
  } catch (e) {
    console.warn('Water layer failed:', e)
  } finally {
    if (token === waterLoadToken) waterLoading.value = false
  }
}

function toggleWaterLayer() {
  waterVisible.value = !waterVisible.value
  if (waterVisible.value) loadWaterLayer()
  else clearWaterLayer()
}

// ── Water Pipe Layer ─────────────────────────────────────────────
function clearWaterPipeLayer() {
  if (waterPipeGroup) { scene?.remove(waterPipeGroup); waterPipeGroup = null }
  waterPipeNodes.value = []
  waterPipeSegs.value  = []
  wpNodeScreenPos.value = []
  wpSegScreenPos.value  = []
  selectedWPNode.value  = null
}

async function loadWaterPipeLayer() {
  if (!scene || !THREE || !mapSurfaceMesh) return
  waterPipeLoading.value = true
  ++waterPipeLoadToken
  const token = waterPipeLoadToken
  try {
    const data = await $fetch<any>('/api/water-supply')
    if (token !== waterPipeLoadToken) return
    clearWaterPipeLayer()
    const z = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
    waterPipeGroup = new THREE.Group()
    scene.add(waterPipeGroup)

    // ── Shared materials ──
    const matWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const matBlue  = new THREE.MeshBasicMaterial({ color: 0x1a55cc })

    // ── Helper: วาด + (cross) marker ──
    function addCrossMarker(x: number, z: number, color: number, size = 0.5) {
      const mat = new THREE.MeshBasicMaterial({ color })
      const h = new THREE.Mesh(new THREE.BoxGeometry(size, 0.07, size * 0.28), mat)
      h.position.set(x, 0.22, z)
      const v = new THREE.Mesh(new THREE.BoxGeometry(size * 0.28, 0.07, size), mat)
      v.position.set(x, 0.22, z)
      // outer ring
      const ring = new THREE.Mesh(
        Object.assign(new THREE.RingGeometry(size * 0.52, size * 0.62, 20), { }).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      )
      ring.position.set(x, 0.23, z)
      waterPipeGroup.add(h, v, ring)
    }

    // ── Helper: วาด X (valve) marker ──
    function addValveMarker(x: number, z: number, color: number, size = 0.45) {
      const mat = new THREE.MeshBasicMaterial({ color })
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(size, 0.07, size * 0.25), mat)
      b1.position.set(x, 0.22, z); b1.rotation.y = Math.PI / 4
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(size, 0.07, size * 0.25), mat)
      b2.position.set(x, 0.22, z); b2.rotation.y = -Math.PI / 4
      const ring = new THREE.Mesh(
        Object.assign(new THREE.RingGeometry(size * 0.52, size * 0.65, 20), {}).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      )
      ring.position.set(x, 0.23, z)
      waterPipeGroup.add(b1, b2, ring)
    }

    // ── Helper: M marker (meter disc) ──
    function addMMarker(x: number, z: number) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 12), matBlue.clone())
      disc.position.set(x, 0.1, z)
      const ring = new THREE.Mesh(
        Object.assign(new THREE.RingGeometry(0.10, 0.145, 12), {}).rotateX(-Math.PI / 2),
        matWhite.clone()
      )
      ring.position.set(x, 0.12, z)
      waterPipeGroup.add(disc, ring)
    }

    // ── Build node map & draw node markers ──
    const nodeMap = new Map<string, WPNode>()
    const nodes: WPNode[] = []
    for (const n of data.nodes) {
      const wp = latLngToWorld(n.lat, n.lng, mapLat.value, mapLng.value, z)
      const wn: WPNode = { id: n.id, name: n.name, type: n.type, status: n.status, worldX: wp.x, worldZ: wp.z }
      nodeMap.set(n.id, wn)
      nodes.push(wn)
      const color = n.status === 'critical' ? 0xe05050 : n.status === 'warning' ? 0xe0a030 : 0xee3333
      if (['source', 'treatment', 'storage'].includes(n.type)) {
        addCrossMarker(wp.x, wp.z, color, 0.52)
      } else {
        addValveMarker(wp.x, wp.z, n.status === 'critical' ? 0xe05050 : 0xe0a030, 0.46)
      }
    }
    waterPipeNodes.value = nodes

    // ── Draw pipes as tubes + M markers ──
    const segs: WPSeg[] = []
    for (const p of data.pipes) {
      const fn = nodeMap.get(p.from)
      const tn = nodeMap.get(p.to)
      if (!fn || !tn) continue

      const pipeColor = p.status === 'leaking' ? 0xe0a030 : p.status === 'blocked' ? 0xe05050 : 0x00ccff
      const radius = Math.max(0.05, Math.min(0.14, p.diameter_mm / 4200))

      // Tube (หนา)
      const start = new THREE.Vector3(fn.worldX, 0.04, fn.worldZ)
      const end   = new THREE.Vector3(tn.worldX, 0.04, tn.worldZ)
      const curve = new THREE.LineCurve3(start, end)
      const tubeGeo = new THREE.TubeGeometry(curve, 1, radius, 7, false)
      waterPipeGroup.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: pipeColor })))

      // M markers กระจายตลอดท่อ
      const segLen = start.distanceTo(end)
      const spacing = 0.65
      const mCount  = Math.max(1, Math.floor(segLen / spacing))
      for (let i = 1; i < mCount; i++) {
        const t = i / mCount
        addMMarker(fn.worldX + (tn.worldX - fn.worldX) * t, fn.worldZ + (tn.worldZ - fn.worldZ) * t)
      }

      // Label midpoint
      const diamIn = p.diameter_mm >= 25 ? Math.round(p.diameter_mm / 25.4) + '"' : p.diameter_mm + 'mm'
      const mat_s  = ({ pvc: 'CAS', ductile_iron: 'DIP', steel: 'STL', hdpe: 'HDPE' } as any)[p.material] ?? p.material.toUpperCase()
      segs.push({ id: p.id, label: `${diamIn} ${mat_s}`, status: p.status, midX: (fn.worldX + tn.worldX) / 2, midZ: (fn.worldZ + tn.worldZ) / 2 })
    }
    waterPipeSegs.value = segs
  } catch (e) {
    console.warn('Water pipe layer failed:', e)
  } finally {
    if (token === waterPipeLoadToken) waterPipeLoading.value = false
  }
}

function updateWaterPipeScreenPos() {
  if (!camera || !renderer || !THREE || (!waterPipeNodes.value.length && !waterPipeSegs.value.length)) {
    if (wpNodeScreenPos.value.length) wpNodeScreenPos.value = []
    if (wpSegScreenPos.value.length)  wpSegScreenPos.value  = []
    return
  }
  const rect = renderer.domElement.getBoundingClientRect()
  const toScreen = (wx: number, wz: number, wy = 0.25) => {
    const v = new THREE.Vector3(wx, wy, wz)
    v.project(camera)
    return { x: (v.x * 0.5 + 0.5) * rect.width + rect.left, y: (-v.y * 0.5 + 0.5) * rect.height + rect.top, visible: v.z < 1 }
  }
  wpNodeScreenPos.value = waterPipeNodes.value.map(n => ({ id: n.id, node: n, ...toScreen(n.worldX, n.worldZ, 0.35) }))
  wpSegScreenPos.value  = waterPipeSegs.value.map(s  => ({ id: s.id, seg: s,  ...toScreen(s.midX, s.midZ, 0.1) }))
}

function toggleWaterPipeLayer() {
  waterPipeVisible.value = !waterPipeVisible.value
  if (waterPipeVisible.value) loadWaterPipeLayer()
  else clearWaterPipeLayer()
}

// ── Water Pipe Drawing Tool functions ────────────────────────────
function ensureWPUserGroup() {
  if (!scene || !THREE) return
  if (!wpUserGroup) { wpUserGroup = new THREE.Group(); scene.add(wpUserGroup) }
}

function wpPipeColor() {
  return wpToolStatus.value === 'leaking' ? 0xe0a030 : wpToolStatus.value === 'blocked' ? 0xe05050 : 0x00ccff
}

function wpDrawUserPipe(pts: {x:number;z:number}[]) {
  if (!THREE || !wpUserGroup || pts.length < 2) return
  const color  = wpPipeColor()
  const radius = Math.max(0.05, Math.min(0.14, wpToolDiam.value / 4200))
  const start  = new THREE.Vector3(pts[0].x, 0.04, pts[0].z)
  const end    = new THREE.Vector3(pts[pts.length-1].x, 0.04, pts[pts.length-1].z)
  const curve  = new THREE.LineCurve3(start, end)
  wpUserGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,1,radius,7,false), new THREE.MeshBasicMaterial({ color })))
  // M markers
  const segLen  = start.distanceTo(end)
  const mCount  = Math.max(1, Math.floor(segLen / 0.65))
  const matDisc = new THREE.MeshBasicMaterial({ color: 0x1a55cc })
  const matRing = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  for (let i = 1; i < mCount; i++) {
    const t  = i / mCount
    const mx = pts[0].x + (pts[pts.length-1].x - pts[0].x) * t
    const mz = pts[0].z + (pts[pts.length-1].z - pts[0].z) * t
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.025,12), matDisc.clone())
    disc.position.set(mx, 0.1, mz)
    const ring = new THREE.Mesh(Object.assign(new THREE.RingGeometry(0.10,0.145,12), {}).rotateX(-Math.PI/2), matRing.clone())
    ring.position.set(mx, 0.12, mz)
    wpUserGroup.add(disc, ring)
  }
}

function wpDrawUserNode(x: number, z: number, type: 'valve'|'hydrant'|'meter') {
  if (!THREE || !wpUserGroup) return
  const mat = new THREE.MeshBasicMaterial({ color: type === 'hydrant' ? 0xee3333 : type === 'valve' ? 0xe0a030 : 0x1a55cc })
  if (type === 'hydrant') {
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.07,0.14), mat)
    hBar.position.set(x, 0.22, z)
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.07,0.52), mat)
    vBar.position.set(x, 0.22, z)
    const ring = new THREE.Mesh(Object.assign(new THREE.RingGeometry(0.27,0.32,20),{}).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color: 0xee3333, side: THREE.DoubleSide }))
    ring.position.set(x, 0.23, z)
    wpUserGroup.add(hBar, vBar, ring)
  } else if (type === 'valve') {
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.46,0.07,0.14), mat); b1.position.set(x,0.22,z); b1.rotation.y = Math.PI/4
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.46,0.07,0.14), mat); b2.position.set(x,0.22,z); b2.rotation.y = -Math.PI/4
    const ring = new THREE.Mesh(Object.assign(new THREE.RingGeometry(0.25,0.32,20),{}).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color: 0xe0a030, side: THREE.DoubleSide }))
    ring.position.set(x, 0.23, z)
    wpUserGroup.add(b1, b2, ring)
  } else {
    // meter — blue disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.06,16), mat)
    disc.position.set(x, 0.2, z)
    const ring = new THREE.Mesh(Object.assign(new THREE.RingGeometry(0.18,0.24,16),{}).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color: 0x1a55cc, side: THREE.DoubleSide }))
    ring.position.set(x, 0.22, z)
    wpUserGroup.add(disc, ring)
  }
}

function startWPDraw(cx: number, cy: number) {
  const p = getGroundPoint(cx, cy)
  if (!p || !controls) return false
  wpDrawing = true
  wpDrawPoints.length = 0
  wpDrawPoints.push(p.clone())
  if (controls) controls.enabled = false
  return true
}

function updateWPDraw(cx: number, cy: number) {
  if (!wpDrawing || !THREE || !scene) return
  const p = getGroundPoint(cx, cy)
  if (!p) return
  const last = wpDrawPoints[wpDrawPoints.length - 1]
  if (last && p.distanceTo(last) < 0.1) return
  wpDrawPoints.push(p.clone())
  // preview line
  if (wpPreviewLine) { scene.remove(wpPreviewLine); wpPreviewLine = null }
  if (wpDrawPoints.length >= 2) {
    const geo = new THREE.BufferGeometry().setFromPoints(wpDrawPoints)
    wpPreviewLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: wpPipeColor() }))
    scene.add(wpPreviewLine)
  }
}

function stopWPDraw(commit: boolean) {
  if (wpPreviewLine) { scene?.remove(wpPreviewLine); wpPreviewLine = null }
  if (commit && wpDrawPoints.length >= 2) {
    ensureWPUserGroup()
    const id   = `UP-${++wpUserIdSeed}`
    const pts  = wpDrawPoints.map(p => ({ x: p.x, z: p.z }))
    const midX = (pts[0].x + pts[pts.length-1].x) / 2
    const midZ = (pts[0].z + pts[pts.length-1].z) / 2
    const diam = wpToolDiam.value >= 25 ? Math.round(wpToolDiam.value / 25.4) + '"' : wpToolDiam.value + 'mm'
    const mat_s: any = { pvc:'CAS', ductile_iron:'DIP', hdpe:'HDPE', steel:'STL' }
    const label = `${diam} ${mat_s[wpToolMat.value] ?? wpToolMat.value.toUpperCase()}`
    wpUserPipes.value.push({ id, pts, diam: wpToolDiam.value, mat: wpToolMat.value, status: wpToolStatus.value, label, midX, midZ })
    wpDrawUserPipe(pts)
  }
  wpDrawPoints.length = 0
  wpDrawing = false
  if (controls) controls.enabled = true
}

function placeWPNode(cx: number, cy: number) {
  const p = getGroundPoint(cx, cy)
  if (!p) return
  ensureWPUserGroup()
  const id = `UN-${++wpUserIdSeed}`
  wpUserNodes.value.push({ id, type: wpToolMode.value as any, x: p.x, z: p.z })
  wpDrawUserNode(p.x, p.z, wpToolMode.value as any)
}

function undoWPLast() {
  // undo last pipe or node — rebuild group
  if (wpUserPipes.value.length === 0 && wpUserNodes.value.length === 0) return
  if (wpUserNodes.value.length > 0 && (
    wpUserPipes.value.length === 0 ||
    parseInt(wpUserNodes.value[wpUserNodes.value.length-1].id.split('-')[1]) >
    parseInt(wpUserPipes.value[wpUserPipes.value.length-1].id.split('-')[1])
  )) {
    wpUserNodes.value.pop()
  } else {
    wpUserPipes.value.pop()
  }
  rebuildWPUserGroup()
}

function clearWPUser() {
  wpUserPipes.value = []
  wpUserNodes.value = []
  if (wpUserGroup) { scene?.remove(wpUserGroup); wpUserGroup = null }
  wpUserPipeScreen.value = []
  wpUserNodeScreen.value = []
}

function rebuildWPUserGroup() {
  if (wpUserGroup) { scene?.remove(wpUserGroup); wpUserGroup = null }
  wpUserPipeScreen.value = []
  wpUserNodeScreen.value = []
  if (!scene || !THREE) return
  wpUserGroup = new THREE.Group(); scene.add(wpUserGroup)
  for (const p of wpUserPipes.value) wpDrawUserPipe(p.pts)
  for (const n of wpUserNodes.value) wpDrawUserNode(n.x, n.z, n.type)
}

function updateWPUserScreenPos() {
  if (!camera || !renderer || !THREE) return
  const rect = renderer.domElement.getBoundingClientRect()
  const toScreen = (wx: number, wz: number, wy = 0.2) => {
    const v = new THREE.Vector3(wx, wy, wz)
    v.project(camera)
    return { x: (v.x*.5+.5)*rect.width+rect.left, y: (-v.y*.5+.5)*rect.height+rect.top, visible: v.z < 1 }
  }
  wpUserPipeScreen.value = wpUserPipes.value.map(p => ({ id:p.id, pipe:p, ...toScreen(p.midX, p.midZ, 0.1) }))
  wpUserNodeScreen.value = wpUserNodes.value.map(n => ({ id:n.id, node:n, ...toScreen(n.x, n.z, 0.35) }))
}

// ── อบต. Boundary Layer ──────────────────────────────────────────
function clearTambonLayer() {
  if (tambonGroup) { scene?.remove(tambonGroup); tambonGroup = null }
  tambonAreas.value = []
  tambonLabelPos.value = []
}

function buildRingsFromWayIds(
  wayIds: number[],
  wayNodeMap: Map<number, number[]>,
  nodeMap: Map<number, { lat: number; lon: number }>
): { lat: number; lon: number }[][] {
  const ways = wayIds.map(id => ({ id, nodes: wayNodeMap.get(id) || [] })).filter(w => w.nodes.length > 0)
  if (!ways.length) return []
  const rings: { lat: number; lon: number }[][] = []
  const used = new Set<number>()
  while (used.size < ways.length) {
    const startWay = ways.find(w => !used.has(w.id))
    if (!startWay) break
    used.add(startWay.id)
    let chain = [...startWay.nodes]
    let changed = true
    while (changed) {
      changed = false
      const head = chain[0], tail = chain[chain.length - 1]
      for (const w of ways) {
        if (used.has(w.id) || !w.nodes.length) continue
        const wn = w.nodes, wRev = [...wn].reverse()
        if (wn[0] === tail)            { chain.push(...wn.slice(1));    used.add(w.id); changed = true; break }
        if (wRev[0] === tail)          { chain.push(...wRev.slice(1));   used.add(w.id); changed = true; break }
        if (wn[wn.length-1] === head)  { chain.unshift(...wn.slice(0,-1)); used.add(w.id); changed = true; break }
        if (wRev[wRev.length-1]===head){ chain.unshift(...wRev.slice(0,-1)); used.add(w.id); changed = true; break }
      }
    }
    const ring = chain.map(nid => nodeMap.get(nid)).filter(Boolean) as { lat: number; lon: number }[]
    if (ring.length >= 2) rings.push(ring)
  }
  return rings
}

async function overpassQuery(query: string) {
  const res = await fetch('/api/overpass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Overpass error ${res.status}: ${await res.text()}`)
  return res.json()
}

async function loadTambonLayer() {
  if (!THREE || !scene) return
  const myToken = ++tambonLoadToken
  tambonLoading.value = true
  tambonError.value = ""
  clearTambonLayer()
  const z = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
  try {
    // Use ±0.25° bbox (~55 km) which covers a typical Thai amphoe
    const pad = 0.25
    const south = mapLat.value - pad, west = mapLng.value - pad
    const north = mapLat.value + pad, east = mapLng.value + pad
    const bbox = `${south},${west},${north},${east}`

    const data = await overpassQuery(
      `[out:json][timeout:60];relation["boundary"="administrative"]["admin_level"~"^(7|8|9|10)$"](${bbox});out body;>;out skel qt;`
    )
    if (myToken !== tambonLoadToken) { tambonLoading.value = false; return }

    const nodeMap = new Map<number, { lat: number; lon: number }>()
    const wayNodeMap = new Map<number, number[]>()
    for (const el of data.elements) {
      if (el.type === 'node') nodeMap.set(el.id, { lat: el.lat, lon: el.lon })
      if (el.type === 'way')  wayNodeMap.set(el.id, el.nodes || [])
    }

    tambonGroup = new THREE.Group()
    const areas: TambonArea[] = []
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 })
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })

    for (const el of data.elements) {
      if (el.type !== 'relation') continue
      const name = el.tags?.['name:th'] || el.tags?.name || el.tags?.local_name || `อบต. ${el.id}`
      const outerWayIds = (el.members || [])
        .filter((m: any) => m.type === 'way' && (m.role === 'outer' || m.role === ''))
        .map((m: any) => m.ref as number)
      const rings = buildRingsFromWayIds(outerWayIds, wayNodeMap, nodeMap)
      if (!rings.length) continue
      let sumX = 0, sumZ = 0, ptCount = 0
      for (const ring of rings) {
        if (ring.length < 2) continue
        const pts3: number[] = []
        const pts2: { x: number; z: number }[] = []
        for (const pt of ring) {
          const wp = latLngToWorld(pt.lat, pt.lon, mapLat.value, mapLng.value, z)
          pts3.push(wp.x, 0.04, wp.z)
          pts2.push(wp)
          sumX += wp.x; sumZ += wp.z; ptCount++
        }
        // Outline
        const lineGeo = new THREE.BufferGeometry()
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts3, 3))
        tambonGroup.add(new THREE.Line(lineGeo, lineMat))
        // Fill polygon (simple fan triangulation from centroid)
        if (pts2.length >= 3) {
          const cx2 = pts2.reduce((s, p) => s + p.x, 0) / pts2.length
          const cz2 = pts2.reduce((s, p) => s + p.z, 0) / pts2.length
          const verts: number[] = []
          for (let i = 0; i < pts2.length - 1; i++) {
            verts.push(cx2, 0.03, cz2, pts2[i].x, 0.03, pts2[i].z, pts2[i+1].x, 0.03, pts2[i+1].z)
          }
          const fillGeo = new THREE.BufferGeometry()
          fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
          tambonGroup.add(new THREE.Mesh(fillGeo, fillMat))
        }
      }
      if (ptCount > 0) areas.push({ id: el.id, name, midX: sumX / ptCount, midZ: sumZ / ptCount })
    }
    if (myToken !== tambonLoadToken) { tambonLoading.value = false; return }
    scene.add(tambonGroup)
    tambonAreas.value = areas
  } catch (e: any) {
    console.error('Tambon layer error:', e)
    if (myToken === tambonLoadToken) tambonError.value = e?.message || 'โหลดข้อมูลไม่สำเร็จ'
  }
  if (myToken === tambonLoadToken) tambonLoading.value = false
}

function updateTambonLabelPos() {
  if (!camera || !renderer || !THREE || !tambonAreas.value.length) {
    if (tambonLabelPos.value.length) tambonLabelPos.value = []
    return
  }
  const rect = renderer.domElement.getBoundingClientRect()
  tambonLabelPos.value = tambonAreas.value.map(a => {
    const v = new THREE.Vector3(a.midX, 0.04, a.midZ)
    v.project(camera)
    return { id: a.id, name: a.name, x: (v.x*.5+.5)*rect.width+rect.left, y: (-v.y*.5+.5)*rect.height+rect.top, visible: v.z < 1 }
  })
}

function toggleTambonLayer() {
  tambonVisible.value = !tambonVisible.value
  if (tambonVisible.value) loadTambonLayer()
  else clearTambonLayer()
}
// ───────────────────────────────────────────────────────────────

const localFileMap = new Map<string, string>()
const modelSourceMap = new Map<number, string>()
const pickedModelRootFiles = ref<string[]>([])
const pickedSourceFiles = ref<{ relPath: string; name: string; size: number; type: string; file: File }[]>([])
const loadedProjectAssets = ref<any | null>(null)

async function importWithFallback(paths: string[]) {
  let lastErr: any
  for (const p of paths) {
    try {
      return await import(/* @vite-ignore */ p)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error("CDN import failed")
}

async function initThree() {
  if (viewerReady.value) return

  THREE = await importWithFallback([
    "https://esm.sh/three@0.160.0",
    "https://unpkg.com/three@0.160.0/build/three.module.js?module",
  ])
  loadingSteps.value[0].done = true
  const { OrbitControls } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js?module",
  ])
  const { GLTFLoader } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?module",
  ])
  const { DRACOLoader } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js?module",
  ])
  const { KTX2Loader } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/loaders/KTX2Loader.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/loaders/KTX2Loader.js?module",
  ])
  const { MeshoptDecoder } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js?module",
  ])
  const { RoomEnvironment } = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js?module",
  ])
  const bgUtils = await importWithFallback([
    "https://esm.sh/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js",
    "https://unpkg.com/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js?module",
  ])
  mergeGeometries = bgUtils.mergeGeometries
  loadingSteps.value[1].done = true

  if (!viewport.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf2f5f8)
  scene.fog = new THREE.Fog(0xf2f5f8, 260, 1800)

  camera = new THREE.PerspectiveCamera(48, 1, 0.01, 2000)
  camera.position.set(...defaultCamPos)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.96
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  viewport.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.target.set(...defaultTarget)
  controls.minDistance = 0.1
  controls.maxDistance = 50000
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI / 2 - 0.01

  hemiLight = new THREE.HemisphereLight(0xeff6ff, 0x7190aa, 1.12)
  scene.add(hemiLight)

  sunLight = new THREE.DirectionalLight(0xffffff, 1.3)
  sunLight.position.set(12, 18, 10)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  sunLight.shadow.camera.near = 0.5
  sunLight.shadow.camera.far = 180
  scene.add(sunLight)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
      color: 0xd2dbe6,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.01,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  ground.receiveShadow = true
  scene.add(ground)
  groundMesh = ground
  addMapBackdrop()
  ensureSelectedModelMarker()
  await applyMapLocation()
  roadGroup = new THREE.Group()
  scene.add(roadGroup)

  pmrem = new THREE.PMREMGenerator(renderer)
  const env = new RoomEnvironment(renderer)
  scene.environment = pmrem.fromScene(env).texture
  applyDayNightMode()

  loadingManager = new THREE.LoadingManager()
  loadingManager.setURLModifier((url: string) => {
    const clean = decodeURIComponent(url).replace(/^(\.\/|\/)+/, "")
    const byFull = localFileMap.get(clean)
    if (byFull) return byFull

    const tail = clean.split("/").pop() || clean
    const byName = localFileMap.get(tail)
    if (byName) return byName
    return url
  })

  loader = new GLTFLoader(loadingManager)

  const draco = new DRACOLoader()
  draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
  loader.setDRACOLoader(draco)

  const ktx2 = new KTX2Loader()
  ktx2.setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/")
  ktx2.detectSupport(renderer)
  loader.setKTX2Loader(ktx2)

  loader.setMeshoptDecoder(MeshoptDecoder)
  loadingSteps.value[2].done = true

  fitRenderer()

  resizeObserver = new ResizeObserver(() => fitRenderer())
  resizeObserver.observe(viewport.value)
  renderer.domElement.addEventListener("pointerdown", onViewportPointerDown)
  renderer.domElement.addEventListener("pointermove", onViewportPointerMove)
  renderer.domElement.addEventListener("pointerup", onViewportPointerUp)
  renderer.domElement.addEventListener("pointercancel", onViewportPointerCancel)
  renderer.domElement.addEventListener("pointerleave", onViewportPointerCancel)
  renderer.domElement.addEventListener("contextmenu", onViewportContextMenu)

  const animate = () => {
    rafId = requestAnimationFrame(animate)
    controls.update()
    updateWallTransparencyByCamera()
    updateSelectedModelMarker()
    updateWalkMovement()
    updateCctvMarkerPositions()
    updateWaterMarkerPositions()
    updateWaterPipeScreenPos()
    updateWPUserScreenPos()
    updateTambonLabelPos()
    // Update compass: N arrow rotation relative to camera look direction
    if (camera && controls) {
      const dx = controls.target.x - camera.position.x
      const dz = controls.target.z - camera.position.z
      const len = Math.sqrt(dx * dx + dz * dz)
      if (len > 0.001) compassAngle.value = Math.atan2(dx / len, -(dz / len)) * 180 / Math.PI
    }
    renderer.render(scene, camera)
  }
  animate()
  loadingSteps.value[3].done = true
  await new Promise(r => setTimeout(r, 400))
  viewerReady.value = true
}

function addNightObjects() {
  if (!scene || !THREE) return
  if (!nightStars) {
    // Star field — random points on upper hemisphere
    const starCount = 2400
    const pos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - Math.random() * 1.0) // upper hemi only
      const r = 900 + Math.random() * 80
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    nightStars = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 1.6, sizeAttenuation: false,
      transparent: true, opacity: 0.82, depthWrite: false,
    }))
    scene.add(nightStars)
  }

  if (!cityGlowLight) {
    // Warm amber glow from ground — simulates city light pollution
    cityGlowLight = new THREE.PointLight(0xff6825, 0.55, 600, 1.2)
    cityGlowLight.position.set(0, -3, 0)
    scene.add(cityGlowLight)
  }

  if (!moonMesh) {
    // Small moon disc in the sky
    const moonGeo = new THREE.SphereGeometry(14, 24, 24)
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8edf8, fog: false })
    moonMesh = new THREE.Mesh(moonGeo, moonMat)
    moonMesh.position.set(-340, 420, -620)
    scene.add(moonMesh)
    // Subtle halo around moon
    const haloGeo = new THREE.SphereGeometry(22, 20, 20)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xd0dcff, transparent: true, opacity: 0.07,
      fog: false, depthWrite: false,
    })
    moonMesh.add(new THREE.Mesh(haloGeo, haloMat))
  }

  if (nightStars) nightStars.visible = true
  if (cityGlowLight) cityGlowLight.visible = true
  if (moonMesh) moonMesh.visible = true
}

function removeNightObjects() {
  if (nightStars) nightStars.visible = false
  if (cityGlowLight) cityGlowLight.visible = false
  if (moonMesh) moonMesh.visible = false
}

function applyDayNightMode() {
  if (!scene || !THREE || !renderer) return
  const isDay = dayMode.value

  // Sky & atmosphere
  scene.background = new THREE.Color(isDay ? 0xf2f5f8 : 0x03070f)
  scene.fog = new THREE.FogExp2(isDay ? 0xd8e8f4 : 0x04091a, isDay ? 0.00055 : 0.00042)

  // Tone mapping — cinematic night
  renderer.toneMappingExposure = isDay ? 0.96 : 0.52

  // Hemisphere: sky & ground bounce — night must be near-zero so only lit areas glow
  if (hemiLight) {
    hemiLight.color.setHex(isDay ? 0xeff6ff : 0x0a1a40)        // sky
    hemiLight.groundColor.setHex(isDay ? 0x7190aa : 0x200a00)  // ground: faint warmth
    hemiLight.intensity = isDay ? 1.12 : 0.06
  }

  // Directional: sun → moon (very dim, just barely shapes silhouettes)
  if (sunLight) {
    sunLight.color.setHex(isDay ? 0xffffff : 0x8899cc)
    sunLight.intensity = isDay ? 1.3 : 0.07
    sunLight.position.set(isDay ? 12 : -10, isDay ? 18 : 14, isDay ? 10 : -16)
  }

  // Map surface: darken tiles to simulate night city view
  if (mapSurfaceMesh) {
    mapSurfaceMesh.material.color.setHex(isDay ? 0xffffff : 0x1a2d50)
  }

  if (isDay) {
    removeNightObjects()
  } else {
    addNightObjects()
  }
}

function toggleDayNightMode() {
  dayMode.value = !dayMode.value
  applyDayNightMode()
}

function addMapBackdrop() {
  if (!scene || !THREE) return

  const helper = new THREE.GridHelper(500, 50, 0xbfd2e6, 0xcadbec)
  helper.position.y = -0.005
  helper.material.transparent = true
  helper.material.opacity = 0.09
  scene.add(helper)

  // Subdivided plane so terrain elevation can be applied per-vertex
  const mapSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SURFACE_SIZE, MAP_SURFACE_SIZE, TERRAIN_SEG, TERRAIN_SEG),
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      fog: false,
    }),
  )
  mapSurface.rotation.x = -Math.PI / 2
  mapSurface.position.set(0, 0.002, 0)
  mapSurface.receiveShadow = true
  scene.add(mapSurface)
  mapSurfaceMesh = mapSurface
}

function lonToTileX(lon: number, z: number) {
  return ((lon + 180) / 360) * 2 ** z
}

function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
}

function normalizeTileX(x: number, z: number) {
  const n = 2 ** z
  return ((x % n) + n) % n
}

function clampTileY(y: number, z: number) {
  const n = 2 ** z
  return Math.max(0, Math.min(n - 1, y))
}

function normalizeTileDelta(delta: number, z: number) {
  const n = 2 ** z
  let d = Number(delta) || 0
  while (d > n * 0.5) d -= n
  while (d < -n * 0.5) d += n
  return d
}

function loadTileImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Tile load failed: ${url}`))
    img.src = url
  })
}

async function loadTileWithFallback(providers: string[], tx: number, ty: number, z: number): Promise<HTMLImageElement | null> {
  for (const p of providers) {
    const url = p.replace("{z}", String(z)).replace("{x}", String(tx)).replace("{y}", String(ty))
    try { return await loadTileImage(url) } catch { /* try next */ }
  }
  return null
}

async function buildMapTexture(lat: number, lng: number, z: number) {
  if (!THREE) return null
  const tileSize = 256   // 1x tiles, canvas = 11×256=2816px ปลอดภัยสำหรับ GPU
  const span = MAP_TILE_SPAN
  const half = Math.floor(span / 2)
  const canvas = document.createElement("canvas")
  canvas.width = tileSize * span
  canvas.height = tileSize * span
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = "#e8eaf0"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tileX = Math.floor(lonToTileX(lng, z))
  const tileY = Math.floor(latToTileY(lat, z))
  const providers = [
    // CartoDB Voyager – ถนนขาว อาคารชัด อัพเดทจาก OSM (1x tiles = 256px)
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    // OSM fallback
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  ]

  // Build tile list and load all in parallel
  const jobs: { tx: number; ty: number; px: number; py: number }[] = []
  for (let iy = -half; iy <= half; iy++) {
    for (let ix = -half; ix <= half; ix++) {
      jobs.push({
        tx: normalizeTileX(tileX + ix, z),
        ty: clampTileY(tileY + iy, z),
        px: (ix + half) * tileSize,
        py: (iy + half) * tileSize,
      })
    }
  }

  const results = await Promise.allSettled(
    jobs.map(j => loadTileWithFallback(providers, j.tx, j.ty, z))
  )

  let loadedTiles = 0
  for (let i = 0; i < jobs.length; i++) {
    const r = results[i]
    const { px, py } = jobs[i]
    if (r.status === "fulfilled" && r.value) {
      ctx.drawImage(r.value, px, py, tileSize, tileSize)
      loadedTiles++
    } else {
      ctx.strokeStyle = "#d3dde7"
      ctx.strokeRect(px, py, tileSize, tileSize)
    }
  }

  if (loadedTiles === 0) throw new Error("No map tiles loaded")

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return { tex, loadedTiles, totalTiles: span * span }
}

function shiftPinnedModelsForMapChange(
  fromLat: number,
  fromLng: number,
  fromZoom: number,
  toLat: number,
  toLng: number,
  toZoom: number,
) {
  if (!THREE || modelEntities.value.length === 0) return
  const zFrom = Math.max(1, Math.min(20, Math.round(fromZoom)))
  const zTo = Math.max(1, Math.min(20, Math.round(toZoom)))
  const unitsFrom = MAP_SURFACE_SIZE / MAP_TILE_SPAN
  const unitsTo = MAP_SURFACE_SIZE / MAP_TILE_SPAN
  const fromCenterX = lonToTileX(fromLng, zFrom)
  const fromCenterY = latToTileY(fromLat, zFrom)
  const toCenterX = lonToTileX(toLng, zTo)
  const toCenterY = latToTileY(toLat, zTo)

  for (const entity of modelEntities.value) {
    if (!entity.pinToMap) continue
    const root = entity.root
    if (!root?.position) continue
    const oldX = Number(root.position.x) || 0
    const oldZ = Number(root.position.z) || 0
    const geoTileX = fromCenterX + oldX / unitsFrom
    const geoTileY = fromCenterY + oldZ / unitsFrom
    const geoLon = tileXToLon(normalizeTileX(geoTileX, zFrom), zFrom)
    const geoLat = tileYToLat(clampTileY(geoTileY, zFrom), zFrom)
    const geoTileXTo = lonToTileX(geoLon, zTo)
    const geoTileYTo = latToTileY(geoLat, zTo)
    const dxTiles = normalizeTileDelta(geoTileXTo - toCenterX, zTo)
    const dzTiles = geoTileYTo - toCenterY
    root.position.x = dxTiles * unitsTo
    root.position.z = dzTiles * unitsTo
    root.updateMatrixWorld(true)
  }
}

async function applyMapLocation(options?: { anchorFrom?: { lat: number; lng: number; zoom: number }; shiftPinned?: boolean }) {
  if (!THREE || !mapSurfaceMesh) return
  const shiftPinned = options?.shiftPinned !== false
  const from = options?.anchorFrom || { lat: mapLat.value, lng: mapLng.value, zoom: mapZoom.value }
  const token = ++mapLoadToken
  ++osmLoadToken
  clearOSMGroups()
  terrainField = null   // will be rebuilt by loadTerrain for the new location
  statusText.value = "Loading map tiles..."
  mapLat.value = Math.max(-85.0511, Math.min(85.0511, Number(mapLat.value) || 0))
  mapLng.value = ((Number(mapLng.value) || 0) + 540) % 360 - 180
  const z = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
  mapZoom.value = z

  try {
    const built = await buildMapTexture(mapLat.value, mapLng.value, z)
    if (token !== mapLoadToken || !built?.tex) {
      built?.tex?.dispose?.()
      return
    }
    if (mapTexture) mapTexture.dispose?.()
    mapTexture = built.tex
    const mat = mapSurfaceMesh.material
    mat.map = built.tex
    mat.color.setHex(0xffffff)
    mat.needsUpdate = true
    if (shiftPinned) {
      shiftPinnedModelsForMapChange(from.lat, from.lng, from.zoom, mapLat.value, mapLng.value, z)
    }
    syncTransformFromSelected()
    frameAllModels()
    statusText.value = `Map loaded (${built.loadedTiles}/${built.totalTiles} tiles)`
    loadingSteps.value[4].done = true
    // Load terrain first so trees/buildings get correct ground height
    await loadTerrain(mapLat.value, mapLng.value, z)
    loadOSMScene(mapLat.value, mapLng.value, z)
    if (tambonVisible.value) loadTambonLayer()
  } catch (err: any) {
    statusText.value = `Map load failed: ${err?.message || "network/tile blocked"}`
  }
}

function tileXToLon(x: number, z: number) {
  return (x / 2 ** z) * 360 - 180
}

function tileYToLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return (180 / Math.PI) * Math.atan(Math.sinh(n))
}

function latLngToWorld(lat: number, lng: number, centerLat: number, centerLng: number, z: number) {
  // The texture center (world origin) = center of the integer center tile = Math.floor(cx) + 0.5
  const unitsPerTile = MAP_SURFACE_SIZE / MAP_TILE_SPAN
  const tileX = Math.floor(lonToTileX(centerLng, z))
  const tileY = Math.floor(latToTileY(centerLat, z))
  return {
    x: (lonToTileX(lng, z) - tileX - 0.5) * unitsPerTile,
    z: (latToTileY(lat, z) - tileY - 0.5) * unitsPerTile,
  }
}

function getMapBbox(lat: number, lng: number, z: number) {
  const half = Math.floor(MAP_TILE_SPAN / 2)
  const tileX = Math.floor(lonToTileX(lng, z))
  const tileY = Math.floor(latToTileY(lat, z))
  return {
    north: tileYToLat(tileY - half, z),
    south: tileYToLat(tileY + half + 1, z),
    west: tileXToLon(tileX - half, z),
    east: tileXToLon(tileX + half + 1, z),
  }
}

// ── Terrain elevation (AWS Terrarium PNG tiles) ──────────────────────────────
function loadImgToCanvas(ctx: CanvasRenderingContext2D, url: string, dx: number, dy: number): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload  = () => { ctx.drawImage(img, dx, dy); resolve() }
    img.onerror = () => resolve()   // fail silently, leave those pixels black (sea level)
    img.src = url
  })
}

function getTerrainHeight(worldX: number, worldZ: number): number {
  if (!terrainField) return 0
  const seg = TERRAIN_SEG
  // worldX: -HALF..+HALF → fracX: 0..1
  const HALF = MAP_SURFACE_SIZE / 2
  const fracX = Math.max(0, Math.min(1, (worldX + HALF) / MAP_SURFACE_SIZE))
  // worldZ: -HALF..+HALF maps to iy 0..seg (north→south matches iy 0→seg)
  const fracY = Math.max(0, Math.min(1, (worldZ + HALF) / MAP_SURFACE_SIZE))
  const ix0 = Math.floor(fracX * seg)
  const iy0 = Math.floor(fracY * seg)
  const ix1 = Math.min(ix0 + 1, seg)
  const iy1 = Math.min(iy0 + 1, seg)
  const tx  = fracX * seg - ix0
  const ty  = fracY * seg - iy0
  const h00 = terrainField[iy0 * (seg + 1) + ix0] ?? 0
  const h10 = terrainField[iy0 * (seg + 1) + ix1] ?? 0
  const h01 = terrainField[iy1 * (seg + 1) + ix0] ?? 0
  const h11 = terrainField[iy1 * (seg + 1) + ix1] ?? 0
  return h00 * (1 - tx) * (1 - ty) + h10 * tx * (1 - ty) + h01 * (1 - tx) * ty + h11 * tx * ty
}

async function loadTerrain(lat: number, lng: number, z: number) {
  if (!THREE || !mapSurfaceMesh) return
  // Flatten first so old terrain doesn't linger if new fetch fails
  const posInit = mapSurfaceMesh.geometry.attributes.position
  for (let i = 0; i < posInit.count; i++) posInit.setZ(i, 0)
  posInit.needsUpdate = true
  const tileWidthM  = (2 * Math.PI * 6371000 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, z)
  const wupm        = (MAP_SURFACE_SIZE / MAP_TILE_SPAN) / tileWidthM
  terrainWorldUnitsPerMeter = wupm

  const { south, west, north, east } = getMapBbox(lat, lng, z)
  // Use a lower zoom for terrain so we fetch just a few tiles
  const tz    = Math.max(8, Math.min(z, 13))
  const txMin = Math.floor(lonToTileX(west,  tz))
  const txMax = Math.floor(lonToTileX(east,  tz))
  const tyMin = Math.floor(latToTileY(north, tz))  // north → smaller Y
  const tyMax = Math.floor(latToTileY(south, tz))

  const tilesX    = txMax - txMin + 1
  const tilesY    = tyMax - tyMin + 1
  const tPx       = 256
  const totalW    = tilesX * tPx
  const totalH    = tilesY * tPx

  const canvas    = document.createElement("canvas")
  canvas.width    = totalW
  canvas.height   = totalH
  const ctx       = canvas.getContext("2d")!

  const fetches: Promise<void>[] = []
  for (let ty = tyMin; ty <= tyMax; ty++)
    for (let tx = txMin; tx <= txMax; tx++) {
      const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${tz}/${tx}/${ty}.png`
      fetches.push(loadImgToCanvas(ctx, url, (tx - txMin) * tPx, (ty - tyMin) * tPx))
    }
  await Promise.allSettled(fetches)

  let imgData: ImageData
  try {
    imgData = ctx.getImageData(0, 0, totalW, totalH)
  } catch {
    // CORS blocked — skip terrain deformation, leave flat
    return
  }
  const mosaicW   = tileXToLon(txMax + 1, tz) - tileXToLon(txMin, tz)
  const mosaicN   = tileYToLat(tyMin,     tz)
  const mosaicS   = tileYToLat(tyMax + 1, tz)
  const mosaicH   = mosaicN - mosaicS

  const seg       = TERRAIN_SEG
  const field     = new Float32Array((seg + 1) * (seg + 1))

  for (let iy = 0; iy <= seg; iy++) {
    for (let ix = 0; ix <= seg; ix++) {
      const sLng  = west  + (ix / seg) * (east  - west)
      const sLat  = north - (iy / seg) * (north - south)
      const px    = Math.max(0, Math.min(totalW - 1, Math.floor((sLng - tileXToLon(txMin, tz)) / mosaicW * totalW)))
      const py    = Math.max(0, Math.min(totalH - 1, Math.floor((mosaicN - sLat) / mosaicH * totalH)))
      const di    = (py * totalW + px) * 4
      const r     = imgData.data[di], g = imgData.data[di + 1], b = imgData.data[di + 2]
      const elevM = Math.max(0, (r * 256 + g + b / 256) - 32768)
      field[iy * (seg + 1) + ix] = elevM * wupm * TERRAIN_ELEV_SCALE
    }
  }

  // ── Normalize: subtract min so the lowest point sits at y=0 ──────────────
  // Without this, even flat Bangkok (≈5 m ASL) lifts the map surface above
  // y=0 and buildings/trees placed at y=0 appear to float or sink.
  let minH = Infinity
  for (let i = 0; i < field.length; i++) if (field[i] < minH) minH = field[i]
  if (minH > 0) for (let i = 0; i < field.length; i++) field[i] -= minH

  terrainField = field

  // Apply heights to map surface mesh vertices.
  // PlaneGeometry (rotation.x = -PI/2): local Z maps to world Y.
  const posAttr = mapSurfaceMesh.geometry.attributes.position
  for (let iy = 0; iy <= seg; iy++) {
    for (let ix = 0; ix <= seg; ix++) {
      posAttr.setZ(iy * (seg + 1) + ix, field[iy * (seg + 1) + ix])
    }
  }
  posAttr.needsUpdate = true
  mapSurfaceMesh.geometry.computeVertexNormals()
}
// ─────────────────────────────────────────────────────────────────────────────

function parseBuildingGeometry(geometry: string): number[][][] {
  const text = (geometry || "").trim()
  if (!text) return []
  const cached = buildingGeometryCache.get(text)
  if (cached) return cached

  // ── GeoJSON geometry (from Microsoft / MS-buildings endpoint) ──
  if (text.startsWith("{")) {
    try {
      const geom = JSON.parse(text)
      if (geom.type === "Polygon") {
        const ring = geom.coordinates?.[0]
        const out = ring?.length >= 3 ? [ring] : []
        if (buildingGeometryCache.size >= MAX_BUILDING_GEOMETRY_CACHE) buildingGeometryCache.delete(buildingGeometryCache.keys().next().value!)
        buildingGeometryCache.set(text, out)
        return out
      }
      if (geom.type === "MultiPolygon") {
        const out = (geom.coordinates as number[][][][])
          .map((poly: number[][][]) => poly[0])
          .filter((ring: number[][]) => ring?.length >= 3)
        if (buildingGeometryCache.size >= MAX_BUILDING_GEOMETRY_CACHE) buildingGeometryCache.delete(buildingGeometryCache.keys().next().value!)
        buildingGeometryCache.set(text, out)
        return out
      }
    } catch {}
    return []
  }

  // ── WKT (from Supabase buildings_ml) ──
  const groups = text.startsWith("MULTIPOLYGON")
    ? [...text.matchAll(/\(\(\((.*?)\)\)\)/g)].map(match => match[1])
    : text.startsWith("POLYGON")
      ? [...text.matchAll(/\(\((.*?)\)\)/g)].map(match => match[1])
      : []

  const out = groups
    .map(group => group.split("),(")[0])
    .map(ring => ring
      .split(",")
      .map(pair => pair.trim().split(/\s+/).map(Number))
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
    )
    .filter(ring => ring.length >= 3)
  if (buildingGeometryCache.size >= MAX_BUILDING_GEOMETRY_CACHE) buildingGeometryCache.delete(buildingGeometryCache.keys().next().value!)
  buildingGeometryCache.set(text, out)
  return out
}

function fetchOSMData(lat: number, lng: number, z: number) {
  const tileXk = Math.floor(lonToTileX(lng, z))
  const tileYk = Math.floor(latToTileY(lat, z))
  const cacheKey = `${tileXk},${tileYk},${z}`
  if (osmDataCache.has(cacheKey)) return Promise.resolve(osmDataCache.get(cacheKey)!)
  if (osmFetchInFlight.has(cacheKey)) return osmFetchInFlight.get(cacheKey)!

  const p: Promise<OSMSceneData> = (async () => {
  const { south, west, north, east } = getMapBbox(lat, lng, z)
  const midLat = (south + north) / 2
  const midLng = (west + east) / 2

  // center 5×5 bbox สำหรับ OSM buildings (ไม่ timeout)
  const cHalf = 2
  const cTX = Math.floor(lonToTileX(lng, z))
  const cTY = Math.floor(latToTileY(lat, z))
  const cS = tileYToLat(cTY + cHalf + 1, z)
  const cN = tileYToLat(cTY - cHalf, z)
  const cW = tileXToLon(cTX - cHalf, z)
  const cE = tileXToLon(cTX + cHalf + 1, z)
  const cBbox = `${cS},${cW},${cN},${cE}`
  const fullBbox = `${south},${west},${north},${east}`

  // Query เดียว: พืชพรรณ/ป่าใช้ full bbox เพื่อให้ขึ้นทั้งแผนที่,
  // ส่วนอาคารยังใช้ center bbox เพื่อลดภาระ Overpass
  const osmQuery = `[out:json][timeout:25][maxsize:67108864];(node["natural"="tree"](${fullBbox});node["natural"="tree_row"](${fullBbox});way["natural"="wood"](${fullBbox});relation["natural"="wood"](${fullBbox});way["landuse"="forest"](${fullBbox});relation["landuse"="forest"](${fullBbox});way["leisure"="park"](${fullBbox});relation["leisure"="park"](${fullBbox});way["natural"="scrub"](${fullBbox});relation["natural"="scrub"](${fullBbox});way["landuse"="orchard"](${fullBbox});relation["landuse"="orchard"](${fullBbox});way["natural"="grassland"](${fullBbox});relation["natural"="grassland"](${fullBbox});way["natural"="heath"](${fullBbox});relation["natural"="heath"](${fullBbox});way["building"](${cBbox});relation["building"]["type"="multipolygon"](${cBbox}););(._;>;);out body;`

  // Supabase: 4 quadrant parallel (ไม่มี rate limit)
  const sq1 = `/api/buildings?south=${midLat}&west=${west}&north=${north}&east=${midLng}`
  const sq2 = `/api/buildings?south=${midLat}&west=${midLng}&north=${north}&east=${east}`
  const sq3 = `/api/buildings?south=${south}&west=${west}&north=${midLat}&east=${midLng}`
  const sq4 = `/api/buildings?south=${south}&west=${midLng}&north=${midLat}&east=${east}`

  // Microsoft Global ML Building Footprints (ครอบคลุมทั่วไทยรวมพื้นที่ชนบท)
  const msUrl = `/api/ms-buildings?south=${south}&west=${west}&north=${north}&east=${east}`

  // ยิงทั้ง 2 mirrors พร้อมกัน — เอาตัวที่ตอบกลับก่อน (Promise.any)
  // ลด latency จาก "รอ timeout แล้วค่อย fallback" → "ใครเร็วกว่าได้ไปเลย"
  const tryMirror = (host: string) =>
    fetch(`${host}/api/interpreter?data=${encodeURIComponent(osmQuery)}`,
      { signal: AbortSignal.timeout(20_000) })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r })
  const osmFetch = Promise.any([
    tryMirror('https://overpass-api.de'),
    tryMirror('https://overpass.kumi.systems'),
  ])

  const [osmResult, r1, r2, r3, r4, rMs] = await Promise.allSettled([
    osmFetch,
    fetch(sq1), fetch(sq2), fetch(sq3), fetch(sq4),
    fetch(msUrl),
  ])

  if (osmResult.status !== "fulfilled") throw osmResult.reason

  const osmData = await osmResult.value.json()

  // รวม Supabase buildings จากทุก quadrant (dedup ที่ขอบ)
  const allBuildings: BuildingsMlRow[] = []
  const seenIds = new Set<string>()
  for (const r of [r1, r2, r3, r4]) {
    if (r.status !== "fulfilled" || !r.value.ok) continue
    const rows: BuildingsMlRow[] = await r.value.json()
    for (const row of rows) {
      const key = `${row.lat.toFixed(6)},${row.lng.toFixed(6)}`
      if (!seenIds.has(key)) { seenIds.add(key); allBuildings.push(row) }
    }
  }

  // เพิ่ม Microsoft buildings (ใช้เมื่อ Supabase ไม่มีข้อมูล เช่น พื้นที่ชนบท)
  if (rMs.status === "fulfilled" && rMs.value.ok) {
    try {
      const msRows: BuildingsMlRow[] = await rMs.value.json()
      for (const row of msRows) {
        const key = `${row.lat.toFixed(5)},${row.lng.toFixed(5)}`
        if (!seenIds.has(key)) { seenIds.add(key); allBuildings.push(row) }
      }
    } catch { /* ไม่มี MS data — ไม่เป็นไร */ }
  }

  const data: OSMSceneData = { osm: osmData, buildings: allBuildings }

  if (osmDataCache.size >= 8) osmDataCache.delete(osmDataCache.keys().next().value!)
  osmDataCache.set(cacheKey, data)
  return data
  })()  // end of IIFE

  osmFetchInFlight.set(cacheKey, p)
  p.finally(() => osmFetchInFlight.delete(cacheKey))
  return p
}

function clearOSMGroups() {
  if (osmBuildingGroup) {
    scene?.remove(osmBuildingGroup)
    disposeObject3D(osmBuildingGroup)
    osmBuildingGroup = null
  }
  if (osmTreeGroup) {
    scene?.remove(osmTreeGroup)
    disposeObject3D(osmTreeGroup)
    osmTreeGroup = null
  }
  for (const g of osmOuterBuildingGroups) {
    scene?.remove(g)
    disposeObject3D(g)
  }
  osmOuterBuildingGroups = []
}

function disposeObject3D(root: any) {
  if (!root?.traverse) return
  const seenGeometries = new Set<any>()
  const seenMaterials = new Set<any>()
  root.traverse((obj: any) => {
    const geo = obj?.geometry
    if (geo && !seenGeometries.has(geo)) {
      seenGeometries.add(geo)
      geo.dispose?.()
    }
    const mats = Array.isArray(obj?.material) ? obj.material : obj?.material ? [obj.material] : []
    for (const mat of mats) {
      if (!mat || seenMaterials.has(mat)) continue
      seenMaterials.add(mat)
      for (const key of ["map", "alphaMap", "aoMap", "bumpMap", "displacementMap", "emissiveMap", "envMap", "lightMap", "metalnessMap", "normalMap", "roughnessMap"]) {
        mat[key]?.dispose?.()
      }
      mat.dispose?.()
    }
  })
}

function normalizeWorldRing(pts: { x: number; z: number }[]) {
  const out: { x: number; z: number }[] = []
  for (const pt of pts) {
    const prev = out[out.length - 1]
    if (prev && Math.abs(prev.x - pt.x) < 0.001 && Math.abs(prev.z - pt.z) < 0.001) continue
    out.push(pt)
  }
  if (out.length >= 2) {
    const first = out[0]
    const last = out[out.length - 1]
    if (Math.abs(first.x - last.x) < 0.001 && Math.abs(first.z - last.z) < 0.001) out.pop()
  }
  return out
}

async function yieldToBrowser() {
  await new Promise(r => setTimeout(r, 0))
}

function pushBuildingGeometries(
  ptsRaw: { x: number; z: number }[],
  groundY: number,
  h: number,
  wallGeos: any[],
  roofGeos: any[],
) {
  const pts = normalizeWorldRing(ptsRaw)
  if (pts.length < 3) return false
  const shape = new THREE.Shape()
  shape.moveTo(pts[0].x, -pts[0].z)
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, -pts[i].z)
  shape.closePath()

  const wallGeo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: BUILDING_CURVE_SEGMENTS,
    steps: 1,
  })
  wallGeo.rotateX(-Math.PI / 2)
  wallGeo.translate(0, groundY + 0.01, 0)
  wallGeos.push(wallGeo)

  const roofGeo = new THREE.ShapeGeometry(shape, BUILDING_CURVE_SEGMENTS)
  roofGeo.rotateX(-Math.PI / 2)
  roofGeo.translate(0, groundY + h + 0.012, 0)
  roofGeos.push(roofGeo)
  return true
}

function getTreeRenderBudget(z: number) {
  if (z >= 18) return { densityScale: 1.0, maxInstances: 2600, maxPerArea: 220, cellSize: 1.4 }
  if (z >= 17) return { densityScale: 0.72, maxInstances: 1800, maxPerArea: 150, cellSize: 1.9 }
  return { densityScale: 0.6, maxInstances: 1800, maxPerArea: 130, cellSize: 2.3 }
}

function addTreeInstances(
  trees: Array<{ x: number; z: number; y: number; trunkH: number; trunkR: number; crownR: number; crownStretch: number }>,
  parent: any,
) {
  if (!trees.length) return

  const trunkGeo = new THREE.CylinderGeometry(0.5, 1, 1, 6)
  const crownGeo = new THREE.SphereGeometry(1, 6, 4)
  const trunkMesh = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshLambertMaterial({ color: 0x7a5230 }),
    trees.length,
  )
  const crownMesh = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshLambertMaterial({ color: 0x3a7d44 }),
    trees.length,
  )
  const dummy = new THREE.Object3D()

  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i]

    dummy.position.set(tree.x, tree.y + tree.trunkH / 2, tree.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.set(tree.trunkR, tree.trunkH, tree.trunkR)
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)

    dummy.position.set(tree.x, tree.y + tree.trunkH + tree.crownR * 0.65, tree.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.set(tree.crownR * 0.95, tree.crownR * tree.crownStretch, tree.crownR * 0.95)
    dummy.updateMatrix()
    crownMesh.setMatrixAt(i, dummy.matrix)
  }

  trunkMesh.instanceMatrix.needsUpdate = true
  crownMesh.instanceMatrix.needsUpdate = true
  trunkMesh.castShadow = true
  trunkMesh.receiveShadow = true
  crownMesh.castShadow = true
  crownMesh.receiveShadow = true
  trunkMesh.computeBoundingSphere?.()
  crownMesh.computeBoundingSphere?.()
  parent.add(trunkMesh)
  parent.add(crownMesh)
}

async function buildOSMScene(data: any, centerLat: number, centerLng: number, z: number, token: number) {
  if (!THREE || !scene) return
  clearOSMGroups()

  const nodeMap = new Map<number, { lat: number; lon: number }>()
  const wayMap = new Map<number, number[]>()  // way id → node ids (สำหรับ relation multipolygon)
  for (const el of data.osm.elements) {
    if (el.type === "node") nodeMap.set(el.id, { lat: el.lat, lon: el.lon })
    if (el.type === "way" && el.nodes) wayMap.set(el.id, el.nodes)
  }

  const tileWidthM = (2 * Math.PI * 6371000 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, z)
  const worldUnitsPerMeter = (MAP_SURFACE_SIZE / MAP_TILE_SPAN) / tileWidthM

  const wallGeos: any[] = []
  const roofGeos: any[] = []
  const treeInstances: Array<{ x: number; z: number; y: number; trunkH: number; trunkR: number; crownR: number; crownStretch: number }> = []
  const treeBudget = getTreeRenderBudget(z)
  const treeCells = new Set<string>()
  const WORLD_HALF = MAP_SURFACE_SIZE / 2

  // Helper: centroid terrain height for a set of world points
  function bldGroundY(pts: { x: number; z: number }[]): number {
    if (!pts.length) return 0
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length
    return getTerrainHeight(cx, cz)
  }

  function tryCollectTree(x: number, zPos: number, y0 = 0) {
    if (treeInstances.length >= treeBudget.maxInstances) return false
    const cell = `${Math.round(x / treeBudget.cellSize)},${Math.round(zPos / treeBudget.cellSize)}`
    if (treeCells.has(cell)) return false
    treeCells.add(cell)
    treeInstances.push({
      x,
      z: zPos,
      y: y0,
      trunkH: 1.0 + Math.random() * 0.8,
      trunkR: 0.10 + Math.random() * 0.06,
      crownR: 0.7 + Math.random() * 0.6,
      crownStretch: 0.78 + Math.random() * 0.34,
    })
    return true
  }

  function collectWorldPtsFromNodeIds(nodeIds: number[]) {
    const pts: { x: number; z: number }[] = []
    for (const nid of nodeIds) {
      const nd = nodeMap.get(nid)
      if (!nd) continue
      const wp = latLngToWorld(nd.lat, nd.lon, centerLat, centerLng, z)
      if (Math.abs(wp.x) <= WORLD_HALF && Math.abs(wp.z) <= WORLD_HALF) pts.push(wp)
    }
    return pts
  }

  function scatterTreesInPolygon(pts: { x: number; z: number }[], density: number) {
    if (pts.length < 3) return
    const minX = Math.min(...pts.map(p => p.x))
    const maxX = Math.max(...pts.map(p => p.x))
    const minZ = Math.min(...pts.map(p => p.z))
    const maxZ = Math.max(...pts.map(p => p.z))
    const bbox = (maxX - minX) * (maxZ - minZ)
    const count = Math.min(treeBudget.maxPerArea, Math.max(2, Math.floor(bbox * density)))
    for (let i = 0; i < count; i++) {
      if (treeInstances.length >= treeBudget.maxInstances) break
      let tx = 0, tz = 0, ok = false
      for (let t = 0; t < 6; t++) {
        tx = minX + Math.random() * (maxX - minX)
        tz = minZ + Math.random() * (maxZ - minZ)
        if (pointInPoly(tx, tz, pts)) { ok = true; break }
      }
      if (ok) tryCollectTree(tx, tz, getTerrainHeight(tx, tz))
    }
  }

  // --- Pass 1: Buildings from Supabase / Microsoft ML ---
  let buildingWork = 0
  for (const building of data.buildings) {
    if (token !== osmLoadToken) return
    buildingWork++
    if (buildingWork % BUILDING_YIELD_EVERY === 0) {
      await yieldToBrowser()
      if (token !== osmLoadToken) return
    }
    const rings = parseBuildingGeometry(building.geometry)
    const heightM = Math.min(40, Math.max(6, Math.sqrt(Math.max(Number(building.area_m2) || 36, 36)) * 0.85))
    const h = Math.min(heightM * worldUnitsPerMeter, 60)

    // centroid terrain height from the building's lat/lng
    const cWP    = latLngToWorld(building.lat, building.lng, centerLat, centerLng, z)
    const groundY = getTerrainHeight(cWP.x, cWP.z)

    for (const ring of rings) {
      const pts = ring.map(([lngPt, latPt]) => latLngToWorld(latPt, lngPt, centerLat, centerLng, z))
      pushBuildingGeometries(pts, groundY, h, wallGeos, roofGeos)
    }
  }

  // Build spatial dedup set from Supabase/MS buildings rendered in Pass 1.
  // 0.0001° ≈ 11 m — fine enough to skip OSM buildings that already appear above.
  const occupiedCells = new Set<string>()
  for (const b of data.buildings) {
    occupiedCells.add(`${b.lat.toFixed(4)},${b.lng.toFixed(4)}`)
  }

  // --- Pass 1b: Buildings from OSM Overpass ---
  for (const el of data.osm.elements) {
    if (token !== osmLoadToken) return
    buildingWork++
    if (buildingWork % BUILDING_YIELD_EVERY === 0) {
      await yieldToBrowser()
      if (token !== osmLoadToken) return
    }
    if (el.type !== "way" || !el.tags?.building || !el.nodes?.length) continue

    // Skip if this building's centroid is already covered by a Supabase/MS building
    if (occupiedCells.size > 0) {
      const validNds = (el.nodes as number[]).map(nid => nodeMap.get(nid)).filter(Boolean) as { lat: number; lon: number }[]
      if (validNds.length >= 3) {
        const cLat = validNds.reduce((s, nd) => s + nd.lat, 0) / validNds.length
        const cLng = validNds.reduce((s, nd) => s + nd.lon, 0) / validNds.length
        if (occupiedCells.has(`${cLat.toFixed(4)},${cLng.toFixed(4)}`)) continue
      }
    }

    const pts: { x: number; z: number }[] = []
    for (const nid of el.nodes) {
      const nd = nodeMap.get(nid)
      if (nd) pts.push(latLngToWorld(nd.lat, nd.lon, centerLat, centerLng, z))
    }
    if (pts.length < 3) continue

    const levels = parseFloat(el.tags?.["building:levels"] || "0") || 0
    const heightTag = parseFloat(el.tags?.["height"] || "0") || 0
    const buildingType = el.tags?.building || "yes"
    const defaultH = (buildingType === "apartments" || buildingType === "commercial" || buildingType === "office") ? 14 : 8
    const heightM = heightTag > 0 ? Math.min(heightTag, 200) : levels > 0 ? levels * 3.2 : defaultH
    const h = Math.min(heightM * worldUnitsPerMeter, 80)
    const groundY = bldGroundY(pts)
    pushBuildingGeometries(pts, groundY, h, wallGeos, roofGeos)
  }

  // --- Pass 1c: Relation multipolygon buildings ---
  for (const el of data.osm.elements) {
    if (token !== osmLoadToken) return
    buildingWork++
    if (buildingWork % BUILDING_YIELD_EVERY === 0) {
      await yieldToBrowser()
      if (token !== osmLoadToken) return
    }
    if (el.type !== "relation" || !el.tags?.building || !el.members?.length) continue

    // Skip if centroid of the first outer member is already covered by Supabase/MS
    if (occupiedCells.size > 0) {
      const firstOuter = el.members.find((m: any) => m.type === "way" && m.role === "outer")
      const firstNids = firstOuter ? wayMap.get(firstOuter.ref) : null
      if (firstNids && firstNids.length >= 3) {
        const validNds = firstNids.map(nid => nodeMap.get(nid)).filter(Boolean) as { lat: number; lon: number }[]
        if (validNds.length >= 3) {
          const cLat = validNds.reduce((s, nd) => s + nd.lat, 0) / validNds.length
          const cLng = validNds.reduce((s, nd) => s + nd.lon, 0) / validNds.length
          if (occupiedCells.has(`${cLat.toFixed(4)},${cLng.toFixed(4)}`)) continue
        }
      }
    }

    const levels = parseFloat(el.tags?.["building:levels"] || "0") || 0
    const heightTag = parseFloat(el.tags?.["height"] || "0") || 0
    const buildingType = el.tags?.building || "yes"
    const defaultH = (buildingType === "apartments" || buildingType === "commercial" || buildingType === "office" || buildingType === "retail") ? 14 : 8
    const heightM = heightTag > 0 ? Math.min(heightTag, 200) : levels > 0 ? levels * 3.2 : defaultH
    const h = Math.min(heightM * worldUnitsPerMeter, 80)

    const outerMembers = el.members.filter((m: any) => m.type === "way" && m.role === "outer")
    for (const member of outerMembers) {
      const nodeIds = wayMap.get(member.ref)
      if (!nodeIds || nodeIds.length < 3) continue

      const pts: { x: number; z: number }[] = []
      for (const nid of nodeIds) {
        const nd = nodeMap.get(nid)
        if (nd) pts.push(latLngToWorld(nd.lat, nd.lon, centerLat, centerLng, z))
      }
      if (pts.length < 3) continue

      const groundY = bldGroundY(pts)
      pushBuildingGeometries(pts, groundY, h, wallGeos, roofGeos)
    }
  }

  // Yield to browser between passes so the map is visible
  await yieldToBrowser()
  if (token !== osmLoadToken) return

  // Add buildings to scene early so user sees them while water/trees are processing
  osmBuildingGroup = new THREE.Group()
  addMergedGeos(wallGeos, new THREE.MeshLambertMaterial({ color: 0xc8c0b8 }), osmBuildingGroup, true)
  addMergedGeos(roofGeos, new THREE.MeshLambertMaterial({ color: 0x9e9690 }), osmBuildingGroup)
  scene.add(osmBuildingGroup)

  await yieldToBrowser()
  if (token !== osmLoadToken) return

  await yieldToBrowser()
  if (token !== osmLoadToken) return

  // --- Pass 2: Trees & vegetation ---
  let treeWork = 0
  for (const el of data.osm.elements) {
    treeWork++
    if (treeWork % TREE_YIELD_EVERY === 0) {
      await yieldToBrowser()
      if (token !== osmLoadToken) return
    }
    if (el.type === "node" && (el.tags?.natural === "tree" || el.tags?.natural === "tree_row")) {
      const wp = latLngToWorld(el.lat, el.lon, centerLat, centerLng, z)
      // ข้ามต้นไม้ที่อยู่นอก map surface
      if (Math.abs(wp.x) > WORLD_HALF || Math.abs(wp.z) > WORLD_HALF) continue
      tryCollectTree(wp.x, wp.z, getTerrainHeight(wp.x, wp.z))
    }

    const tags = el.tags || {}
    const isForest  = tags.natural === "wood"      || tags.landuse === "forest"
    const isPark    = tags.leisure === "park"
    const isScrub   = tags.natural === "scrub"     || tags.natural === "heath"
    const isOrchard = tags.landuse === "orchard"
    const isGrass   = tags.natural === "grassland"
    const isGreenArea = (el.type === "way" || el.type === "relation") &&
      (isForest || isPark || isScrub || isOrchard || isGrass)

    if (isGreenArea) {
      const density = (isForest ? 1.2 : isScrub ? 0.5 : isOrchard ? 0.4 : 0.25) * treeBudget.densityScale

      if (el.type === "way" && (el.nodes?.length ?? 0) >= 3) {
        scatterTreesInPolygon(collectWorldPtsFromNodeIds(el.nodes), density)
      }

      if (el.type === "relation" && el.members?.length) {
        for (const member of el.members) {
          if (treeInstances.length >= treeBudget.maxInstances) break
          if (member.type !== "way" || member.role !== "outer") continue
          const memberNodeIds = wayMap.get(member.ref)
          if (!memberNodeIds || memberNodeIds.length < 3) continue
          const pts = collectWorldPtsFromNodeIds(memberNodeIds)
          if (pts.length >= 3) {
            scatterTreesInPolygon(pts, density)
          }
        }
      }
    }
  }

  await yieldToBrowser()
  if (token !== osmLoadToken) return

  osmTreeGroup = new THREE.Group()
  addTreeInstances(treeInstances, osmTreeGroup)
  scene.add(osmTreeGroup)
}

function addMergedGeos(geos: any[], mat: any, parent: any, castShadow = false) {
  if (!geos.length) return
  // Strip uv2 so all ExtrudeGeometry/ShapeGeometry have identical attributes before merging
  for (const g of geos) g.deleteAttribute?.("uv2")
  if (mergeGeometries) {
    try {
      const merged = mergeGeometries(geos, false)
      if (merged) {
        const mesh = new THREE.Mesh(merged, mat)
        mesh.castShadow = castShadow
        mesh.receiveShadow = true
        parent.add(mesh)
        geos.forEach(g => g.dispose?.())
        return
      }
    } catch { /* fall through to individual mesh fallback */ }
  }
  // Fallback: add individual meshes (still works, just more draw calls)
  for (const g of geos) {
    const mesh = new THREE.Mesh(g, mat)
    mesh.castShadow = castShadow
    mesh.receiveShadow = true
    parent.add(mesh)
  }
}

function pointInPoly(px: number, pz: number, poly: { x: number; z: number }[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

async function appendOSMBuildings(elements: any[], centerLat: number, centerLng: number, z: number, token: number) {
  if (!THREE || !scene || !elements.length) return
  const tileWidthM = (2 * Math.PI * 6371000 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, z)
  const worldUnitsPerMeter = (MAP_SURFACE_SIZE / MAP_TILE_SPAN) / tileWidthM

  const nodeMap = new Map<number, { lat: number; lon: number }>()
  const wayMap = new Map<number, number[]>()
  for (const el of elements) {
    if (el.type === "node") nodeMap.set(el.id, { lat: el.lat, lon: el.lon })
    if (el.type === "way" && el.nodes) wayMap.set(el.id, el.nodes)
  }

  const wallGeos: any[] = []
  const roofGeos: any[] = []

  let buildingWork = 0
  for (const el of elements) {
    if (token !== osmLoadToken) return
    buildingWork++
    if (buildingWork % BUILDING_YIELD_EVERY === 0) {
      await yieldToBrowser()
      if (token !== osmLoadToken) return
    }
    if (el.type === "way" && el.tags?.building && el.nodes?.length) {
      const pts: { x: number; z: number }[] = []
      for (const nid of el.nodes) {
        const nd = nodeMap.get(nid)
        if (nd) pts.push(latLngToWorld(nd.lat, nd.lon, centerLat, centerLng, z))
      }
      if (pts.length < 3) continue
      const levels = parseFloat(el.tags?.["building:levels"] || "0") || 0
      const ht = parseFloat(el.tags?.["height"] || "0") || 0
      const bt = el.tags?.building || "yes"
      const dh = (bt === "apartments" || bt === "commercial" || bt === "office") ? 14 : 8
      const h = Math.min((ht > 0 ? Math.min(ht, 200) : levels > 0 ? levels * 3.2 : dh) * worldUnitsPerMeter, 80)
      const gy = pts.length ? getTerrainHeight(pts.reduce((s, p) => s + p.x, 0) / pts.length, pts.reduce((s, p) => s + p.z, 0) / pts.length) : 0
      pushBuildingGeometries(pts, gy, h, wallGeos, roofGeos)
    }
    if (el.type === "relation" && el.tags?.building && el.members?.length) {
      const levels = parseFloat(el.tags?.["building:levels"] || "0") || 0
      const ht = parseFloat(el.tags?.["height"] || "0") || 0
      const bt = el.tags?.building || "yes"
      const dh = (bt === "apartments" || bt === "commercial" || bt === "office" || bt === "retail") ? 14 : 8
      const h = Math.min((ht > 0 ? Math.min(ht, 200) : levels > 0 ? levels * 3.2 : dh) * worldUnitsPerMeter, 80)
      for (const member of el.members.filter((m: any) => m.type === "way" && m.role === "outer")) {
        const nids = wayMap.get(member.ref); if (!nids || nids.length < 3) continue
        const pts: { x: number; z: number }[] = []
        for (const nid of nids) { const nd = nodeMap.get(nid); if (nd) pts.push(latLngToWorld(nd.lat, nd.lon, centerLat, centerLng, z)) }
        if (pts.length < 3) continue
        const gy = getTerrainHeight(pts.reduce((s, p) => s + p.x, 0) / pts.length, pts.reduce((s, p) => s + p.z, 0) / pts.length)
        pushBuildingGeometries(pts, gy, h, wallGeos, roofGeos)
      }
    }
  }

  if (!wallGeos.length || token !== osmLoadToken) return
  await yieldToBrowser()
  if (token !== osmLoadToken) return

  const group = new THREE.Group()
  addMergedGeos(wallGeos, new THREE.MeshLambertMaterial({ color: 0xc8c0b8 }), group, true)
  addMergedGeos(roofGeos, new THREE.MeshLambertMaterial({ color: 0x9e9690 }), group)
  osmOuterBuildingGroups.push(group)
  scene.add(group)
}

async function loadOSMScene(lat: number, lng: number, z: number) {
  const token = osmLoadToken
  osmBuilding3dLoading.value = true
  osmLoadingPct.value = 0
  osmLoadingStep.value = "กำลังดึงข้อมูล OSM..."
  try {
    // Phase 1 = 0–20%: center buildings + trees + Supabase
    let data: any = null
    for (let attempt = 1; attempt <= 3 && !data; attempt++) {
      if (token !== osmLoadToken) return
      osmLoadingStep.value = attempt > 1 ? `ดึงข้อมูล OSM (retry ${attempt}/3)...` : "กำลังดึงข้อมูล OSM + Microsoft Buildings..."
      try {
        data = await fetchOSMData(lat, lng, z)
        osmLoadingPct.value = 20
      } catch (e) {
        const wait = attempt * 1000
        osmLoadingStep.value = `ดึงข้อมูลล้มเหลว รอ ${wait / 1000}s...`
        osmDataCache.delete(`${Math.floor(lonToTileX(lng, z))},${Math.floor(latToTileY(lat, z))},${Math.max(1, Math.min(20, Math.round(z)))}`)
        await new Promise(r => setTimeout(r, wait))
      }
    }
    if (!data || token !== osmLoadToken) return

    osmLoadingStep.value = "กำลัง render อาคาร (ศูนย์กลาง)..."
    osmLoadingPct.value = 25
    await buildOSMScene(data, lat, lng, z, token)
    if (token !== osmLoadToken) return
    osmLoadingPct.value = 40

    // Phase 2 = 40–100%: 4 non-overlapping outer strips (north / south / west / east)
    // Uses the same center-bbox bounds as fetchOSMData (cHalf=2 → 5×5 tiles) so that
    // buildings in the center area are NOT fetched twice.
    const { south, west, north, east } = getMapBbox(lat, lng, z)
    const cHalf2 = 2
    const cTX2   = Math.floor(lonToTileX(lng, z))
    const cTY2   = Math.floor(latToTileY(lat, z))
    const cS2    = tileYToLat(cTY2 + cHalf2 + 1, z)  // south edge of center 5×5
    const cN2    = tileYToLat(cTY2 - cHalf2,     z)  // north edge of center 5×5
    const cW2    = tileXToLon(cTX2 - cHalf2,     z)  // west edge of center 5×5
    const cE2    = tileXToLon(cTX2 + cHalf2 + 1, z)  // east edge of center 5×5
    const bldQ = (bb: string) =>
      `[out:json][timeout:25][maxsize:67108864];(way["building"](${bb});relation["building"]["type"="multipolygon"](${bb}););(._;>;);out body;`
    // Overpass bbox format: south,west,north,east
    const outerBboxes = [
      { bb: `${cN2},${west},${north},${east}`,  label: "แถบเหนือ" },     // full-width north strip
      { bb: `${south},${west},${cS2},${east}`,  label: "แถบใต้" },       // full-width south strip
      { bb: `${cS2},${west},${cN2},${cW2}`,     label: "แถบตะวันตก" },  // west strip (center latitude band)
      { bb: `${cS2},${cE2},${cN2},${east}`,     label: "แถบตะวันออก" }, // east strip (center latitude band)
    ]
    // Phase 2: ยิงทุก strip พร้อมกัน, แต่ละ strip ยิง 2 mirrors parallel
    osmLoadingStep.value = "โหลดอาคารรอบนอก (4 ทิศพร้อมกัน)..."
    const tryOuterMirror = (host: string, bb: string) =>
      fetch(`${host}/api/interpreter?data=${encodeURIComponent(bldQ(bb))}`,
        { signal: AbortSignal.timeout(20_000) })
        .then(r => { if (!r.ok) throw new Error(String(r.status)); return r })
    await Promise.allSettled(outerBboxes.map(async ({ bb }, qi) => {
      if (token !== osmLoadToken) return
      try {
        // ยิงทั้ง 2 mirrors พร้อมกัน — เอาตัวที่ตอบก่อน
        const res = await Promise.any([
          tryOuterMirror('https://overpass.kumi.systems', bb),
          tryOuterMirror('https://overpass-api.de', bb),
        ])
        const d = await res.json()
        if (d.elements?.length > 0 && token === osmLoadToken)
          await appendOSMBuildings(d.elements, lat, lng, z, token)
        if (token === osmLoadToken)
          osmLoadingPct.value = Math.max(osmLoadingPct.value, 40 + (qi + 1) * 15)
      } catch { /* strip ล้มเหลวทั้ง 2 mirrors — ข้ามไป */ }
    }))
    if (token === osmLoadToken) {
      osmLoadingPct.value = 100
      osmLoadingStep.value = "โหลดอาคารครบแล้ว ✓"
      await new Promise(r => setTimeout(r, 1200))
    }
  } catch (err: any) {
    console.warn("OSM 3D load failed:", err?.message)
    if (token === osmLoadToken) osmLoadingStep.value = "โหลดล้มเหลว"
  } finally {
    if (token === osmLoadToken) {
      osmBuilding3dLoading.value = false
      osmLoadingPct.value = 0
      osmLoadingStep.value = ""
    }
  }
}

function startMapDrag(clientX: number, clientY: number) {
  if (!mapDragSelectOn.value || roadToolActive.value || !controls) return false
  const p = getGroundPoint(clientX, clientY)
  if (!p) return false
  mapDragging = true
  mapDragMoved = false
  mapDragStartPoint = p.clone()
  mapDragStartLat = mapLat.value
  mapDragStartLng = mapLng.value
  mapDragStartZoom = mapZoom.value
  controls.enabled = false
  statusText.value = "เลื่อนแผนที่เพื่อเลือกตำแหน่ง..."
  return true
}

function updateMapDrag(clientX: number, clientY: number) {
  if (!mapDragging || !mapDragStartPoint) return
  const p = getGroundPoint(clientX, clientY)
  if (!p) return

  const dx = p.x - mapDragStartPoint.x
  const dz = p.z - mapDragStartPoint.z
  if (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02) mapDragMoved = true

  const z = Math.max(1, Math.min(20, Math.round(mapZoom.value)))
  const unitsPerTile = MAP_SURFACE_SIZE / MAP_TILE_SPAN
  const n = 2 ** z
  const shiftX = dx / unitsPerTile
  const shiftY = dz / unitsPerTile
  const tx = ((lonToTileX(mapDragStartLng, z) - shiftX) % n + n) % n
  const ty = Math.max(0, Math.min(n - 1, latToTileY(mapDragStartLat, z) + shiftY))

  mapLng.value = ((tileXToLon(tx, z) + 540) % 360) - 180
  mapLat.value = Math.max(-85.0511, Math.min(85.0511, tileYToLat(ty, z)))
}

async function endMapDrag(commit: boolean) {
  if (!mapDragging) return false
  mapDragging = false
  mapDragStartPoint = null
  if (controls) controls.enabled = true
  if (!commit) return true
  if (!mapDragMoved) {
    statusText.value = "Map drag cancelled"
    return true
  }
  await applyMapLocation({ anchorFrom: { lat: mapDragStartLat, lng: mapDragStartLng, zoom: mapDragStartZoom } })
  return true
}

async function searchMapPlace() {
  const query = mapSearchQuery.value.trim()
  if (query.length < 2) {
    mapSearchError.value = "พิมพ์ชื่อสถานที่อย่างน้อย 2 ตัวอักษร"
    mapSearchResults.value = []
    return
  }

  mapSearchError.value = ""
  mapSearchLoading.value = true
  const token = ++mapSearchToken
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = await res.json()
    if (token !== mapSearchToken) return
    mapSearchResults.value = (Array.isArray(rows) ? rows : [])
      .map((x: any) => ({
        display: String(x.display_name || "").trim(),
        lat: Number(x.lat),
        lng: Number(x.lon),
      }))
      .filter((x: any) => x.display && Number.isFinite(x.lat) && Number.isFinite(x.lng))
      .slice(0, 6)
    if (mapSearchResults.value.length === 0) mapSearchError.value = "ไม่พบสถานที่"
  } catch {
    if (token !== mapSearchToken) return
    mapSearchError.value = "ค้นหาสถานที่ไม่สำเร็จ"
    mapSearchResults.value = []
  } finally {
    if (token === mapSearchToken) mapSearchLoading.value = false
  }
}

async function applyMapSearchResult(item: { display: string; lat: number; lng: number }) {
  const prev = { lat: mapLat.value, lng: mapLng.value, zoom: mapZoom.value }
  mapLat.value = item.lat
  mapLng.value = item.lng
  // no zoom clamp on search
  mapSearchResults.value = []
  mapSearchError.value = ""
  await applyMapLocation({ anchorFrom: prev })
}

function getRaycastHit(clientX: number, clientY: number) {
  if (!renderer || !camera || !THREE) return null
  const rect = renderer.domElement.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null

  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)

  const targets: any[] = []
  for (const model of modelEntities.value) targets.push(model.root)
  if (mapSurfaceMesh) targets.push(mapSurfaceMesh)
  if (groundMesh) targets.push(groundMesh)
  if (targets.length === 0) return null

  const hits = raycaster.intersectObjects(targets, true)
  for (const hit of hits) {
    const obj = hit.object
    if (obj?.userData?.__isLightMarker) continue
    return hit
  }
  return null
}

function getGroundPoint(clientX: number, clientY: number) {
  if (!renderer || !camera || !THREE) return null
  const rect = renderer.domElement.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null

  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const point = new THREE.Vector3()
  const ok = raycaster.ray.intersectPlane(plane, point)
  if (ok) return point

  if (groundMesh) {
    const hits = raycaster.intersectObject(groundMesh, false)
    if (hits.length) return hits[0].point.clone()
  }

  const modelHits = raycaster.intersectObjects(modelEntities.value.map((x) => x.root), true)
  if (modelHits.length) {
    const p = modelHits[0].point.clone()
    p.y = 0
    return p
  }

  return null
}

function toggleRoadTool() {
  roadToolActive.value = !roadToolActive.value
  if (roadToolActive.value) {
    roadToolHint.value = "Road Tool ON: ลากวาดได้ทั้งเส้นโค้งและทางแยก (snap อัตโนมัติ)"
  } else {
    roadToolHint.value = "เปิด Road Tool แล้วลากบนพื้นเพื่อวาดถนน"
    stopRoadDrawing(false)
  }
}

function clearRoadPreview() {
  if (!roadPreview) return
  scene?.remove(roadPreview)
  roadPreview.geometry?.dispose?.()
  roadPreview.material?.dispose?.()
  roadPreview = null
}

function updateRoadPreview() {
  clearRoadPreview()
  if (!scene || !THREE || roadCurrentPoints.length < 2) return
  const previewPoints = roadCurrentPoints.map((p: any) => new THREE.Vector3(p.x, p.y + 0.03, p.z))
  const geo = new THREE.BufferGeometry().setFromPoints(previewPoints)
  const mat = new THREE.LineBasicMaterial({ color: 0x2e7fb7 })
  roadPreview = new THREE.Line(geo, mat)
  scene.add(roadPreview)
}

function normalizeRoadPoints(points: any[]) {
  if (!THREE || points.length < 2) return points

  const filtered = [points[0]]
  for (let i = 1; i < points.length; i += 1) {
    const prev = filtered[filtered.length - 1]
    if (points[i].distanceTo(prev) >= 0.25) filtered.push(points[i])
  }
  if (filtered.length < 2) filtered.push(points[points.length - 1])
  return filtered
}

function getNearestPointOnSegment(point: any, a: any, b: any) {
  const ab = b.clone().sub(a)
  const abLenSq = ab.lengthSq()
  if (abLenSq < 1e-8) return { point: a.clone(), distance: point.distanceTo(a) }
  const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(ab) / abLenSq))
  const projected = a.clone().add(ab.multiplyScalar(t))
  return { point: projected, distance: point.distanceTo(projected) }
}

function getNearestRoadAnchor(point: any, maxDistance: number) {
  if (!roadGroup || !point) return null
  let nearest = null
  let best = maxDistance
  for (const road of roadGroup.children) {
    const path = road?.userData?.__roadPath
    if (!Array.isArray(path) || path.length < 2) continue

    for (let i = 1; i < path.length; i += 1) {
      const proj = getNearestPointOnSegment(point, path[i - 1], path[i])
      if (proj.distance <= best) {
        best = proj.distance
        nearest = proj.point
      }
    }

    const endpoints = [path[0], path[path.length - 1]]
    for (const ep of endpoints) {
      const d = point.distanceTo(ep)
      if (d <= best) {
        best = d
        nearest = ep.clone()
      }
    }
  }
  return nearest
}

function createRoadMesh(points: any[]) {
  if (!THREE || !roadGroup || points.length < 2) return false
  const basePath = normalizeRoadPoints(points)
  if (basePath.length < 2) return false

  let drawPath = basePath
  if (basePath.length >= 3) {
    const curve = new THREE.CatmullRomCurve3(basePath, false, "catmullrom", 0.35)
    const sampleCount = Math.max(24, basePath.length * 10)
    drawPath = curve.getPoints(sampleCount)
  }

  const road = new THREE.Group()
  road.userData.__roadId = roadIdSeed++
  const roadWidth = 0.9
  const roadHeight = 0.03
  const roadY = 0.015

  const surfaceMat = new THREE.MeshStandardMaterial({ color: 0x5b6772, roughness: 0.95, metalness: 0.02 })
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xe6ecf2, roughness: 0.72, metalness: 0.0 })
  for (let i = 1; i < drawPath.length; i += 1) {
    const p0 = drawPath[i - 1]
    const p1 = drawPath[i]
    const dx = p1.x - p0.x
    const dz = p1.z - p0.z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.01) continue

    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, roadHeight, roadWidth), surfaceMat)
    seg.position.set((p0.x + p1.x) * 0.5, roadY, (p0.z + p1.z) * 0.5)
    seg.rotation.y = Math.atan2(dz, dx)
    seg.receiveShadow = true
    road.add(seg)

    const centerLine = new THREE.Mesh(new THREE.BoxGeometry(len * 0.88, roadHeight * 0.25, roadWidth * 0.08), lineMat)
    centerLine.position.set((p0.x + p1.x) * 0.5, roadY + roadHeight * 0.66, (p0.z + p1.z) * 0.5)
    centerLine.rotation.y = Math.atan2(dz, dx)
    centerLine.receiveShadow = true
    road.add(centerLine)
  }

  road.userData.__roadPath = drawPath.map((p: any) => p.clone())
  roadGroup.add(road)
  roadCount.value += 1
  return true
}

function clearAllRoads() {
  if (!roadGroup) return
  const roads = [...roadGroup.children]
  for (const road of roads) {
    roadGroup.remove(road)
    road.traverse?.((obj: any) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.())
        else obj.material.dispose?.()
      }
    })
  }
  roadCount.value = 0
}

function startRoadDrawing(clientX: number, clientY: number) {
  if (!roadToolActive.value || !controls) return false
  const start = getGroundPoint(clientX, clientY)
  if (!start) return false
  const snappedStart = getNearestRoadAnchor(start, roadSnapDistance)
  const startPoint = snappedStart || start
  roadCurrentPoints.length = 0
  roadCurrentPoints.push(startPoint)
  roadStartConnected = !!snappedStart
  roadDrawing = true
  controls.enabled = false
  statusText.value = snappedStart ? "Drawing road (snap start)..." : "Drawing road..."
  return true
}

function updateRoadDrawing(clientX: number, clientY: number) {
  if (!roadDrawing) return
  const p = getGroundPoint(clientX, clientY)
  if (!p) return
  const last = roadCurrentPoints[roadCurrentPoints.length - 1]
  if (!last || p.distanceTo(last) < 0.18) return
  roadCurrentPoints.push(p)
  updateRoadPreview()
}

function stopRoadDrawing(commit: boolean) {
  if (!roadDrawing && !commit) {
    clearRoadPreview()
    roadCurrentPoints.length = 0
    return
  }

  if (commit && roadCurrentPoints.length >= 1) {
    const endIdx = roadCurrentPoints.length - 1
    const snappedEnd = getNearestRoadAnchor(roadCurrentPoints[endIdx], roadSnapDistance)
    if (snappedEnd) {
      roadCurrentPoints[endIdx] = snappedEnd
    }
  }

  const shouldCreate = commit && roadCurrentPoints.length >= 2
  clearRoadPreview()
  if (shouldCreate) {
    const ok = createRoadMesh([...roadCurrentPoints])
    statusText.value = ok ? "Road created" : "Road create failed"
  } else if (roadDrawing) {
    statusText.value = "Road cancelled"
  }
  roadCurrentPoints.length = 0
  roadStartConnected = false
  roadDrawing = false
  if (controls) controls.enabled = true
}

function generateLightMeta(deviceId: number) {
  const zones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]
  const wattages = [70, 100, 150, 200, 250]
  const techs = ["สมชาย วงศ์ไฟฟ้า", "วิชัย ช่างไฟ BMA", "ทีมซ่อมบำรุง สาขา 3", "นายประสิทธิ์ ช่างกล", "บริษัท ABC Engineering"]
  const zone = zones[deviceId % zones.length]
  const wattage = wattages[deviceId % wattages.length]
  // Install date: 1–4 years ago
  const installYear = 2021 + (deviceId % 4)
  const installMonth = String(1 + (deviceId % 12)).padStart(2, "0")
  const installDay = String(1 + (deviceId % 28)).padStart(2, "0")
  const installDate = `${installYear}-${installMonth}-${installDay}`
  const history: { date: string; type: string; note: string; tech: string }[] = [
    { date: installDate, type: "การติดตั้ง", note: `ติดตั้งเสาไฟ LED ${wattage}W พร้อมสายไฟฟ้า`, tech: techs[deviceId % techs.length] },
  ]
  if (deviceId % 3 === 0) {
    history.push({ date: `${installYear + 1}-06-${installDay}`, type: "ตรวจสอบ", note: "ตรวจสอบประจำปีครั้งที่ 1 ปกติ", tech: techs[(deviceId + 1) % techs.length] })
  }
  if (deviceId % 2 === 0) {
    history.push({ date: `${installYear + 1}-11-15`, type: "เปลี่ยนหลอดไฟ", note: `เปลี่ยนหลอด LED ${wattage}W ชุดใหม่ (หลอดเดิมหมดอายุ)`, tech: techs[(deviceId + 2) % techs.length] })
  }
  if (deviceId % 5 === 0) {
    history.push({ date: `${installYear + 2}-03-20`, type: "ซ่อมบำรุง", note: "ซ่อมสายไฟฟ้าชำรุด และทาสีเสาใหม่", tech: techs[(deviceId + 3) % techs.length] })
  }
  history.push({ date: `${installYear + 2}-09-${installDay}`, type: "ตรวจสอบ", note: "ตรวจสอบประจำปี ระบบทำงานปกติ", tech: techs[(deviceId + 4) % techs.length] })
  return { zone, wattage, installDate, history }
}

function createLightDeviceAtPosition(basePosition: any, initialOn = true, customName?: string, savedMeta?: any) {
  if (!scene || !THREE || !basePosition) return null
  const deviceId = lightIdSeed++

  // ── Dimensions — classic goose-neck street light (large scale) ─────────
  // zoom-16: ~1 unit ≈ 6 m  →  pole 2.6 units ≈ 15 m (city street light)
  const poleH     = 2.6
  const poleRBot  = 0.052
  const poleRTop  = 0.026
  const baseH     = 0.10
  const baseR     = 0.092
  const collarH   = 0.065
  const collarR   = poleRTop * 2.4
  const armR      = 0.022
  const armReach  = 1.05    // how far the arm extends in X
  const armRise   = 0.60    // how high the arc peaks above poleTop
  const poleTop   = baseH + poleH
  // Lamp end — at tip of arm, slightly below poleTop (downward tilt)
  const lampEndX  = armReach + 0.04
  const lampEndY  = poleTop - 0.08
  // Lamp housing — cobra-head style (elongated capsule, flattened)
  const lampLen   = 0.46    // long axis length
  const lampCapR  = 0.14    // end-cap radius (before flattening)
  const lampFlatY = 0.65    // vertical flatten factor
  const visorT    = 0.014
  const bulbR     = 0.068
  const auraR     = bulbR * 6.0

  // ── Materials ─────────────────────────────────────────────────────────
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x8fa0b0, roughness: 0.40, metalness: 0.70,
  })
  const lampHousingMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8e0, roughness: 0.28, metalness: 0.75,
  })
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x111820, roughness: 0.12, metalness: 0.92,
  })
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfffae8, emissive: 0xffd04a, emissiveIntensity: 1.8,
    roughness: 0.04, metalness: 0,
  })

  const root = new THREE.Group()
  root.position.copy(basePosition)
  root.position.y = 0  // snap to ground level

  // ── Base plate (wide flange + tapered skirt) ───────────────────────────
  const baseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(baseR, baseR * 1.22, baseH, 20),
    poleMat.clone(),
  )
  baseMesh.position.y = baseH / 2
  baseMesh.castShadow = true

  // Decorative torus lip on base top edge
  const baseLipMesh = new THREE.Mesh(
    new THREE.TorusGeometry(baseR * 0.86, baseR * 0.09, 8, 28),
    poleMat.clone(),
  )
  baseLipMesh.rotation.x = Math.PI / 2
  baseLipMesh.position.y = baseH + 0.01

  // ── Main pole (tapered, 14-sided for smoother look) ────────────────────
  const poleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(poleRTop, poleRBot, poleH, 14),
    poleMat.clone(),
  )
  poleMesh.position.y = baseH + poleH / 2
  poleMesh.castShadow = true

  // ── Collar ring at pole top (where arm emerges) ────────────────────────
  const collarMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(collarR, collarR, collarH, 14),
    poleMat.clone(),
  )
  collarMesh.position.y = poleTop - collarH * 0.4

  // ── Goose-neck arm — smooth arc (hockey-stick / swan-neck) ─────────────
  // Curve: rises up and out from pole top, peaks, then descends to lamp end
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,               poleTop,                  0),
    new THREE.Vector3(armReach * 0.14, poleTop + armRise * 0.45, 0),
    new THREE.Vector3(armReach * 0.38, poleTop + armRise * 0.88, 0),
    new THREE.Vector3(armReach * 0.55, poleTop + armRise,        0),  // peak
    new THREE.Vector3(armReach * 0.72, poleTop + armRise * 0.78, 0),
    new THREE.Vector3(armReach * 0.88, poleTop + armRise * 0.40, 0),
    new THREE.Vector3(lampEndX,        lampEndY,                  0),  // lamp tip
  ])
  const armMesh = new THREE.Mesh(
    new THREE.TubeGeometry(armCurve, 32, armR, 10, false),
    poleMat.clone(),
  )
  armMesh.castShadow = true

  // ── Cobra-head lamp housing (CapsuleGeometry, horizontal, flattened) ────
  const lampCap = new THREE.CapsuleGeometry(lampCapR, lampLen - lampCapR * 2, 10, 20)
  lampCap.rotateZ(Math.PI / 2)  // orient lengthwise along X
  const lampMesh = new THREE.Mesh(lampCap, lampHousingMat.clone())
  lampMesh.scale.y = lampFlatY
  // Position: center of capsule at arm tip, sitting above the lens plane
  lampMesh.position.set(lampEndX, lampEndY + lampCapR * lampFlatY * 0.55, 0)
  lampMesh.castShadow = true

  // ── Visor / bottom diffuser panel ─────────────────────────────────────
  const visorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(lampLen * 0.88, visorT, lampCapR * 2 * 0.80),
    visorMat.clone(),
  )
  visorMesh.position.set(lampEndX, lampEndY - lampCapR * lampFlatY * 0.42, 0)

  // ── Glowing LED panel (flat ellipsoid lens) ────────────────────────────
  const bulbY = lampEndY - lampCapR * lampFlatY * 0.42 - visorT - bulbR * 0.18
  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(bulbR, 20, 14),
    bulbMat.clone(),
  )
  bulbMesh.scale.set(1.5, 0.38, 0.85)
  bulbMesh.position.set(lampEndX, bulbY, 0)

  // ── Tiny halo glow tight around lens only ─────────────────────────────
  const auraMesh = new THREE.Mesh(
    new THREE.SphereGeometry(bulbR * 2.2, 14, 14),
    new THREE.MeshBasicMaterial({
      color: 0xfff5c0, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  auraMesh.scale.set(1.4, 0.5, 1.0)  // match the flat lens shape
  auraMesh.position.copy(bulbMesh.position)

  // ── Downward light cone (tip at bulb, base at ground) ─────────────────
  const coneH = Math.max(0.4, bulbY - 0.06)
  const coneBaseR = coneH * 0.72
  const coneMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, coneBaseR, coneH, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff5c0, transparent: true, opacity: 0.10,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  // CylinderGeometry: tip at +coneH/2, base at -coneH/2
  // We want tip UP at bulb, base DOWN near ground
  coneMesh.position.set(lampEndX, bulbY - coneH / 2, 0)

  // ── Ground light pool (circle on map surface) ─────────────────────────
  const poolMesh = new THREE.Mesh(
    new THREE.CircleGeometry(coneBaseR * 0.80, 36),
    new THREE.MeshBasicMaterial({
      color: 0xffee88, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  poolMesh.rotation.x = -Math.PI / 2
  poolMesh.position.set(lampEndX, 0.02, 0)

  // ── PointLight — range-limited warm light (illuminates buildings + ground)
  //    No SpotLight/shadow-casting lights — those hit WebGL's max shadow uniform limit
  //    when many poles are placed, causing all materials to fail shader compile (model vanishes).
  //    The visual cone + pool meshes already show the downward beam effect.
  const pointLightOnIntensity = 22
  const roomFillOnIntensity = pointLightOnIntensity
  const roomFill = new THREE.PointLight(0xffaa40, pointLightOnIntensity, 28, 2)
  roomFill.position.set(lampEndX, bulbY, 0)

  // ── Tag all hittable parts ─────────────────────────────────────────────
  const tag = { __isLightMarker: true, __deviceId: deviceId }
  for (const m of [baseMesh, baseLipMesh, poleMesh, collarMesh, armMesh, lampMesh, visorMesh, bulbMesh]) {
    Object.assign(m.userData, tag)
  }
  for (const m of [auraMesh, coneMesh, poolMesh]) {
    m.userData.__isLightMarker = true
    m.userData.__deviceId = deviceId
    m.userData.__skipLightPick = true
  }

  root.add(baseMesh, baseLipMesh, poleMesh, collarMesh, armMesh, lampMesh, visorMesh,
    bulbMesh, auraMesh, coneMesh, poolMesh, roomFill)
  root.userData.__isLightRoot = true
  root.userData.__deviceId = deviceId
  scene.add(root)

  const meta = savedMeta ?? generateLightMeta(deviceId)
  lightDeviceMap.set(deviceId, {
    id: deviceId, root, bulb: bulbMesh, aura: auraMesh, cone: coneMesh, pool: poolMesh,
    roomFill, roomFillOnIntensity, roomFillOffIntensity: 0,
    on: true,
    zone: meta.zone,
    wattage: meta.wattage,
    installDate: meta.installDate,
    history: meta.history,
  })
  const name = customName || `เสาไฟ #${deviceId}`
  lightDevices.value = [...lightDevices.value, { id: deviceId, name, on: true }]
  setLightState(deviceId, !!initialOn)
  return deviceId
}

function createLightDevice(clientX: number, clientY: number) {
  if (!scene || !THREE) return
  const hit = getRaycastHit(clientX, clientY)
  if (!hit) {
    statusText.value = "วางไฟไม่สำเร็จ: ไม่พบพื้นผิว"
    return
  }
  const basePosition = hit.point.clone()
  const createdId = createLightDeviceAtPosition(basePosition, true)
  if (createdId != null) statusText.value = `วางเสาไฟ #${createdId} สำเร็จ`
}

function setLightState(deviceId: number, on: boolean) {
  const device = lightDeviceMap.get(deviceId)
  if (!device) return
  device.on = on
  if (device.roomFill) device.roomFill.intensity = on ? device.roomFillOnIntensity : device.roomFillOffIntensity
  // Tight halo around lens
  device.aura.material.opacity = on ? 0.55 : 0
  device.aura.scale.set(on ? 1.4 : 0, on ? 0.5 : 0, on ? 1.0 : 0)
  // Bulb glow
  device.bulb.material.emissiveIntensity = on ? 2.4 : 0.04
  device.bulb.material.color.setHex(on ? 0xfffad0 : 0x3a3a3a)
  // Downward cone
  if (device.cone) device.cone.material.opacity = on ? 0.10 : 0
  // Ground pool
  if (device.pool) device.pool.material.opacity = on ? 0.28 : 0
  lightDevices.value = lightDevices.value.map((x) => (x.id === deviceId ? { ...x, on } : x))
}

function openLightDetail(id: number) {
  selectedStreetLightId.value = id
  showStreetLightDetail.value = true
}

function closeLightDetail() {
  showStreetLightDetail.value = false
  selectedStreetLightId.value = null
}

function setAllLights(on: boolean) {
  for (const id of lightDeviceMap.keys()) setLightState(id, on)
}

function getSelectedLightDetail() {
  const id = selectedStreetLightId.value
  if (id == null) return null
  const device = lightDeviceMap.get(id)
  if (!device) return null
  const listEntry = lightDevices.value.find((x) => x.id === id)
  return {
    id: device.id,
    name: listEntry?.name ?? `เสาไฟ #${id}`,
    on: !!device.on,
    zone: device.zone ?? "—",
    wattage: device.wattage ?? "—",
    installDate: device.installDate ?? "—",
    history: (device.history ?? []) as { date: string; type: string; note: string; tech: string }[],
    posX: device.root?.position?.x?.toFixed(2) ?? "—",
    posZ: device.root?.position?.z?.toFixed(2) ?? "—",
  }
}

function openLightRotateMenu(id: number, clientX: number, clientY: number) {
  const device = lightDeviceMap.get(id)
  if (!device) return
  lightRotateMenuId.value = id
  // Current rotation in degrees (normalised 0-360)
  const deg = ((device.root.rotation.y * 180) / Math.PI) % 360
  lightRotateMenuAngle.value = Math.round(deg < 0 ? deg + 360 : deg)
  // Keep menu on screen (menu is ~260px wide, 220px tall)
  const menuW = 270, menuH = 230
  lightRotateMenuX.value = Math.min(clientX, window.innerWidth - menuW - 8)
  lightRotateMenuY.value = Math.min(clientY, window.innerHeight - menuH - 60)
  showLightRotateMenu.value = true
}

function closeLightRotateMenu() {
  showLightRotateMenu.value = false
  lightRotateMenuId.value = null
  lrmDragging = false
}

function onLrmPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  lrmDragging = true
  lrmDragOffX = e.clientX - lightRotateMenuX.value
  lrmDragOffY = e.clientY - lightRotateMenuY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  e.stopPropagation()
}

function onLrmPointerMove(e: PointerEvent) {
  if (!lrmDragging) return
  const menuW = 270, menuH = 230
  lightRotateMenuX.value = Math.max(0, Math.min(e.clientX - lrmDragOffX, window.innerWidth - menuW - 4))
  lightRotateMenuY.value = Math.max(0, Math.min(e.clientY - lrmDragOffY, window.innerHeight - menuH - 60))
  e.stopPropagation()
}

function onLrmPointerUp(e: PointerEvent) {
  lrmDragging = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
}

function rotateLightBy(deltaDeg: number) {
  const id = lightRotateMenuId.value
  if (id == null) return
  const device = lightDeviceMap.get(id)
  if (!device) return
  device.root.rotation.y += (deltaDeg * Math.PI) / 180
  const deg = ((device.root.rotation.y * 180) / Math.PI) % 360
  lightRotateMenuAngle.value = Math.round(deg < 0 ? deg + 360 : deg)
}

function setLightRotation(deg: number) {
  const id = lightRotateMenuId.value
  if (id == null) return
  const device = lightDeviceMap.get(id)
  if (!device) return
  device.root.rotation.y = (deg * Math.PI) / 180
  lightRotateMenuAngle.value = deg
}

function onViewportContextMenu(e: MouseEvent) {
  e.preventDefault()
  const id = pickLightFromPoint(e.clientX, e.clientY)
  if (id != null) {
    showStreetLightDetail.value = false   // close detail if open
    openLightRotateMenu(id, e.clientX, e.clientY)
  } else {
    closeLightRotateMenu()
  }
}

function toggleLightState(deviceId: number) {
  const device = lightDeviceMap.get(deviceId)
  if (!device) return
  setLightState(deviceId, !device.on)
}

function startLightDrag(deviceId: number, clientX: number, clientY: number) {
  if (!THREE || !controls) return false
  const device = lightDeviceMap.get(deviceId)
  if (!device?.root) return false
  const p = getGroundPoint(clientX, clientY)
  if (!p) return false
  draggingLightId = deviceId
  lightDragOffset = device.root.position.clone().sub(p)
  controls.enabled = false
  statusText.value = `Dragging ${device.name || `Light ${deviceId}`}`
  return true
}

function updateLightDrag(clientX: number, clientY: number) {
  if (draggingLightId == null || !lightDragOffset) return
  const device = lightDeviceMap.get(draggingLightId)
  if (!device?.root) return
  const p = getGroundPoint(clientX, clientY)
  if (!p) return
  device.root.position.x = p.x + (lightDragOffset.x || 0)
  device.root.position.z = p.z + (lightDragOffset.z || 0)
  device.root.updateMatrixWorld(true)
}

function endLightDrag() {
  if (draggingLightId == null) return null
  const deviceId = draggingLightId
  const device = lightDeviceMap.get(deviceId)
  draggingLightId = null
  lightDragOffset = null
  if (controls) controls.enabled = true
  if (device?.root) device.root.updateMatrixWorld(true)
  return deviceId
}

function removeLightDevice(deviceId: number) {
  const device = lightDeviceMap.get(deviceId)
  if (!device) return

  scene?.remove(device.root)
  device.root.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.())
      else obj.material.dispose?.()
    }
    if (obj.isLight) obj.dispose?.()
  })
  lightDeviceMap.delete(deviceId)
  lightDevices.value = lightDevices.value.filter((x) => x.id !== deviceId)
  statusText.value = `Removed Light ${deviceId}`
}

function pickLightFromPoint(clientX: number, clientY: number) {
  if (!renderer || !camera || !THREE) return null
  const rect = renderer.domElement.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null

  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)

  const roots = Array.from(lightDeviceMap.values()).map((x) => x.root)
  if (roots.length === 0) return null
  const hits = raycaster.intersectObjects(roots, true)
  for (const hit of hits) {
    if (hit.object?.userData?.__skipLightPick) continue
    const id = hit.object?.userData?.__deviceId ?? hit.object?.parent?.userData?.__deviceId
    if (typeof id === "number") return id
  }
  return null
}

function findModelRootFromObject(obj: any) {
  let cur = obj
  while (cur) {
    if (typeof cur?.userData?.__modelId === "number") return cur
    cur = cur.parent
  }
  return null
}

function pickModelFromPoint(clientX: number, clientY: number) {
  if (!renderer || !camera || !THREE || modelEntities.value.length === 0) return null
  const rect = renderer.domElement.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null

  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(modelEntities.value.map((x) => x.root), true)
  for (const hit of hits) {
    const root = findModelRootFromObject(hit.object)
    const id = root?.userData?.__modelId
    if (typeof id === "number") {
      return { id, hit }
    }
  }
  return null
}

function startModelDrag(modelId: number, hitPoint: any) {
  if (!THREE || !controls) return
  const selected = modelEntities.value.find((x) => x.id === modelId)
  if (!selected) return

  draggingModelId = modelId
  selectModel(modelId, false)
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selected.root.position.y)
  dragOffset = selected.root.position.clone().sub(hitPoint)
  controls.enabled = false
  statusText.value = `Dragging ${selected.name}`
}

function updateModelDrag(clientX: number, clientY: number) {
  if (draggingModelId == null || !renderer || !camera || !THREE || !dragPlane || !dragOffset) return
  const selected = modelEntities.value.find((x) => x.id === draggingModelId)
  if (!selected) return

  const rect = renderer.domElement.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const point = new THREE.Vector3()
  const ok = raycaster.ray.intersectPlane(dragPlane, point)
  if (!ok) return

  point.add(dragOffset)
  selected.root.position.set(point.x, selected.root.position.y, point.z)
  selected.root.updateMatrixWorld(true)
  syncTransformFromSelected()
  applyWallTransparency()
  updateSelectedModelMarker()
}

function endModelDrag() {
  if (draggingModelId == null) return
  const selected = modelEntities.value.find((x) => x.id === draggingModelId)
  controls.enabled = true
  draggingModelId = null
  dragPlane = null
  dragOffset = null
  if (selected) {
    selected.pinToMap = false
    selected.root.updateMatrixWorld(true)
    syncTransformFromSelected()
    statusText.value = `Moved ${selected.name}`
    updateSelectedModelMarker()
  }
}

function onViewportPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  activePointerId = e.pointerId
  renderer?.domElement?.setPointerCapture?.(e.pointerId)
  // ── Water Pipe Tool ──
  if (wpToolOpen.value) {
    e.preventDefault()
    if (wpToolMode.value === 'pipe') {
      startWPDraw(e.clientX, e.clientY)
      pointerDownMoved = true
    } else {
      placeWPNode(e.clientX, e.clientY)
    }
    return
  }
  if (roadToolActive.value) {
    e.preventDefault()
    const started = startRoadDrawing(e.clientX, e.clientY)
    if (started) {
      pointerDownMoved = true
      pointerDownX = e.clientX
      pointerDownY = e.clientY
      return
    }
  }

  pointerDownMoved = false
  pointerDownX = e.clientX
  pointerDownY = e.clientY
  const lightPick = pickLightFromPoint(e.clientX, e.clientY)
  if (lightPick != null) {
    const startedLightDrag = startLightDrag(lightPick, e.clientX, e.clientY)
    if (startedLightDrag) return
  }
  const modelPick = pickModelFromPoint(e.clientX, e.clientY)
  if (modelPick) {
    startModelDrag(modelPick.id, modelPick.hit.point)
    return
  }
  const startedMapDrag = startMapDrag(e.clientX, e.clientY)
  if (startedMapDrag) {
    pointerDownMoved = true
  }
}

function onViewportPointerMove(e: PointerEvent) {
  if (activePointerId != null && e.pointerId !== activePointerId) return
  if (wpDrawing) {
    pointerDownMoved = true
    updateWPDraw(e.clientX, e.clientY)
    return
  }
  if (roadDrawing) {
    pointerDownMoved = true
    updateRoadDrawing(e.clientX, e.clientY)
    return
  }

  const dx = e.clientX - pointerDownX
  const dy = e.clientY - pointerDownY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pointerDownMoved = true
  if (draggingModelId != null) {
    pointerDownMoved = true
    updateModelDrag(e.clientX, e.clientY)
    return
  }
  if (draggingLightId != null) {
    pointerDownMoved = true
    updateLightDrag(e.clientX, e.clientY)
    return
  }
  if (mapDragging) {
    pointerDownMoved = true
    updateMapDrag(e.clientX, e.clientY)
  }
}

async function onViewportPointerUp(e: PointerEvent) {
  if (activePointerId != null && e.pointerId !== activePointerId) return
  renderer?.domElement?.releasePointerCapture?.(e.pointerId)
  activePointerId = null
  if (wpDrawing) {
    stopWPDraw(true)
    return
  }
  if (roadDrawing) {
    stopRoadDrawing(true)
    return
  }

  if (draggingModelId != null) {
    endModelDrag()
    return
  }
  if (draggingLightId != null) {
    const deviceId = endLightDrag()
    if (!pointerDownMoved && deviceId != null) openLightDetail(deviceId)
    return
  }
  if (mapDragging) {
    await endMapDrag(true)
    return
  }
  if (pointerDownMoved) return
  const id = pickLightFromPoint(e.clientX, e.clientY)
  if (id != null) {
    openLightDetail(id)
    return
  }
  if (lightPlaceMode.value && !roadToolActive.value) {
    createLightDevice(e.clientX, e.clientY)
  }
}

function onViewportPointerCancel() {
  activePointerId = null
  if (wpDrawing) stopWPDraw(false)
  if (roadDrawing) stopRoadDrawing(false)
  if (draggingModelId != null) endModelDrag()
  if (draggingLightId != null) endLightDrag()
  if (mapDragging) void endMapDrag(false)
}

function onLightDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", "smart-light")
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy"
  dragLightActive.value = true
  dragLightHint.value = "ปล่อยเมาส์บนโมเดลเพื่อวางหลอดไฟ"
}

function onLightDragEnd() {
  dragLightActive.value = false
  dragLightHint.value = "ลากไอคอนหลอดไฟไปวางบนโมเดล"
}

function onViewportDragOver(e: DragEvent) {
  if (cctvDragCamId.value !== null) { e.preventDefault(); cctvDragOver.value = true; return }
  if (walkDragActive.value) { e.preventDefault(); return }
  if (!dragLightActive.value) return
  e.preventDefault()
}

function onViewportDrop(e: DragEvent) {
  if (cctvDragCamId.value !== null) { onCctvDropOnMap(e); return }
  if (walkDragActive.value) {
    e.preventDefault()
    walkDragActive.value = false
    dropWalkPerson(e.clientX, e.clientY)
    return
  }
  if (!dragLightActive.value) return
  e.preventDefault()
  createLightDevice(e.clientX, e.clientY)
  dragLightActive.value = false
  dragLightHint.value = "ลากไอคอนหลอดไฟไปวางบนโมเดล"
}

function fitRenderer() {
  if (!viewport.value || !renderer || !camera) return
  const w = viewport.value.clientWidth
  const h = viewport.value.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function getFileRelPath(f: File) {
  const rel = (f as any).webkitRelativePath ? String((f as any).webkitRelativePath) : f.name
  return rel.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "")
}

function normalizeRelPath(relPath: string) {
  return String(relPath || "").replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "")
}

function sanitizeStorageSegment(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/[^\w\-./]+/g, "_")
    .replace(/_{2,}/g, "_")
}

function openFilePicker() {
  if (!viewerReady.value) {
    statusText.value = "Initializing viewer..."
  }
  fileInput.value?.click()
}

async function onPickFile(e: Event) {
  errorText.value = ""
  statusText.value = "Loading..."
  if (!viewerReady.value) {
    try {
      initPromise ||= initThree()
      await initPromise
    } catch (err: any) {
      errorText.value = `Viewer init failed: ${err?.message || err}`
      statusText.value = "Failed"
      return
    }
  }

  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (files.length === 0) {
    statusText.value = "Ready"
    return
  }

  clearLocalFileMap()

  const sourceFiles = files.map((f) => ({
    relPath: getFileRelPath(f),
    name: f.name,
    size: f.size,
    type: f.type || "application/octet-stream",
    file: f,
  }))
  pickedSourceFiles.value = sourceFiles

  for (const entry of sourceFiles) {
    const f = entry.file
    const url = URL.createObjectURL(f)
    objectUrlPool.push(url)
    localFileMap.set(entry.relPath, url)
    localFileMap.set(entry.relPath.replace(/^.*\//, ""), url)
  }

  const modelFiles = files.filter(
    (f) => f.name.toLowerCase().endsWith(".glb") || f.name.toLowerCase().endsWith(".gltf"),
  )
  pickedModelRootFiles.value = modelFiles.map((f) => getFileRelPath(f))

  if (modelFiles.length === 0) {
    errorText.value = "Only .glb/.gltf supported"
    statusText.value = "Failed"
    return
  }

  selectedFileName.value = modelFiles.map((x) => x.name).join(", ")
  loadedAssetCount.value = files.length

  try {
    for (const modelFile of modelFiles) {
      const relPath = getFileRelPath(modelFile)
      if (modelFile.name.toLowerCase().endsWith(".glb")) {
        const blobUrl = localFileMap.get(relPath) || localFileMap.get(modelFile.name)!
        await loadModelFromUrl(blobUrl, modelFile.name, relPath)
      } else {
        const ab = await modelFile.arrayBuffer()
        await loadModelFromArrayBuffer(ab, modelFile.name, relPath)
      }
    }
    frameAllModels()
    statusText.value = `Loaded ${modelFiles.length} model(s)`
  } catch (err: any) {
    errorText.value = err?.message || "Load failed"
    statusText.value = "Failed"
  }
}

function clearFocusArtifacts() {
  if (modelFocusLight) {
    scene?.remove(modelFocusLight.target)
    scene?.remove(modelFocusLight)
    modelFocusLight = null
  }
}

function ensureSelectedModelMarker() {
  if (!scene || !THREE || selectedModelMarker) return
  const group = new THREE.Group()
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.06, 12, 56),
    new THREE.MeshBasicMaterial({
      color: 0x1f86d8,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  ring.rotation.x = Math.PI / 2
  ring.renderOrder = 8

  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, 48),
    new THREE.MeshBasicMaterial({
      color: 0x8fd1ff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  disk.rotation.x = -Math.PI / 2
  disk.renderOrder = 7

  group.add(disk)
  group.add(ring)
  group.visible = false
  scene.add(group)
  selectedModelMarker = group
}

function clearSelectedModelMarker() {
  if (!selectedModelMarker) return
  scene?.remove(selectedModelMarker)
  selectedModelMarker.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.())
      else obj.material.dispose?.()
    }
  })
  selectedModelMarker = null
}

function updateSelectedModelMarker() {
  if (!THREE || !selectedModelMarker) return
  const selected = getSelectedModelEntity()
  if (!selected?.root) {
    selectedModelMarker.visible = false
    return
  }

  const box = new THREE.Box3().setFromObject(selected.root)
  if (box.isEmpty()) {
    selectedModelMarker.visible = false
    return
  }
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const radius = Math.max(0.55, Math.min(4.2, Math.max(size.x, size.z) * 0.58 + 0.3))

  selectedModelMarker.position.set(center.x, Math.max(0.025, box.min.y + 0.03), center.z)
  selectedModelMarker.scale.set(radius, radius, radius)
  selectedModelMarker.visible = true
}

function disposeModelRoot(root: any) {
  root?.parent?.remove?.(root)
  scene?.remove(root)
  root?.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.())
      else obj.material.dispose?.()
    }
  })
}

function removeModelEntity(id: number) {
  const targetId = Number(id)
  const idx = modelEntities.value.findIndex((x) => x.id === targetId)
  if (idx < 0) return false
  const entry = modelEntities.value[idx]
  modelEntities.value.splice(idx, 1)
  modelSourceMap.delete(targetId)
  try {
    disposeModelRoot(entry.root)
  } catch {
    // keep removal resilient even if dispose errors
  }

  if (selectedModelId.value === targetId) {
    selectedModelId.value = null
    clearFocusArtifacts()
    if (selectedModelMarker) selectedModelMarker.visible = false
  }

  hasModel.value = modelEntities.value.length > 0
  if (!hasModel.value) panelModelOpen.value = false
  if (!hasModel.value) {
    for (const deviceId of Array.from(lightDeviceMap.keys())) removeLightDevice(deviceId)
  }
  return true
}

function clearAllModels() {
  const ids = modelEntities.value.map((x) => x.id)
  for (const id of ids) removeModelEntity(id)
}

function reconcileModelEntitiesFromScene() {
  if (!scene) return
  const roots = scene.children.filter((obj: any) => typeof obj?.userData?.__modelId === "number")
  const rootById = new Map<number, any>()
  for (const root of roots) {
    const id = Number(root?.userData?.__modelId)
    if (Number.isFinite(id)) rootById.set(id, root)
  }

  modelEntities.value = modelEntities.value.filter((entry) => {
    const root = rootById.get(entry.id)
    return !!root && root === entry.root
  })

  const existing = new Set(modelEntities.value.map((m) => m.id))
  for (const [id, root] of rootById.entries()) {
    if (existing.has(id)) continue
    const name = String(root?.userData?.__modelName || `Model #${id}`)
    modelEntities.value.push({ id, name, root, pinToMap: root?.userData?.__pinToMap !== false })
  }

  let maxId = 0
  for (const entity of modelEntities.value) {
    if (entity.id > maxId) maxId = entity.id
    const sourceRel = normalizeRelPath(String(entity.root?.userData?.__sourceRelPath || ""))
    if (sourceRel) modelSourceMap.set(entity.id, sourceRel)
  }
  modelIdSeed = Math.max(modelIdSeed, maxId + 1)

  if (selectedModelId.value != null && !modelEntities.value.some((m) => m.id === selectedModelId.value)) {
    selectedModelId.value = null
  }
  hasModel.value = modelEntities.value.length > 0
  if (!hasModel.value && selectedModelMarker) selectedModelMarker.visible = false
}

function getSelectedModelEntity() {
  if (selectedModelId.value == null) return null
  return modelEntities.value.find((x) => x.id === selectedModelId.value) || null
}

function syncTransformFromSelected() {
  const selected = getSelectedModelEntity()
  if (!selected || !THREE) return
  transformX.value = Number(selected.root.position.x.toFixed(2))
  transformY.value = Number(selected.root.position.y.toFixed(2))
  transformZ.value = Number(selected.root.position.z.toFixed(2))
  transformRotY.value = Number(THREE.MathUtils.radToDeg(selected.root.rotation.y).toFixed(1))
  transformScale.value = Number(selected.root.scale.x.toFixed(3))
}

function selectModel(id: number | null, frame = false) {
  selectedModelId.value = id
  if (id != null) panelModelOpen.value = true
  syncTransformFromSelected()
  updateSelectedModelMarker()
  if (!frame || id == null) return
  const selected = getSelectedModelEntity()
  if (selected) frameModel(selected.root)
}

function applySelectedTransform() {
  const selected = getSelectedModelEntity()
  if (!selected || !THREE) return
  selected.pinToMap = false
  selected.root.position.set(transformX.value, transformY.value, transformZ.value)
  selected.root.rotation.y = THREE.MathUtils.degToRad(transformRotY.value)
  const s = Math.max(0.001, transformScale.value)
  selected.root.scale.setScalar(s)
  selected.root.updateMatrixWorld(true)
  syncTransformFromSelected()
  transformScale.value = s
  applyWallTransparency()
  updateSelectedModelMarker()
}

function nudgeSelected(axis: "x" | "y" | "z", delta: number) {
  if (axis === "x") transformX.value = Number((transformX.value + delta).toFixed(2))
  if (axis === "y") transformY.value = Number((transformY.value + delta).toFixed(2))
  if (axis === "z") transformZ.value = Number((transformZ.value + delta).toFixed(2))
  applySelectedTransform()
}

function focusSelectedModel() {
  const selected = getSelectedModelEntity()
  if (selected) frameModel(selected.root)
}

function onSelectedModelChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  if (!raw) {
    selectModel(null, false)
    return
  }
  const id = Number(raw)
  if (Number.isFinite(id)) selectModel(id, false)
}

function removeSelectedModel() {
  reconcileModelEntitiesFromScene()
  const selected = getSelectedModelEntity()
  const fallback = !selected && modelEntities.value.length > 0 ? modelEntities.value[modelEntities.value.length - 1] : null
  const id = selected?.id ?? fallback?.id ?? (selectedModelId.value != null ? Number(selectedModelId.value) : null)
  if (id == null || !Number.isFinite(id)) {
    statusText.value = "Delete failed: no selected model"
    return
  }
  const ok = removeModelEntity(id)
  if (!ok) {
    statusText.value = `Delete failed: model #${id} not found`
    selectedModelId.value = null
    updateSelectedModelMarker()
    return
  }
  statusText.value = `Deleted model #${id}`
  if (modelEntities.value.length > 0) frameAllModels()
}

function createIndependentClone(source: any) {
  if (!source) return null
  const clone = source.clone(true)
  clone.traverse((obj: any) => {
    if (!obj?.isMesh) return
    if (obj.geometry?.clone) obj.geometry = obj.geometry.clone()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material = obj.material.map((m: any) => (m?.clone ? m.clone() : m))
      else if (obj.material.clone) obj.material = obj.material.clone()
    }
  })
  return clone
}

function prepareModelRootForScene(root: any) {
  if (!THREE || !root) return
  root.traverse((obj: any) => {
    if (!obj.isMesh) return
    obj.castShadow = true
    obj.receiveShadow = true
    if (!obj.geometry.attributes?.normal) obj.geometry.computeVertexNormals?.()

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m: any) => {
      if (!m) return
      m.side = THREE.DoubleSide
      m.needsUpdate = true
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
      if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace
      if (typeof m.metalness === "number" && m.metalness > 0.9) m.metalness = 0.65
      if (typeof m.roughness === "number" && m.roughness < 0.05) m.roughness = 0.18
      if (!m.userData) m.userData = {}
      if (!m.userData.__orig) {
        m.userData.__orig = {
          transparent: !!m.transparent,
          opacity: typeof m.opacity === "number" ? m.opacity : 1,
          depthWrite: m.depthWrite !== false,
          depthTest: m.depthTest !== false,
          color: m.color ? [m.color.r, m.color.g, m.color.b] : null,
          emissive: m.emissive ? [m.emissive.r, m.emissive.g, m.emissive.b] : null,
          metalness: typeof m.metalness === "number" ? m.metalness : null,
          roughness: typeof m.roughness === "number" ? m.roughness : null,
        }
      }
    })
  })
}

function addModelToScene(root: any, name: string, select = true, sourceRelPath?: string) {
  if (!root) return
  root.userData.__modelId = modelIdSeed
  root.userData.__modelName = String(name || `Model #${modelIdSeed}`)
  if (sourceRelPath) root.userData.__sourceRelPath = normalizeRelPath(sourceRelPath)
  scene.add(root)
  modelEntities.value.push({ id: modelIdSeed, name, root, pinToMap: true })
  if (sourceRelPath) modelSourceMap.set(modelIdSeed, normalizeRelPath(sourceRelPath))
  if (select) selectModel(modelIdSeed, false)
  modelIdSeed += 1
  hasModel.value = true
  // defer heavy wall-transparency pass so browser renders the model first
  requestAnimationFrame(() => applyWallTransparency())
}

function copySelectedModel() {
  const selected = getSelectedModelEntity()
  if (!selected) return
  const clone = createIndependentClone(selected.root)
  if (!clone) return
  const sourceRelPath = modelSourceMap.get(selected.id) || selected.root?.userData?.__sourceRelPath || null
  modelClipboard.value = { name: `${selected.name} (copy)`, root: clone, sourceRelPath: sourceRelPath ? String(sourceRelPath) : null }
  statusText.value = `Copied ${selected.name}`
}

function pasteCopiedModel() {
  if (!modelClipboard.value) return
  const selected = getSelectedModelEntity()
  const root = createIndependentClone(modelClipboard.value.root)
  if (!root) return
  prepareModelRootForScene(root)

  if (selected) {
    root.position.copy(selected.root.position.clone().add(new THREE.Vector3(2, 0, 2)))
    root.rotation.copy(selected.root.rotation)
    root.scale.copy(selected.root.scale)
  } else {
    const seedPos = getAutoPlacementPosition(modelEntities.value.length, 1)
    root.position.set(seedPos.x, 0, seedPos.z)
  }
  root.updateMatrixWorld(true)
  addModelToScene(root, modelClipboard.value.name, true, modelClipboard.value.sourceRelPath || undefined)
  statusText.value = "Model pasted"
}

function normalizeImportedModelRoot(root: any) {
  if (!THREE) return
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.sub(center)
  root.updateMatrixWorld(true)

  const boxAfter = new THREE.Box3().setFromObject(root)
  const minY = boxAfter.min.y
  if (Number.isFinite(minY)) root.position.y -= minY
  root.updateMatrixWorld(true)
}

function getMapHalfSize() {
  return MAP_SURFACE_SIZE * 0.5
}

function getAutoPlacementPosition(index: number, radius: number) {
  if (!THREE || index <= 0) return new THREE.Vector3(0, 0, 0)
  const ring = Math.floor((index - 1) / 8) + 1
  const slot = (index - 1) % 8
  const angle = (slot / 8) * Math.PI * 2
  const radialStep = Math.max(8, Math.min(18, radius * 2.4))
  const dist = ring * radialStep
  const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
  const half = getMapHalfSize() - Math.max(radius * 1.1, 6)
  pos.x = Math.max(-half, Math.min(half, pos.x))
  pos.z = Math.max(-half, Math.min(half, pos.z))
  return pos
}

function frameAllModels() {
  if (!THREE || !camera || !controls || modelEntities.value.length === 0) return
  const box = new THREE.Box3()
  for (const entity of modelEntities.value) box.expandByObject(entity.root)
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  modelRadius = Math.max(sphere.radius, 0.5)
  modelCenter = center.clone()

  if (scene?.fog) {
    scene.fog.near = Math.max(modelRadius * 10, 260)
    scene.fog.far = Math.max(modelRadius * 64, 1800)
  }

  const outsideDir = new THREE.Vector3(1.35, 1.08, 1.2).normalize()
  const dist = modelRadius * 4.4
  const targetY = center.y + size.y * 0.1
  camera.position.copy(center.clone().add(outsideDir.multiplyScalar(dist)))
  controls.target.set(center.x, targetY, center.z)
  controls.minDistance = modelRadius * 1.1
  controls.maxDistance = Math.max(modelRadius * 80, 5000)
  camera.near = Math.max(0.01, modelRadius / 500)
  camera.far = Math.max(2000, modelRadius * 240)
  camera.updateProjectionMatrix()
  controls.update()

  defaultCamPos = [camera.position.x, camera.position.y, camera.position.z]
  defaultTarget = [center.x, targetY, center.z]
  ensureModelFocus(center, size)
}

async function loadModelFromUrl(url: string, fileName: string, sourceRelPath?: string) {
  if (!loader) throw new Error("Viewer is not ready")
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene || gltf.scenes?.[0]
  if (!root) throw new Error("No scene in model")
  normalizeImportedModelRoot(root)
  const seedPos = getAutoPlacementPosition(modelEntities.value.length, 1)
  root.position.set(seedPos.x, 0, seedPos.z)
  root.updateMatrixWorld(true)
  addModelToScene(root, fileName, false, sourceRelPath)
  if (selectedModelId.value != null) syncTransformFromSelected()
  requestAnimationFrame(() => prepareModelRootForScene(root))
}

async function loadModelFromArrayBuffer(ab: ArrayBuffer, fileName: string, sourceRelPath?: string) {
  if (!loader) throw new Error("Viewer is not ready")

  const path = fileName.toLowerCase().endsWith(".gltf") ? "./" : ""

  // yield to browser so status text renders before heavy parse
  await new Promise(r => setTimeout(r, 0))

  const gltf = await new Promise<any>((resolve, reject) => {
    loader.parse(
      ab,
      path,
      (data: any) => resolve(data),
      (err: any) => reject(err),
    )
  })

  const root = gltf.scene || gltf.scenes?.[0]
  if (!root) throw new Error("No scene in model")

  // add to scene first so user sees model immediately, then prepare materials
  normalizeImportedModelRoot(root)
  const seedPos = getAutoPlacementPosition(modelEntities.value.length, 1)
  root.position.set(seedPos.x, 0, seedPos.z)
  root.updateMatrixWorld(true)

  addModelToScene(root, fileName, false, sourceRelPath)
  if (selectedModelId.value != null) syncTransformFromSelected()

  // defer material/shadow setup to after first render frame
  requestAnimationFrame(() => prepareModelRootForScene(root))
}

function clearLocalFileMap() {
  localFileMap.clear()
  for (const url of objectUrlPool) URL.revokeObjectURL(url)
  objectUrlPool.length = 0
}

function isWallLikeMaterial(m: any) {
  if (!m) return false
  const name = String(m.name || "").toLowerCase()
  if (name.includes("glass") || name.includes("window") || name.includes("metal") || name.includes("chrome")) return false
  if (name.includes("wood") || name.includes("fabric") || name.includes("sofa") || name.includes("chair") || name.includes("table")) return false
  if (m.transparent && typeof m.opacity === "number" && m.opacity < 0.9) return false
  if (!m.color) return false

  const hasTexture = !!(m.map || m.normalMap || m.roughnessMap || m.metalnessMap || m.emissiveMap || m.aoMap)
  if (hasTexture) return false
  const r = m.color.r ?? 1
  const g = m.color.g ?? 1
  const b = m.color.b ?? 1
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const brightness = (r + g + b) / 3

  return spread < 0.12 && brightness > 0.2
}

function isLikelyWallMesh(obj: any, m: any) {
  const n = String(obj?.name || "").toLowerCase()
  if (n.includes("wall") || n.includes("partition") || n.includes("facade") || n.includes("exterior")) return true
  if (n.includes("chair") || n.includes("table") || n.includes("sofa") || n.includes("bed") || n.includes("plant")) return false

  if (!obj?.geometry) return false
  if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox?.()
  const bb = obj.geometry.boundingBox
  if (!bb) return false

  const s = new THREE.Vector3()
  bb.getSize(s)
  const dims = [Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)].sort((a, b) => a - b)
  const [shortest, mid, longest] = dims
  const thinRatio = shortest / Math.max(longest, 0.0001)
  const largeEnough = longest > modelRadius * 0.45 || mid > modelRadius * 0.25

  // thin + broad panel heuristic for walls, avoid tiny interior props
  if (largeEnough && thinRatio < 0.11 && isWallLikeMaterial(m)) return true

  // no broad fallback; keep non-wall objects untouched
  return false
}

function applyWallTransparency() {
  if (modelEntities.value.length === 0) return
  const occluders = wallTransparentOn.value ? collectCameraOccluderMeshes() : new Set<any>()

  for (const entity of modelEntities.value) {
    entity.root.traverse((obj: any) => {
      if (!obj.isMesh || !obj.material || !obj.geometry) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]

      mats.forEach((m: any) => {
        if (!m?.userData?.__orig) return
        const orig = m.userData.__orig
        const wallLike = isLikelyWallMesh(obj, m)
        const occludingCamera = occluders.has(obj)

        if (!(wallTransparentOn.value && (wallLike || occludingCamera))) {
          m.transparent = orig.transparent
          m.opacity = orig.opacity
          m.depthWrite = orig.depthWrite
          m.depthTest = orig.depthTest
          if (orig.color && m.color) m.color.setRGB(orig.color[0], orig.color[1], orig.color[2])
          if (orig.emissive && m.emissive) m.emissive.setRGB(orig.emissive[0], orig.emissive[1], orig.emissive[2])
          if (typeof orig.metalness === "number") m.metalness = orig.metalness
          if (typeof orig.roughness === "number") m.roughness = orig.roughness
          m.needsUpdate = true
          return
        }

        m.transparent = true
        m.opacity = 0.17
        m.depthWrite = false
        m.depthTest = true
        if (m.color) m.color.setRGB(0.86, 0.92, 0.98)
        if (m.emissive) m.emissive.setRGB(0.0, 0.0, 0.0)
        if (typeof m.metalness === "number") m.metalness = 0.02
        if (typeof m.roughness === "number") m.roughness = 0.04
        if (typeof m.ior === "number") m.ior = 1.5
        if (typeof m.transmission === "number") m.transmission = 0.65
        if (typeof m.thickness === "number") m.thickness = 0.02
        m.needsUpdate = true
      })
    })
  }
}

function collectCameraOccluderMeshes() {
  const result = new Set<any>()
  if (modelEntities.value.length === 0 || !camera || !controls || !THREE) return result

  const target = controls.target.clone()
  const camToTarget = target.clone().sub(camera.position)
  const focusDistance = camToTarget.length()
  if (focusDistance < 0.001) return result

  const raycaster = new THREE.Raycaster()
  const samples = [-0.42, -0.22, 0, 0.22, 0.42]
  const maxHitDistance = focusDistance * 0.95

  for (const sx of samples) {
    for (const sy of samples) {
      const ndc = new THREE.Vector2(sx, sy)
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects(modelEntities.value.map((x) => x.root), true)
      let taken = 0
      for (const hit of hits) {
        if (hit.distance > maxHitDistance) break
        if (hit.object?.isMesh) {
          result.add(hit.object)
          taken += 1
          if (taken >= 2) break
        }
      }
    }
  }

  return result
}

function updateWallTransparencyByCamera(force = false) {
  if (!wallTransparentOn.value || !camera || !controls || modelEntities.value.length === 0) return
  const sig = `${camera.position.x.toFixed(2)}|${camera.position.y.toFixed(2)}|${camera.position.z.toFixed(2)}|${controls.target.x.toFixed(2)}|${controls.target.y.toFixed(2)}|${controls.target.z.toFixed(2)}`
  if (!force && sig === lastWallSig) return
  lastWallSig = sig
  applyWallTransparency()
}

function toggleWallTransparency() {
  wallTransparentOn.value = !wallTransparentOn.value
  lastWallSig = ""
  applyWallTransparency()
}

function frameModel(root: any) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  modelCenter = center.clone()
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  modelRadius = Math.max(sphere.radius, 0.5)
  if (scene?.fog) {
    scene.fog.near = Math.max(modelRadius * 10, 260)
    scene.fog.far = Math.max(modelRadius * 64, 1800)
  }

  // Keep an oblique "3D map" camera while preserving model readability.
  const outsideDir = new THREE.Vector3(1.35, 1.08, 1.2).normalize()
  const dist = modelRadius * 3.6
  const targetY = center.y + size.y * 0.14

  camera.position.copy(center.clone().add(outsideDir.multiplyScalar(dist)))
  controls.target.set(center.x, targetY, center.z)
  controls.minDistance = modelRadius * 1.15
  controls.maxDistance = modelRadius * 18
  camera.near = Math.max(0.01, modelRadius / 500)
  camera.far = Math.max(2000, modelRadius * 200)
  camera.updateProjectionMatrix()
  controls.update()

  defaultCamPos = [camera.position.x, camera.position.y, camera.position.z]
  defaultTarget = [center.x, targetY, center.z]
  ensureModelFocus(center, size)
}

function ensureModelFocus(center: any, size: any) {
  if (!scene || !THREE) return

  clearFocusArtifacts()

  const light = new THREE.SpotLight(0xfff6df, 1.15, modelRadius * 10, Math.PI * 0.26, 0.34, 1.6)
  light.position.set(center.x + modelRadius * 1.1, center.y + modelRadius * 2.5, center.z + modelRadius * 0.9)
  light.target.position.set(center.x, center.y + size.y * 0.25, center.z)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  scene.add(light)
  scene.add(light.target)
  modelFocusLight = light
}

function roundNumber(v: number, digits = 6) {
  if (!Number.isFinite(v)) return 0
  return Number(v.toFixed(digits))
}

function stripCopySuffix(name: string) {
  return String(name || "")
    .replace(/\s*\(copy\)\s*$/i, "")
    .trim()
}

function inferSourceRelPathByName(name: string, relPaths: string[]) {
  const baseName = stripCopySuffix(String(name || "")).toLowerCase()
  if (!baseName) return null
  const byFileName = relPaths.find((p) => p.split("/").pop()?.toLowerCase() === baseName)
  if (byFileName) return byFileName
  const startsWithName = relPaths.find((p) => p.split("/").pop()?.toLowerCase().startsWith(baseName))
  if (startsWithName) return startsWithName
  return null
}

function buildProjectPayload() {
  reconcileModelEntitiesFromScene()
  const knownRelPaths = [
    ...pickedModelRootFiles.value.map((x) => normalizeRelPath(x)),
    ...(Array.isArray(loadedProjectAssets.value?.model_root_files)
      ? loadedProjectAssets.value.model_root_files.map((x: any) => normalizeRelPath(String(x || "")))
      : []),
  ].filter(Boolean)

  const models = modelEntities.value.map((entity, orderIndex) => {
    const root = entity.root
    const directSourceRel = modelSourceMap.get(entity.id) || root?.userData?.__sourceRelPath || null
    const inferredSourceRel = directSourceRel || inferSourceRelPathByName(entity.name, knownRelPaths)
    const sourceRelPath = inferredSourceRel || null
    return {
      id: entity.id,
      order_index: orderIndex,
      name: entity.name,
      source_rel_path: sourceRelPath ? String(sourceRelPath) : null,
      pin_to_map: entity.pinToMap !== false,
      position: {
        x: roundNumber(root?.position?.x ?? 0, 4),
        y: roundNumber(root?.position?.y ?? 0, 4),
        z: roundNumber(root?.position?.z ?? 0, 4),
      },
      rotation: {
        x: roundNumber(root?.rotation?.x ?? 0, 5),
        y: roundNumber(root?.rotation?.y ?? 0, 5),
        z: roundNumber(root?.rotation?.z ?? 0, 5),
      },
      scale: {
        x: roundNumber(root?.scale?.x ?? 1, 5),
        y: roundNumber(root?.scale?.y ?? 1, 5),
        z: roundNumber(root?.scale?.z ?? 1, 5),
      },
    }
  })

  const roads = roadGroup
    ? roadGroup.children
        .map((road: any) => {
          const path = Array.isArray(road?.userData?.__roadPath) ? road.userData.__roadPath : []
          const points = path.map((p: any) => ({
            x: roundNumber(p?.x ?? 0, 4),
            y: roundNumber(p?.y ?? 0, 4),
            z: roundNumber(p?.z ?? 0, 4),
          }))
          return points.length >= 2 ? { points } : null
        })
        .filter(Boolean)
    : []

  const lights = Array.from(lightDeviceMap.values()).map((device: any) => ({
    id: device.id,
    on: !!device.on,
    position: {
      x: roundNumber(device?.root?.position?.x ?? 0, 4),
      y: roundNumber(device?.root?.position?.y ?? 0, 4),
      z: roundNumber(device?.root?.position?.z ?? 0, 4),
    },
  }))

  const cctv = {
    cameras: cctvCameras.value.map(c => ({ id: c.id, name: c.name, url: c.url })),
    markers: cctvMarkers.value.map(m => ({ id: m.id, cameraId: m.cameraId, worldX: m.worldX, worldY: m.worldY, worldZ: m.worldZ })),
  }

  const waterPipeDrawings = {
    pipes: wpUserPipes.value.map(p => ({ id: p.id, pts: p.pts, diam: p.diam, mat: p.mat, status: p.status, label: p.label, midX: p.midX, midZ: p.midZ })),
    nodes: wpUserNodes.value.map(n => ({ id: n.id, type: n.type, x: n.x, z: n.z })),
  }

  return {
    version: 1,
    map: {
      lat: roundNumber(mapLat.value, 6),
      lng: roundNumber(mapLng.value, 6),
      zoom: Math.max(1, Math.min(20, Math.round(mapZoom.value))),
    },
    viewer: {
      wallTransparentOn: !!wallTransparentOn.value,
      dayMode: !!dayMode.value,
    },
    models,
    roads,
    lights,
    cctv,
    waterPipeDrawings,
    savedAt: new Date().toISOString(),
  }
}

async function uploadSourceFilesToStorage(ownerId: string | null, baseAssets?: any) {
  const baseFiles = Array.isArray(baseAssets?.files) ? baseAssets.files : []
  const baseRoots = Array.isArray(baseAssets?.model_root_files) ? baseAssets.model_root_files : []
  if (!pickedSourceFiles.value.length) {
    if (baseFiles.length || baseRoots.length) {
      return {
        bucket: String(baseAssets?.bucket || PROJECT_ASSET_BUCKET),
        folder: String(baseAssets?.folder || ""),
        files: baseFiles,
        model_root_files: baseRoots.map((x: any) => normalizeRelPath(String(x || ""))).filter(Boolean),
      }
    }
    return null
  }
  const ownerSeg = sanitizeStorageSegment(ownerId || "anon")
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const folder = `projects/${ownerSeg}/${stamp}`
  const bucket = String(baseAssets?.bucket || PROJECT_ASSET_BUCKET)
  const filesByRel = new Map<string, any>()

  for (const row of baseFiles) {
    const relPath = normalizeRelPath(String(row?.rel_path || row?.name || ""))
    const storagePath = String(row?.storage_path || "")
    if (!relPath || !storagePath) continue
    filesByRel.set(relPath, {
      rel_path: relPath,
      storage_path: storagePath,
      size: Number(row?.size) || 0,
      content_type: String(row?.content_type || "application/octet-stream"),
      name: String(row?.name || relPath.replace(/^.*\//, "")),
    })
  }

  for (const src of pickedSourceFiles.value) {
    const relPath = normalizeRelPath(src.relPath)
    if (!relPath) continue
    const safeRel = sanitizeStorageSegment(relPath)
    const storagePath = `${folder}/${safeRel}`
    const { error } = await $supabase.storage
      .from(bucket)
      .upload(storagePath, src.file, { upsert: true, contentType: src.type || "application/octet-stream" })
    if (error) throw error
    filesByRel.set(relPath, {
      rel_path: relPath,
      storage_path: storagePath,
      size: src.size,
      content_type: src.type || "application/octet-stream",
      name: src.name,
    })
  }

  const roots = Array.from(
    new Set([
      ...baseRoots.map((x: any) => normalizeRelPath(String(x || ""))).filter(Boolean),
      ...pickedModelRootFiles.value.map((x) => normalizeRelPath(x)).filter(Boolean),
    ]),
  )
  return {
    bucket,
    folder,
    files: Array.from(filesByRel.values()),
    model_root_files: roots,
  }
}

async function restoreLocalFileMapFromAssets(assets: any) {
  if (!assets || !Array.isArray(assets.files)) return
  const bucket = String(assets.bucket || PROJECT_ASSET_BUCKET)
  clearLocalFileMap()
  const byRel = new Map<string, any>()

  for (const row of assets.files) {
    const rel = normalizeRelPath(row?.rel_path || row?.name || "")
    const storagePath = String(row?.storage_path || "")
    if (!rel || !storagePath) continue
    const { data, error } = await $supabase.storage.from(bucket).download(storagePath)
    if (error || !data) throw error || new Error(`download failed: ${storagePath}`)
    const url = URL.createObjectURL(data)
    objectUrlPool.push(url)
    localFileMap.set(rel, url)
    localFileMap.set(rel.replace(/^.*\//, ""), url)
    byRel.set(rel, data)
  }

  return byRel
}

async function loadModelsFromStoredAssets(assets: any) {
  if (!assets || !Array.isArray(assets.model_root_files)) return
  const blobsByRel = await restoreLocalFileMapFromAssets(assets)
  if (!blobsByRel) return

  clearAllModels()
  const roots = assets.model_root_files.map((x: any) => normalizeRelPath(String(x || ""))).filter(Boolean)
  const loadedNames: string[] = []
  for (const rel of roots) {
    const display = rel.replace(/^.*\//, "")
    const blobUrl = localFileMap.get(rel) || localFileMap.get(display)
    if (blobUrl && display.toLowerCase().endsWith(".glb")) {
      await loadModelFromUrl(blobUrl, display, rel)
    } else {
      const blob = blobsByRel.get(rel) || blobsByRel.get(display)
      if (!blob) continue
      const ab = await blob.arrayBuffer()
      await loadModelFromArrayBuffer(ab, display, rel)
    }
    loadedNames.push(display)
  }
  if (loadedNames.length) selectedFileName.value = loadedNames.join(", ")
  loadedAssetCount.value = Array.isArray(assets.files) ? assets.files.length : loadedNames.length
}

async function saveProjectToSupabase() {
  if (savingProject.value) return
  projectSaveError.value = ""
  projectSaveSuccess.value = ""
  projectDeleteError.value = ""
  projectDeleteSuccess.value = ""

  // ตรวจสอบ quota (DEMO / 7 วัน)
  if (isLimitedUser.value && savedProjects.value.length >= 1) {
    const licType = is7DayUser.value ? '7 วัน' : 'DEMO'
    projectSaveError.value = `ไลเซนส์ ${licType} บันทึกได้สูงสุด 1 โปรเจค — กรุณาลบโปรเจคเดิมก่อน`
    return
  }

  savingProject.value = true

  try {
    const customName = String(projectName.value || "").trim()
    const fallbackName = `Project ${new Date().toISOString().slice(0, 19).replace("T", " ")}`
    const name = customName || fallbackName
    projectName.value = name

    const ownerId = authUser.value?.id ?? null
    const payload = buildProjectPayload()
    if (pickedSourceFiles.value.length) statusText.value = "Uploading model files to Supabase Storage..."
    const assets = await uploadSourceFilesToStorage(ownerId, loadedProjectAssets.value)
    if (assets) {
      payload.assets = assets
      loadedProjectAssets.value = assets
    }

    const { data, error } = await $supabase
      .from("digital_twin_projects")
      .insert([
        {
          name,
          owner_id: ownerId,
          payload,
        },
      ])
      .select("id, created_at")
      .single()

    if (error) throw error

    projectSaveSuccess.value = `Saved "${name}"`
    statusText.value = `Project saved: ${name}`
    await fetchSavedProjects()
  } catch (err: any) {
    const msg = err?.message || "save failed"
    projectSaveError.value = `Save failed: ${msg}`
    statusText.value = "Project save failed"
  } finally {
    savingProject.value = false
  }
}

async function fetchSavedProjects() {
  if (loadingProjects.value) return
  loadingProjects.value = true
  projectLoadError.value = ""
  projectDeleteError.value = ""
  try {
    const { data, error } = await $supabase
      .from("digital_twin_projects")
      .select("id,name,created_at,owner_id")
      .eq("owner_id", authUser.value?.id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) throw error
    savedProjects.value = Array.isArray(data)
      ? data.map((x: any) => ({
          id: String(x.id),
          name: String(x.name || "Untitled"),
          created_at: String(x.created_at || ""),
          owner_id: x.owner_id ? String(x.owner_id) : null,
        }))
      : []

    // ดึง license note เพื่อตรวจสอบ DEMO quota
    if (authUser.value?.license_key_id) {
      const { data: lic } = await $supabase
        .from('license_keys')
        .select('note')
        .eq('id', authUser.value.license_key_id)
        .maybeSingle()
      userLicenseNote.value = lic?.note ?? null
    }
  } catch (err: any) {
    const msg = err?.message || "fetch failed"
    projectLoadError.value = `Load list failed: ${msg}`
    savedProjects.value = []
  } finally {
    loadingProjects.value = false
  }
}

function formatSavedProjectDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString()
}

function describeError(err: any) {
  if (typeof err === "string" && err.trim()) return err
  if (err?.message && String(err.message).trim()) return String(err.message)
  if (err?.error_description && String(err.error_description).trim()) return String(err.error_description)
  if (err?.details && String(err.details).trim()) return String(err.details)
  if (err?.hint && String(err.hint).trim()) return String(err.hint)
  if (err?.code) return `error code: ${String(err.code)}`
  try {
    const s = JSON.stringify(err)
    if (s && s !== "{}") return s
  } catch {
    // ignore
  }
  return "unknown error"
}

async function applyLoadedProjectPayload(payload: any) {
  const normalizedPayload = payload && typeof payload === "object" ? payload : {}

  if (Number.isFinite(Number(normalizedPayload?.map?.lat))) mapLat.value = Number(normalizedPayload.map.lat)
  if (Number.isFinite(Number(normalizedPayload?.map?.lng))) mapLng.value = Number(normalizedPayload.map.lng)
  if (Number.isFinite(Number(normalizedPayload?.map?.zoom))) mapZoom.value = Number(normalizedPayload.map.zoom)
  await applyMapLocation()

  clearAllRoads()
  for (const deviceId of Array.from(lightDeviceMap.keys())) removeLightDevice(deviceId)
  if (normalizedPayload?.assets?.files?.length && normalizedPayload?.assets?.model_root_files?.length) {
    try {
      await loadModelsFromStoredAssets(normalizedPayload.assets)
      loadedProjectAssets.value = normalizedPayload.assets
      pickedModelRootFiles.value = Array.isArray(normalizedPayload.assets.model_root_files)
        ? normalizedPayload.assets.model_root_files.map((x: any) => normalizeRelPath(String(x || ""))).filter(Boolean)
        : []
      pickedSourceFiles.value = []
    } catch (assetErr: any) {
      statusText.value = `Project loaded with asset warnings: ${describeError(assetErr)}`
    }
  }

  const roads = Array.isArray(normalizedPayload?.roads) ? normalizedPayload.roads : []
  for (const road of roads) {
    const pointsRaw = Array.isArray(road?.points) ? road.points : []
    const points = pointsRaw
      .map((p: any) => new THREE.Vector3(Number(p?.x) || 0, Number(p?.y) || 0, Number(p?.z) || 0))
      .filter((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z))
    if (points.length >= 2) createRoadMesh(points)
  }

  const lights = Array.isArray(normalizedPayload?.lights) ? normalizedPayload.lights : []
  for (const light of lights) {
    const pos = light?.position || {}
    const x = Number(pos.x)
    const y = Number(pos.y)
    const z = Number(pos.z)
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue
    createLightDeviceAtPosition(new THREE.Vector3(x, y, z), !!light?.on, `Light ${light?.id ?? ""}`.trim())
  }

  const models = Array.isArray(normalizedPayload?.models) ? normalizedPayload.models : []
  const assetRootPaths = Array.isArray(normalizedPayload?.assets?.model_root_files)
    ? normalizedPayload.assets.model_root_files.map((x: any) => normalizeRelPath(String(x || ""))).filter(Boolean)
    : []
  const usedModelIds = new Set<number>()
  let modelApplied = 0
  for (const savedModel of models) {
    const inferredSource = inferSourceRelPathByName(String(savedModel?.name || ""), assetRootPaths)
    const sourceRel = normalizeRelPath(String(savedModel?.source_rel_path || inferredSource || ""))
    const sourceCandidates = sourceRel
      ? modelEntities.value.filter(
          (m) =>
            (modelSourceMap.get(m.id) || m.root?.userData?.__sourceRelPath || "") === sourceRel && !usedModelIds.has(m.id),
        )
      : []
    let target = sourceCandidates[0]
    if (!target) {
      const idCandidate = modelEntities.value.find((m) => m.id === Number(savedModel?.id) && !usedModelIds.has(m.id))
      if (idCandidate) target = idCandidate
    }
    if (!target && savedModel?.name) {
      const nameCandidate = modelEntities.value.find((m) => m.name === String(savedModel.name) && !usedModelIds.has(m.id))
      if (nameCandidate) target = nameCandidate
    }
    if (!target && Number.isFinite(Number(savedModel?.order_index))) {
      const idx = Number(savedModel.order_index)
      const byIndex = modelEntities.value[idx]
      if (byIndex && !usedModelIds.has(byIndex.id)) target = byIndex
    }
    if (!target && sourceRel) {
      const sourceModel = modelEntities.value.find((m) => (modelSourceMap.get(m.id) || m.root?.userData?.__sourceRelPath || "") === sourceRel)
      if (sourceModel) {
        const clonedRoot = createIndependentClone(sourceModel.root)
        if (clonedRoot) {
          prepareModelRootForScene(clonedRoot)
          const clonedName = String(savedModel?.name || `${sourceModel.name} (copy)`)
          addModelToScene(clonedRoot, clonedName, false, sourceRel)
          target = modelEntities.value[modelEntities.value.length - 1] || null
        }
      }
    }
    if (!target) {
      const namedSource = stripCopySuffix(String(savedModel?.name || "")).toLowerCase()
      const sourceModel = modelEntities.value.find((m) => {
        const candidate = stripCopySuffix(String(m.name || "")).toLowerCase()
        return !!candidate && candidate === namedSource
      })
      if (sourceModel) {
        const clonedRoot = createIndependentClone(sourceModel.root)
        if (clonedRoot) {
          prepareModelRootForScene(clonedRoot)
          const clonedName = String(savedModel?.name || `${sourceModel.name} (copy)`)
          addModelToScene(clonedRoot, clonedName, false, modelSourceMap.get(sourceModel.id) || sourceModel.root?.userData?.__sourceRelPath || null)
          target = modelEntities.value[modelEntities.value.length - 1] || null
        }
      }
    }
    if (!target) {
      const fallback = modelEntities.value.find((m) => !usedModelIds.has(m.id))
      if (fallback) target = fallback
    }
    if (!target) continue
    target.pinToMap = savedModel?.pin_to_map !== false

    const pos = savedModel?.position || {}
    const rot = savedModel?.rotation || {}
    const scl = savedModel?.scale || {}
    if (Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.y)) && Number.isFinite(Number(pos.z))) {
      target.root.position.set(Number(pos.x), Number(pos.y), Number(pos.z))
    }
    if (Number.isFinite(Number(rot.y))) target.root.rotation.y = Number(rot.y)
    if (Number.isFinite(Number(scl.x)) && Number(scl.x) > 0) target.root.scale.setScalar(Number(scl.x))
    target.root.updateMatrixWorld(true)
    usedModelIds.add(target.id)
    modelApplied += 1
  }

  if (typeof normalizedPayload?.viewer?.wallTransparentOn === "boolean") {
    wallTransparentOn.value = normalizedPayload.viewer.wallTransparentOn
    applyWallTransparency()
  }
  if (typeof normalizedPayload?.viewer?.dayMode === "boolean") {
    dayMode.value = normalizedPayload.viewer.dayMode
    applyDayNightMode()
  }

  // Restore CCTV cameras and markers
  const savedCctv = normalizedPayload?.cctv
  if (savedCctv) {
    cctvCameras.value = []
    cctvMarkers.value = []
    cctvIdSeed = 1
    cctvMarkerIdSeed = 1
    const savedCams = Array.isArray(savedCctv.cameras) ? savedCctv.cameras : []
    for (const c of savedCams) {
      if (!c?.url) continue
      const id = Number(c.id) || cctvIdSeed
      cctvCameras.value.push({ id, name: String(c.name || `Camera ${id}`), url: String(c.url) })
      if (id >= cctvIdSeed) cctvIdSeed = id + 1
    }
    const savedMarkers = Array.isArray(savedCctv.markers) ? savedCctv.markers : []
    for (const m of savedMarkers) {
      if (!Number.isFinite(Number(m?.worldX))) continue
      const id = Number(m.id) || cctvMarkerIdSeed
      cctvMarkers.value.push({ id, cameraId: Number(m.cameraId), worldX: Number(m.worldX), worldY: Number(m.worldY), worldZ: Number(m.worldZ) })
      if (id >= cctvMarkerIdSeed) cctvMarkerIdSeed = id + 1
    }
  }

  // Restore user-drawn water pipe drawings
  const savedWP = normalizedPayload?.waterPipeDrawings
  if (savedWP) {
    clearWPUser()
    const savedPipes = Array.isArray(savedWP.pipes) ? savedWP.pipes : []
    for (const p of savedPipes) {
      const pts = Array.isArray(p?.pts) ? p.pts : []
      if (pts.length < 2) continue
      wpUserPipes.value.push({ id: String(p.id), pts, diam: Number(p.diam) || 150, mat: String(p.mat || 'pvc'), status: String(p.status || 'normal'), label: String(p.label || ''), midX: Number(p.midX) || 0, midZ: Number(p.midZ) || 0 })
    }
    const savedNodes = Array.isArray(savedWP.nodes) ? savedWP.nodes : []
    for (const n of savedNodes) {
      if (!Number.isFinite(Number(n?.x))) continue
      wpUserNodes.value.push({ id: String(n.id), type: n.type as any, x: Number(n.x), z: Number(n.z) })
    }
    rebuildWPUserGroup()
  }

  reconcileModelEntitiesFromScene()
  if (modelApplied > 0) frameAllModels()
}

async function loadProjectFromSupabase(projectId: string) {
  if (!projectId || projectActionBusyId.value) return
  projectLoadError.value = ""
  projectLoadSuccess.value = ""
  projectDeleteError.value = ""
  projectDeleteSuccess.value = ""
  projectActionBusyId.value = `load:${projectId}`
  try {
    const { data, error } = await $supabase
      .from("digital_twin_projects")
      .select("id,name,payload")
      .eq("id", projectId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("project not found")
    let payload: any = data.payload
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload)
      } catch {
        throw new Error("payload is not valid JSON")
      }
    }
    statusText.value = "Loading project assets from Supabase Storage..."
    await applyLoadedProjectPayload(payload)
    projectName.value = String(data.name || "")
    projectLoadSuccess.value = `Loaded "${data.name || projectId}"`
    statusText.value = `Project loaded: ${data.name || projectId}`
  } catch (err: any) {
    const msg = describeError(err)
    projectLoadError.value = `Load failed: ${msg}`
    statusText.value = "Project load failed"
  } finally {
    projectActionBusyId.value = null
  }
}

async function deleteProjectFromSupabase(projectId: string) {
  if (!projectId || projectActionBusyId.value) return
  const target = savedProjects.value.find((x) => x.id === projectId)
  const ok = window.confirm(`Delete project "${target?.name || projectId}" ?`)
  if (!ok) return

  projectLoadError.value = ""
  projectLoadSuccess.value = ""
  projectSaveError.value = ""
  projectSaveSuccess.value = ""
  projectDeleteError.value = ""
  projectDeleteSuccess.value = ""
  projectActionBusyId.value = `delete:${projectId}`
  try {
    const { data, error } = await $supabase
      .from("digital_twin_projects")
      .select("id,name,payload")
      .eq("id", projectId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("project not found")

    const assets = data?.payload?.assets
    const bucket = String(assets?.bucket || PROJECT_ASSET_BUCKET)
    const paths = Array.isArray(assets?.files)
      ? assets.files.map((x: any) => String(x?.storage_path || "")).filter(Boolean)
      : []

    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      const { error: rmErr } = await $supabase.storage.from(bucket).remove(chunk)
      if (rmErr) throw rmErr
    }

    const { error: delErr } = await $supabase.from("digital_twin_projects").delete().eq("id", projectId)
    if (delErr) throw delErr

    savedProjects.value = savedProjects.value.filter((x) => x.id !== projectId)
    projectDeleteSuccess.value = `Deleted "${data.name || projectId}"`
    statusText.value = `Project deleted: ${data.name || projectId}`
  } catch (err: any) {
    const msg = err?.message || "delete failed"
    projectDeleteError.value = `Delete failed: ${msg}`
    statusText.value = "Project delete failed"
  } finally {
    projectActionBusyId.value = null
  }
}

function resetView() {
  if (topViewMode.value) toggleTopView()
  if (modelEntities.value.length > 0) {
    frameAllModels()
    return
  }
  if (!camera || !controls) return
  camera.position.set(...defaultCamPos)
  controls.target.set(...defaultTarget)
  controls.update()
}

function toggleTopView() {
  if (!camera || !controls || !THREE) return
  if (topViewMode.value) {
    // Restore previous perspective view
    if (topViewSavedPos) camera.position.set(...topViewSavedPos)
    if (topViewSavedTarget) controls.target.set(...topViewSavedTarget)
    controls.minPolarAngle = topViewSavedMinPolar
    controls.maxPolarAngle = topViewSavedMaxPolar
    controls.enableRotate = true
    controls.update()
    topViewMode.value = false
  } else {
    // Save current state
    topViewSavedPos = [camera.position.x, camera.position.y, camera.position.z]
    topViewSavedTarget = [controls.target.x, controls.target.y, controls.target.z]
    topViewSavedMinPolar = controls.minPolarAngle
    topViewSavedMaxPolar = controls.maxPolarAngle
    // Height = current distance to target, minimum 80 units
    const dist = camera.position.distanceTo(controls.target)
    const h = Math.max(dist, 80)
    // Place camera directly above the current target
    camera.position.set(controls.target.x, h, controls.target.z)
    // Allow full rotation but lock to near-top-down only
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI * 0.12   // ~22° tilt max
    controls.update()
    topViewMode.value = true
  }
}

onMounted(async () => {
  // Remove the HTML-level pre-loader (shown before Vue mounts) — Vue's own loading screen takes over
  const pl = document.getElementById('__pl')
  if (pl) { pl.style.opacity = '0'; setTimeout(() => pl.remove(), 520) }

  // refresh role/is_active จาก DB เพื่อให้ปุ่ม Admin แสดงถูกต้อง
  refreshUser()

  try {
    initPromise ||= initThree()
    await initPromise
    statusText.value = "Ready"
    await fetchSavedProjects()
    loadPm25()
  } catch (err: any) {
    errorText.value = `Three.js init failed: ${err?.message || err}`
    statusText.value = "Failed"
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  renderer?.domElement?.removeEventListener("pointerdown", onViewportPointerDown)
  renderer?.domElement?.removeEventListener("pointermove", onViewportPointerMove)
  renderer?.domElement?.removeEventListener("pointerup", onViewportPointerUp)
  renderer?.domElement?.removeEventListener("pointercancel", onViewportPointerCancel)
  renderer?.domElement?.removeEventListener("pointerleave", onViewportPointerCancel)
  renderer?.domElement?.removeEventListener("contextmenu", onViewportContextMenu)
  clearAllModels()
  clearLocalFileMap()
  clearFocusArtifacts()
  clearSelectedModelMarker()
  mapTexture?.dispose?.()
  pmrem?.dispose?.()
  renderer?.dispose?.()
})
</script>

<template>
  <main class="page" :class="{ 'night-mode': !dayMode }">
    <div ref="viewport" class="viewport" @dragover="onViewportDragOver" @drop="onViewportDrop"></div>

    <!-- ── Compass ── -->
    <div class="map-compass" :title="`ทิศเหนือ ${compassAngle.toFixed(0)}°`">
      <svg viewBox="0 0 64 64" width="64" height="64">
        <!-- outer ring -->
        <circle cx="32" cy="32" r="30" fill="rgba(10,15,30,0.72)" stroke="rgba(148,163,184,0.25)" stroke-width="1.2"/>
        <!-- cardinal labels (fixed, don't rotate) -->
        <text x="32" y="10" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#94a3b8" font-family="sans-serif">N</text>
        <text x="32" y="56" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="#475569" font-family="sans-serif">S</text>
        <text x="10" y="33" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="#475569" font-family="sans-serif">W</text>
        <text x="54" y="33" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="#475569" font-family="sans-serif">E</text>
        <!-- rotating needle group -->
        <g :transform="`rotate(${compassAngle}, 32, 32)`">
          <!-- North arrow (red) -->
          <polygon points="32,6 29,32 35,32" fill="#ef4444"/>
          <!-- South arrow (gray) -->
          <polygon points="32,58 29,32 35,32" fill="#475569"/>
          <!-- center dot -->
          <circle cx="32" cy="32" r="2.8" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
        </g>
      </svg>
    </div>

    <!-- ── PM2.5 Detail Modal ── -->
    <Transition name="fade">
      <div v-if="pm25DetailOpen" class="pm25-modal-overlay" @click.self="pm25DetailOpen = false">
        <div class="pm25-modal">

          <div v-if="pm25DetailLoading" class="pm25-modal-loader">
            <svg class="ls-spin" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" width="32" height="32"><circle cx="12" cy="12" r="9" stroke-dasharray="36 20"/></svg>
            <span>กำลังโหลดข้อมูล...</span>
          </div>

          <template v-else>
            <div class="pm25-cards-wrapper">
              <!-- Top bar: title + close -->
              <div class="pm25-cards-topbar">
                <div class="pm25-cards-topbar-left">
                  <div class="pm25-modal-head-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M3 10h10M3 6h14M3 14h7"/><circle cx="17" cy="14" r="2.5" stroke="white"/></svg>
                  </div>
                  <div>
                    <div class="pm25-modal-head-title">คุณภาพอากาศ</div>
                    <div class="pm25-modal-head-sub">Open-Meteo · อัปเดต {{ pm25LastUpdate }}</div>
                  </div>
                </div>
                <button class="pm25-modal-x" @click="pm25DetailOpen = false">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" width="11" height="11"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
                </button>
              </div>

              <!-- Card 1: Hourly forecast -->
              <div class="pm25-card">
                <div class="pm25-ms-title">พยากรณ์อากาศรายชั่วโมง</div>
                <div class="pm25-ms-sub">ดัชนีคุณภาพอากาศ (AQI*) · {{ pm25HourlyData.length }} ชั่วโมงข้างหน้า</div>
                <div class="pm25-hourly-scroll" style="margin-top:12px">
                  <div v-for="(h, i) in pm25HourlyData" :key="i" class="pm25-hi" :class="{ 'pm25-hi-now': i === 0 }">
                    <div class="pm25-hi-time">{{ i === 0 ? 'ขณะนี้' : h.time }}</div>
                    <div class="pm25-hi-aqi" :style="{ background: pm25AqiBoxBg(h.aqi), color: pm25AqiColor(h.aqi) }">{{ h.aqi }}</div>
                    <div class="pm25-hi-wicon" v-html="pm25WxIcon(h.wcode)"></div>
                    <div class="pm25-hi-temp">{{ h.temp }}°</div>
                    <div class="pm25-hi-wind">
                      <svg viewBox="0 0 10 10" fill="none" :stroke="pm25AqiColor(h.aqi)||'#94a3b8'" stroke-width="1.5" stroke-linecap="round" width="9" height="9"><path d="M2 5h5a1.5 1.5 0 000-3h-1"/></svg>
                      {{ h.wind }}
                    </div>
                    <div class="pm25-hi-hum">💧{{ h.humidity }}%</div>
                  </div>
                </div>
              </div>

              <!-- Cards 2 & 3: Daily + Pollutants -->
              <div class="pm25-cards-bottom">

                <!-- Card 2: Daily forecast -->
                <div class="pm25-card">
                  <div class="pm25-ms-title">พยากรณ์อากาศประจำวัน</div>
                  <div class="pm25-ms-sub">ดัชนีคุณภาพอากาศ (AQI*)</div>
                  <div class="pm25-daily-list" style="margin-top:12px">
                    <div v-for="(d, i) in pm25DailyData" :key="i" class="pm25-di" :class="{ 'pm25-di-today': i === 0 }">
                      <div class="pm25-di-day">{{ pm25DayName(d.date, i) }}</div>
                      <div class="pm25-di-icon" v-html="pm25WxIcon(d.wcode)"></div>
                      <div class="pm25-di-aqi" :style="{ background: pm25AqiBoxBg(d.aqi), color: pm25AqiColor(d.aqi) }">{{ d.aqi }}</div>
                      <div class="pm25-di-temps"><strong>{{ d.maxT }}°</strong> <span>{{ d.minT }}°</span></div>
                      <div class="pm25-di-stats">
                        <span>↑ {{ d.wind }} km/h</span>
                        <span>💧 {{ d.humidity }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Card 3: Pollutants -->
                <div class="pm25-card" v-if="pm25Pollutants">
                  <div class="pm25-ms-title">มลพิษทางอากาศ</div>
                  <div class="pm25-ms-sub">คุณภาพอากาศขณะนี้ใน {{ pm25Stations[0]?.name || 'สถานีใกล้เคียง' }} เป็นอย่างไร</div>
                  <div class="pm25-poll-grid" style="margin-top:12px">
                    <div class="pm25-poll-row">
                      <div class="pm25-poll-item">
                        <div class="pm25-poll-top">
                          <span class="pm25-poll-name">PM2.5</span>
                          <span class="pm25-poll-desc">ฝุ่นละอองขนาดเล็ก (≤ 2.5 µm)</span>
                        </div>
                        <div class="pm25-poll-val" :style="{color: pm25AqiColor(pm25Avg())}">
                          <span class="pm25-pdot" :style="{background: pm25AqiColor(pm25Avg())}"></span>
                          {{ pm25Pollutants.pm25 }} <span class="pm25-poll-unit">µg/m³</span>
                        </div>
                      </div>
                      <div class="pm25-poll-item">
                        <div class="pm25-poll-top">
                          <span class="pm25-poll-name">O₃</span>
                          <span class="pm25-poll-desc">โอโซน</span>
                        </div>
                        <div class="pm25-poll-val" style="color:#16a34a">
                          <span class="pm25-pdot" style="background:#22c55e"></span>
                          {{ pm25Pollutants.o3 }} <span class="pm25-poll-unit">µg/m³</span>
                        </div>
                      </div>
                    </div>
                    <div class="pm25-poll-row">
                      <div class="pm25-poll-item">
                        <div class="pm25-poll-top">
                          <span class="pm25-poll-name">NO₂</span>
                          <span class="pm25-poll-desc">ไนโตรเจนไดออกไซด์</span>
                        </div>
                        <div class="pm25-poll-val" style="color:#16a34a">
                          <span class="pm25-pdot" style="background:#22c55e"></span>
                          {{ pm25Pollutants.no2 }} <span class="pm25-poll-unit">µg/m³</span>
                        </div>
                      </div>
                      <div class="pm25-poll-item">
                        <div class="pm25-poll-top">
                          <span class="pm25-poll-name">SO₂</span>
                          <span class="pm25-poll-desc">ซัลเฟอร์ไดออกไซด์</span>
                        </div>
                        <div class="pm25-poll-val" style="color:#16a34a">
                          <span class="pm25-pdot" style="background:#22c55e"></span>
                          {{ pm25Pollutants.so2 }} <span class="pm25-poll-unit">µg/m³</span>
                        </div>
                      </div>
                    </div>
                    <div class="pm25-poll-item">
                      <div class="pm25-poll-top">
                        <span class="pm25-poll-name">CO</span>
                        <span class="pm25-poll-desc">คาร์บอนมอนอกไซด์</span>
                      </div>
                      <div class="pm25-poll-val" style="color:#16a34a">
                        <span class="pm25-pdot" style="background:#22c55e"></span>
                        {{ pm25Pollutants.co }} <span class="pm25-poll-unit">µg/m³</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>


    <input ref="fileInput" class="file-input" type="file" accept=".glb,.gltf,.bin,.ktx2,.png,.jpg,.jpeg,.webp,.basis" multiple @change="onPickFile" />

    <!-- ── Bottom Navigation Bar ── -->
    <div class="bottom-bar">

      <!-- Brand -->
      <div class="bb-brand">
        <div class="bb-logo-wrap">
          <img src="/logo.png" class="bb-logo-img" alt="iMapBeta" />
        </div>
      </div>

      <div class="bb-sep"></div>

      <!-- Tool toggles -->
      <div class="bb-tools">
        <button type="button" class="bb-tool" :class="{ 'bbt-active': lightPlaceMode }" :disabled="!viewerReady" @click="lightPlaceMode = !lightPlaceMode" title="คลิกบนแผนที่เพื่อวางเสาไฟ">
          <svg class="bbt-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="8" y1="14" x2="8" y2="7"/><path d="M8 7 C8 7 8 4.5 10.5 4"/><rect x="9.5" y="2.5" width="3.5" height="2" rx="0.8"/><ellipse cx="11" cy="5" rx="1.5" ry="0.6"/>
          </svg>
          <span class="bbt-label">Street Light</span>
          <span class="bbt-state" :class="lightPlaceMode ? 'ts-on' : 'ts-off'">{{ lightPlaceMode ? "ON" : "OFF" }}</span>
        </button>
      </div>

      <div class="bb-sep"></div>

      <!-- Navigation tabs -->
      <div class="bb-nav">
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': panelMapOpen }" @click="panelMapOpen = !panelMapOpen">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3-1 4 2 3-1v7l-3 1-4-2-3 1V4z"/><line x1="5" y1="3" x2="5" y2="10"/><line x1="9" y1="5" x2="9" y2="12"/></svg>
          Map
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': panelModelOpen }" :disabled="modelEntities.length === 0" @click="panelModelOpen = !panelModelOpen">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1L12.5 4V10L7 13L1.5 10V4L7 1Z"/></svg>
          Model
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': panelLampOpen }" @click="panelLampOpen = !panelLampOpen">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="6" r="3"/><line x1="7" y1="1" x2="7" y2="2.5"/><line x1="7" y1="9" x2="7" y2="13"/><line x1="2" y1="6" x2="3.5" y2="6"/><line x1="10.5" y1="6" x2="12" y2="6"/></svg>
          Lamp<span v-if="lightDevices.length" class="bbtab-badge">{{ lightDevices.length }}</span>
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': panelStatusOpen }" @click="panelStatusOpen = !panelStatusOpen">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="12" height="12" rx="1.5"/><line x1="4" y1="7" x2="4" y2="10"/><line x1="7" y1="5" x2="7" y2="10"/><line x1="10" y1="3" x2="10" y2="10"/></svg>
          Project
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': trafficVisible }" @click="toggleTrafficLayer">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 7h10M2 4.5h10M2 9.5h10"/>
            <circle cx="5"  cy="4.5" r="1.1" fill="#22c55e" stroke="none"/>
            <circle cx="9"  cy="7"   r="1.1" fill="#f59e0b" stroke="none"/>
            <circle cx="5"  cy="9.5" r="1.1" fill="#ef4444" stroke="none"/>
          </svg>
          Traffic<span v-if="trafficLoading" class="bbtab-badge" style="background:#888">...</span>
          <span v-else-if="trafficVisible" class="bbtab-badge" style="background:#22c55e">ON</span>
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': showCctvPanel }" @click="showCctvPanel = !showCctvPanel">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3.5" width="9" height="7" rx="1.2"/>
            <path d="M10 6l3-2v6l-3-2V6z"/>
            <circle cx="5" cy="7" r="1.3" fill="currentColor" stroke="none" opacity=".5"/>
          </svg>
          CCTV<span v-if="cctvMarkers.length" class="bbtab-badge">{{ cctvMarkers.length }}</span>
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': waterVisible }" @click="toggleWaterLayer()">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 2C7 2 3 6 3 8.5a4 4 0 0 0 8 0C11 6 7 2 7 2z"/>
          </svg>
          น้ำ<span v-if="waterVisible" class="bbtab-badge" style="background:#0ea5e9">ON</span>
        </button>
        <button type="button" class="bb-tab" :class="{ 'bbtab-active': showWaterSupplyPanel }" @click="showWaterSupplyPanel = !showWaterSupplyPanel">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="4" cy="7" r="2"/><circle cx="10" cy="7" r="2"/>
            <path d="M6 7h2M2 7H1M13 7h-1"/>
            <path d="M4 5V3M10 5V3M4 9v2M10 9v2"/>
          </svg>
          ประปา<span v-if="wpUserPipes.length || wpUserNodes.length" class="bbtab-badge" style="background:#00ccff">{{ wpUserPipes.length + wpUserNodes.length }}</span>
        </button>
        <!-- PM2.5 AQI tab -->
        <button type="button" class="bb-tab bb-tab-aqi" @click="loadPm25Detail" :disabled="!viewerReady" :title="pm25LocationName || 'คลิกดูรายละเอียดคุณภาพอากาศ'">
          <span v-if="pm25Loading" class="bb-aqi-spinner"></span>
          <span v-else class="bb-aqi-box" :style="{ background: pm25AqiBoxBg(pm25Avg()), color: pm25AqiColor(pm25Avg()) }">
            {{ pm25Avg() ?? '—' }}
          </span>
          <span class="bb-aqi-label" :style="pm25Stations.length ? { color: pm25AqiColor(pm25Avg()) } : {}">PM2.5</span>
        </button>

        <button type="button" class="bb-tab" :class="{ 'bbtab-active': tambonVisible }" @click="toggleTambonLayer">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="7,1 13,5 11,12 3,12 1,5" fill="none"/>
            <line x1="7" y1="1" x2="7" y2="12"/>
            <line x1="1" y1="5" x2="13" y2="5"/>
            <line x1="3" y1="12" x2="11" y2="12"/>
          </svg>
          เขต อบต.<span v-if="tambonLoading" class="bbtab-badge" style="background:#888">...</span>
          <span v-else-if="tambonError" class="bbtab-badge" style="background:#ef4444" :title="tambonError">ERR</span>
          <span v-else-if="tambonVisible && tambonAreas.length" class="bbtab-badge" style="background:#ffcc00;color:#333">{{ tambonAreas.length }}</span>
          <span v-else-if="tambonVisible" class="bbtab-badge" style="background:#f59e0b;color:#333">ON</span>
        </button>
      </div>

      <!-- Action buttons (pushed to right) -->
      <div class="bb-actions">
        <div
          class="bb-act walk-drag-btn"
          :class="{ active: walkMode, 'walk-dragging': walkDragActive }"
          :draggable="viewerReady ? 'true' : 'false'"
          @dragstart="onWalkPersonDragStart"
          @dragend="onWalkPersonDragEnd"
          @click="toggleWalkMode"
          title="คลิกสลับ · ลากวางตรงจุดที่ต้องการ"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="3" r="1.5"/>
            <path d="M8 5v4M6 7l-2 3M10 7l2 3M6.5 9l1 3M9.5 9l-1 3"/>
          </svg>
        </div>
        <button type="button" class="bb-act" @click="openFilePicker" title="Load Model">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M5 5l3-3 3 3"/></svg>
        </button>
        <button type="button" class="bb-act" :disabled="!viewerReady || !hasModel" @click="toggleWallTransparency" title="Wall Transparency" :class="{active: wallTransparentOn}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M2 6h12M6 2v12" stroke-dasharray="2 2"/></svg>
        </button>
        <button type="button" class="bb-act" :disabled="!viewerReady" @click="toggleDayNightMode" title="Day / Night" :class="{active: !dayMode}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M13 9A5 5 0 016 3a6 6 0 106 6z" fill="currentColor" stroke="none" opacity=".25"/><path d="M13 9A5 5 0 016 3a6 6 0 106 6z"/></svg>
        </button>
        <button type="button" class="bb-act" :disabled="!viewerReady" :class="{ active: topViewMode }" @click="toggleTopView" title="Top View / มุมมองจากบน">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="5.5"/>
            <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>
            <line x1="8" y1="2.5" x2="8" y2="5"/>
            <line x1="8" y1="11" x2="8" y2="13.5"/>
            <line x1="2.5" y1="8" x2="5" y2="8"/>
            <line x1="11" y1="8" x2="13.5" y2="8"/>
          </svg>
        </button>
        <button type="button" class="bb-act" :disabled="!viewerReady" @click="resetView" title="Reset View">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a5 5 0 105-5H5M5 2v3H2"/></svg>
        </button>
        <button type="button" class="bb-act" @click="tourRef?.start()" title="คู่มือการใช้งาน"
          style="color:#00ccff;border-color:rgba(0,204,255,0.3);background:rgba(0,204,255,0.07)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M8 11v-1M8 7.5a1.5 1.5 0 10-1.5-1.5"/>
            <circle cx="8" cy="11.2" r=".3" fill="currentColor"/>
          </svg>
        </button>

        <!-- User / Admin -->
        <div style="display:flex;align-items:center;gap:6px;margin-left:4px;padding-left:8px;border-left:1px solid rgba(255,255,255,0.12)">
          <NuxtLink v-if="authUser?.email === 'panupong.chinn@gmail.com'" to="/admin"
            style="height:28px;padding:0 10px;border-radius:6px;font-size:0.65rem;font-weight:600;
                   background:rgba(147,51,234,0.2);color:#c084fc;border:1px solid rgba(147,51,234,0.3);
                   display:inline-flex;align-items:center;gap:4px;white-space:nowrap;text-decoration:none;
                   transition:background 0.15s"
            title="Admin Panel"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 1.5a3 3 0 013 3v.5h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1h1v-.5a3 3 0 013-3z"/>
            </svg>
            Admin
          </NuxtLink>
          <span style="font-size:0.65rem;color:rgba(255,255,255,0.5);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="authUser?.email">
            {{ authUser?.full_name || authUser?.email }}
          </span>
          <button type="button"
            style="height:28px;padding:0 10px;border-radius:6px;font-size:0.65rem;font-weight:600;
                   background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.25);
                   cursor:pointer;transition:background 0.15s;white-space:nowrap"
            @click="onLogout"
            title="ออกจากระบบ"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>

    <!-- ── Traffic Panel ── -->
    <Transition name="panel-slide">
      <div v-if="panelTrafficOpen" class="float-panel fp-traffic panel-card">
        <div class="panel-heading">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:12px;height:12px;flex-shrink:0;color:var(--h-accent)">
            <path d="M2 7h10M2 4.5h10M2 9.5h10"/>
          </svg>
          สภาพการจราจร
        </div>

        <!-- Toggle -->
        <div class="tr-row tr-row-2" style="align-items:center">
          <span style="font-size:0.62rem;color:var(--h-pri);font-weight:600">แสดงบนแผนที่</span>
          <button
            type="button"
            class="bbt-state"
            :class="trafficVisible ? 'ts-on' : 'ts-off'"
            style="cursor:pointer;padding:3px 10px;font-size:0.55rem"
            :disabled="trafficLoading"
            @click="toggleTrafficLayer"
          >{{ trafficLoading ? '...' : trafficVisible ? 'ON' : 'OFF' }}</button>
        </div>

        <!-- Legend -->
        <div class="traffic-legend">
          <div class="tleg-row">
            <span class="tleg-dot" style="background:#22c55e"></span>
            <span class="tleg-label">การจราจรคล่องตัว</span>
            <span class="tleg-val" style="color:#22c55e">{{ trafficStats.free }}</span>
          </div>
          <div class="tleg-row">
            <span class="tleg-dot" style="background:#f59e0b"></span>
            <span class="tleg-label">การจราจรติดขัดเล็กน้อย</span>
            <span class="tleg-val" style="color:#f59e0b">{{ trafficStats.slow }}</span>
          </div>
          <div class="tleg-row">
            <span class="tleg-dot" style="background:#ef4444"></span>
            <span class="tleg-label">การจราจรติดขัดหนัก</span>
            <span class="tleg-val" style="color:#ef4444">{{ trafficStats.jam }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="action-row" style="gap:5px">
          <button type="button" class="apply-btn" style="flex:1" :disabled="!trafficVisible || trafficLoading" @click="loadTrafficLayer">
            {{ trafficLoading ? 'กำลังโหลด...' : '↺ รีเฟรช' }}
          </button>
        </div>
        <p v-if="trafficLastUpdate" class="muted-text" style="text-align:center;font-size:0.55rem">
          อัปเดตล่าสุด: {{ trafficLastUpdate }}
        </p>
        <p class="muted-text" style="font-size:0.53rem;text-align:center;opacity:.5;margin-top:2px">รีเฟรชอัตโนมัติทุก 60 วินาที</p>
      </div>
    </Transition>

    <!-- ── Water Panel ── -->
    <Transition name="panel-slide">
      <div v-if="panelWaterOpen" class="float-panel fp-water panel-card">
        <div class="panel-heading">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;flex-shrink:0;color:#38bdf8">
            <path d="M7 2C7 2 3 6 3 8.5a4 4 0 0 0 8 0C11 6 7 2 7 2z"/>
          </svg>
          แหล่งน้ำ / เขื่อน / อ่างเก็บน้ำ
        </div>

        <!-- Toggle -->
        <div class="tr-row tr-row-2" style="align-items:center">
          <span style="font-size:0.62rem;color:var(--h-pri);font-weight:600">แสดงบนแผนที่</span>
          <button type="button" class="bbt-state" :class="waterVisible ? 'ts-on':'ts-off'"
            style="cursor:pointer;padding:3px 10px;font-size:0.55rem"
            :disabled="waterLoading" @click="toggleWaterLayer">
            {{ waterLoading ? '...' : waterVisible ? 'ON' : 'OFF' }}
          </button>
        </div>

        <!-- Source list -->
        <div v-if="waterSources.length" class="water-source-list">
          <div v-for="s in waterSources" :key="s.id"
               class="water-source-item"
               :class="{ 'wsi-active': selectedWater?.id === s.id }"
               @click="selectedWater = selectedWater?.id === s.id ? null : s">
            <div class="wsi-top">
              <span class="wsi-icon">💧</span>
              <span class="wsi-name">{{ s.name || `แหล่งน้ำ #${s.id}` }}</span>
              <span v-if="s.pct != null" class="wsi-pct" :style="{ color: s.pct >= 70 ? '#22c55e' : s.pct >= 30 ? '#f59e0b' : '#ef4444' }">
                {{ s.pct.toFixed(1) }}%
              </span>
            </div>
            <div v-if="s.pct != null" class="wsi-bar-track">
              <div class="wsi-bar-fill"
                :style="{ width: s.pct + '%', background: s.pct >= 70 ? '#22c55e' : s.pct >= 30 ? '#f59e0b' : '#ef4444' }">
              </div>
            </div>
            <!-- Detail expand -->
            <div v-if="selectedWater?.id === s.id" class="wsi-detail">
              <div v-if="s.province"    class="wsi-drow"><span>จังหวัด</span><span>{{ s.province }}</span></div>
              <div v-if="s.levelM"      class="wsi-drow"><span>ระดับน้ำ</span><span>{{ s.levelM.toFixed(2) }} ม.</span></div>
              <div v-if="s.storedMCM"   class="wsi-drow"><span>ปริมาณน้ำ</span><span>{{ s.storedMCM.toFixed(1) }} ล้าน ม³</span></div>
              <div v-if="s.capacityMCM" class="wsi-drow"><span>ความจุสูงสุด</span><span>{{ s.capacityMCM.toFixed(1) }} ล้าน ม³</span></div>
              <div v-if="s.inflowMCM"   class="wsi-drow"><span>น้ำไหลเข้า</span><span>{{ s.inflowMCM.toFixed(2) }} ล้าน ม³</span></div>
              <div v-if="s.releasedMCM" class="wsi-drow"><span>น้ำระบาย</span><span>{{ s.releasedMCM.toFixed(2) }} ล้าน ม³</span></div>
              <div class="wsi-drow"><span>ประเภท</span><span>{{ s.type }}</span></div>
              <div v-if="!s.levelM && !s.storedMCM && s.pct == null" class="wsi-no-data">ไม่พบข้อมูลระดับน้ำ</div>
            </div>
          </div>
          <p v-if="!waterSources.length && waterVisible" class="muted-text" style="text-align:center">ไม่พบแหล่งน้ำในพื้นที่นี้</p>
        </div>
        <p v-else-if="!waterVisible" class="muted-text" style="text-align:center;font-size:0.58rem">เปิดใช้งานเพื่อดูแหล่งน้ำในแผนที่</p>

        <!-- Action -->
        <div class="action-row" style="gap:5px;margin-top:6px">
          <button type="button" class="apply-btn" style="flex:1"
            :disabled="!waterVisible || waterLoading" @click="loadWaterLayer">
            {{ waterLoading ? 'กำลังโหลด...' : '↺ รีเฟรช' }}
          </button>
        </div>
        <p v-if="waterLastUpdate" class="muted-text" style="text-align:center;font-size:0.55rem">
          อัปเดต: {{ waterLastUpdate }}
        </p>
        <p class="muted-text" style="font-size:0.52rem;text-align:center;opacity:.45;margin-top:2px">
          ข้อมูล: OSM · กรมชลประทาน · HII
        </p>
      </div>
    </Transition>


    <!-- ── Water Markers (fixed screen pos) ── -->
    <template v-if="waterVisible">
      <div v-for="pos in waterScreenPos" :key="'wm-'+pos.id"
           v-show="pos.visible"
           :style="{ position:'fixed', left: pos.x+'px', top: pos.y+'px', transform:'translate(-50%,-50%)', zIndex: selectedWater?.id === pos.id ? 420 : 400, cursor:'pointer' }"
           @click.stop="selectedWater = selectedWater?.id === pos.id ? null : pos.source">
        <!-- Pin icon -->
        <div class="wpin" :class="{ 'wpin-active': selectedWater?.id === pos.id }">
          <svg viewBox="0 0 18 22" width="18" height="22">
            <path d="M9 0C5.13 0 2 3.13 2 7c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z" fill="currentColor"/>
            <circle cx="9" cy="7" r="2.5" fill="rgba(0,0,0,0.25)"/>
          </svg>
        </div>
        <!-- Popup: เฉพาะตัวที่ถูกเลือก -->
        <Transition name="wfade">
          <div v-if="selectedWater?.id === pos.id" class="wmap-popup">
            <button class="wmap-popup-close" @click.stop="selectedWater = null">✕</button>
            <div class="wmap-popup-title">
              <svg viewBox="0 0 12 12" fill="#38bdf8" width="11" height="11"><path d="M6 1C6 1 2 5 2 7.5a4 4 0 0 0 8 0C10 5 6 1 6 1z"/></svg>
              {{ pos.source.name || 'แหล่งน้ำ' }}
            </div>
            <template v-if="pos.source.pct != null">
              <div class="wmap-popup-bar-row">
                <div class="wmap-popup-bar-track">
                  <div class="wmap-popup-bar-fill"
                    :style="{ width: pos.source.pct + '%', background: pos.source.pct >= 70 ? '#22c55e' : pos.source.pct >= 30 ? '#f59e0b' : '#ef4444' }"/>
                </div>
                <span :style="{ color: pos.source.pct >= 70 ? '#22c55e' : pos.source.pct >= 30 ? '#f59e0b' : '#ef4444', fontWeight:800, fontSize:'0.65rem' }">
                  {{ pos.source.pct.toFixed(1) }}%
                </span>
              </div>
            </template>
            <div class="wmap-popup-rows">
              <div v-if="pos.source.province"    class="wmap-popup-row"><span>จังหวัด</span><span>{{ pos.source.province }}</span></div>
              <div v-if="pos.source.levelM"      class="wmap-popup-row"><span>ระดับน้ำ</span><span>{{ pos.source.levelM.toFixed(2) }} ม.</span></div>
              <div v-if="pos.source.storedMCM"   class="wmap-popup-row"><span>ปริมาณน้ำ</span><span>{{ pos.source.storedMCM.toFixed(1) }} ล้าน ม³</span></div>
              <div v-if="pos.source.capacityMCM" class="wmap-popup-row"><span>ความจุ</span><span>{{ pos.source.capacityMCM.toFixed(1) }} ล้าน ม³</span></div>
              <div v-if="pos.source.inflowMCM"   class="wmap-popup-row"><span>น้ำไหลเข้า</span><span>{{ pos.source.inflowMCM.toFixed(2) }} ล้าน ม³</span></div>
              <div v-if="pos.source.releasedMCM" class="wmap-popup-row"><span>น้ำระบาย</span><span>{{ pos.source.releasedMCM.toFixed(2) }} ล้าน ม³</span></div>
              <div class="wmap-popup-row"><span>ประเภท</span><span>{{ pos.source.type }}</span></div>
            </div>
            <div class="wmap-popup-arrow"></div>
          </div>
        </Transition>
      </div>
    </template>


    <!-- ── OSM 3D Loading Toast ── -->
    <Transition name="panel-slide">
      <div v-if="osmBuilding3dLoading" style="position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:600;min-width:280px;background:rgba(2,5,13,.88);backdrop-filter:blur(10px);border:1px solid rgba(56,189,248,.25);border-radius:14px;padding:10px 16px;color:#e2e8f0;font-size:12px;pointer-events:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:7px">
            <span class="loading-dot"></span>
            <span style="color:#38bdf8;font-weight:600">โหลดอาคาร 3D</span>
          </div>
          <span style="color:#38bdf8;font-weight:700;font-size:13px">{{ osmLoadingPct }}%</span>
        </div>
        <div style="background:rgba(255,255,255,.1);border-radius:4px;height:4px;overflow:hidden;margin-bottom:6px">
          <div :style="{ width: osmLoadingPct + '%', background: osmLoadingPct === 100 ? '#22c55e' : '#38bdf8', height: '100%', borderRadius: '4px', transition: 'width .4s ease' }"></div>
        </div>
        <div style="color:#94a3b8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ osmLoadingStep }}</div>
      </div>
    </Transition>

    <!-- Traffic loading indicator -->
    <Transition name="fade">
      <div v-if="trafficLoading" style="position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:601;min-width:260px;background:rgba(2,5,13,.88);backdrop-filter:blur(10px);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:10px 16px;color:#e2e8f0;font-size:12px;pointer-events:none">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="loading-dot" style="background:#22c55e"></span>
          <span style="color:#22c55e;font-weight:600">กำลังโหลดข้อมูลจราจร...</span>
        </div>
      </div>
    </Transition>

    <!-- Water loading indicator -->
    <Transition name="fade">
      <div v-if="waterLoading" style="position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:601;min-width:260px;background:rgba(2,5,13,.88);backdrop-filter:blur(10px);border:1px solid rgba(14,165,233,.25);border-radius:14px;padding:10px 16px;color:#e2e8f0;font-size:12px;pointer-events:none">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="loading-dot" style="background:#0ea5e9"></span>
          <span style="color:#0ea5e9;font-weight:600">กำลังโหลดข้อมูลน้ำ...</span>
        </div>
      </div>
    </Transition>

    <!-- ── Water Pipe Drawing Tool Panel ── -->
    <Transition name="panel-slide">
      <div v-if="wpToolOpen" class="wpt-panel">
        <div class="wpt-header">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:13px;height:13px;color:#00ccff">
            <path d="M2 12L12 2M5 2h7v7"/>
          </svg>
          <span>เครื่องมือวางท่อประปา</span>
          <button class="wpt-close" @click="wpToolOpen=false; stopWPDraw(false)">✕</button>
        </div>

        <!-- Mode selector -->
        <div class="wpt-modes">
          <button v-for="m in [{id:'pipe',icon:'━',label:'ท่อ'},{id:'valve',icon:'✕',label:'วาล์ว'},{id:'hydrant',icon:'✚',label:'หัวดับเพลิง'},{id:'meter',icon:'●',label:'มิเตอร์'}]"
            :key="m.id" class="wpt-mode-btn" :class="{active: wpToolMode===m.id}"
            @click="wpToolMode=(m.id as any); stopWPDraw(false)">
            <span class="wpt-mode-icon">{{ m.icon }}</span>
            <span>{{ m.label }}</span>
          </button>
        </div>

        <!-- Pipe props (show when mode=pipe) -->
        <template v-if="wpToolMode==='pipe'">
          <div class="wpt-row">
            <label class="wpt-label">ขนาดท่อ</label>
            <select v-model.number="wpToolDiam" class="wpt-select">
              <option :value="100">4" (100mm)</option>
              <option :value="150">6" (150mm)</option>
              <option :value="200">8" (200mm)</option>
              <option :value="250">10" (250mm)</option>
              <option :value="300">12" (300mm)</option>
              <option :value="400">16" (400mm)</option>
              <option :value="500">20" (500mm)</option>
              <option :value="600">24" (600mm)</option>
            </select>
          </div>
          <div class="wpt-row">
            <label class="wpt-label">วัสดุ</label>
            <select v-model="wpToolMat" class="wpt-select">
              <option value="pvc">PVC (CAS)</option>
              <option value="ductile_iron">Ductile Iron (DIP)</option>
              <option value="hdpe">HDPE</option>
              <option value="steel">Steel (STL)</option>
            </select>
          </div>
          <div class="wpt-row">
            <label class="wpt-label">สถานะ</label>
            <select v-model="wpToolStatus" class="wpt-select">
              <option value="normal">ปกติ</option>
              <option value="leaking">รั่ว ⚠️</option>
              <option value="blocked">อุดตัน 🔴</option>
            </select>
          </div>
        </template>

        <!-- HUD hint -->
        <div class="wpt-hint">
          <template v-if="wpToolMode==='pipe'">👆 คลิกค้าง-ลากบนแผนที่เพื่อวางท่อ</template>
          <template v-else-if="wpToolMode==='valve'">👆 คลิกบนแผนที่เพื่อวางวาล์ว</template>
          <template v-else-if="wpToolMode==='hydrant'">👆 คลิกเพื่อวางหัวดับเพลิง</template>
          <template v-else>👆 คลิกเพื่อวางมิเตอร์น้ำ</template>
        </div>

        <!-- Stats + Actions -->
        <div class="wpt-stats">
          <span>ท่อ <strong>{{ wpUserPipes.length }}</strong></span>
          <span>·</span>
          <span>Node <strong>{{ wpUserNodes.length }}</strong></span>
        </div>
        <div class="wpt-actions">
          <button class="wpt-btn wpt-undo" :disabled="!wpUserPipes.length && !wpUserNodes.length" @click="undoWPLast">↩ Undo</button>
          <button class="wpt-btn wpt-clear" :disabled="!wpUserPipes.length && !wpUserNodes.length" @click="clearWPUser">🗑 ล้าง</button>
        </div>
      </div>
    </Transition>

    <!-- ── Water Supply Panel (ประปา) ── -->
    <Transition name="panel-slide">
      <div v-if="showWaterSupplyPanel" class="wsp-panel">
        <div class="wpt-header">
          <svg viewBox="0 0 14 14" fill="none" stroke="#00ccff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0">
            <circle cx="4" cy="7" r="2"/><circle cx="10" cy="7" r="2"/>
            <path d="M6 7h2M2 7H1M13 7h-1M4 5V3M10 5V3M4 9v2M10 9v2"/>
          </svg>
          <span>ระบบประปา</span>
          <button class="wpt-close" @click="showWaterSupplyPanel=false">✕</button>
        </div>

        <!-- Summary -->
        <div class="wsp-summary">
          <div class="wsp-stat">
            <div class="wsp-stat-val">{{ wpUserPipes.length }}</div>
            <div class="wsp-stat-lbl">ท่อ</div>
          </div>
          <div class="wsp-stat">
            <div class="wsp-stat-val">{{ wpUserNodes.filter(n=>n.type==='valve').length }}</div>
            <div class="wsp-stat-lbl">วาล์ว</div>
          </div>
          <div class="wsp-stat">
            <div class="wsp-stat-val">{{ wpUserNodes.filter(n=>n.type==='hydrant').length }}</div>
            <div class="wsp-stat-lbl">หัวดับเพลิง</div>
          </div>
          <div class="wsp-stat">
            <div class="wsp-stat-val">{{ wpUserNodes.filter(n=>n.type==='meter').length }}</div>
            <div class="wsp-stat-lbl">มิเตอร์</div>
          </div>
        </div>

        <!-- Open drawing tool -->
        <button class="wsp-tool-btn" @click="wpToolOpen = !wpToolOpen">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:12px;height:12px">
            <path d="M2 12L12 2M5 2h7v7"/>
          </svg>
          {{ wpToolOpen ? 'ปิดเครื่องมือวางท่อ' : 'เปิดเครื่องมือวางท่อ' }}
        </button>

        <!-- Pipe list -->
        <div v-if="wpUserPipes.length || wpUserNodes.length" class="wsp-list-title">รายการบนแผนที่</div>
        <div v-if="!wpUserPipes.length && !wpUserNodes.length" class="wsp-empty">ยังไม่มีข้อมูลบนแผนที่<br><span>ใช้เครื่องมือวางท่อเพื่อเริ่มวาด</span></div>

        <div v-if="wpUserPipes.length" class="wsp-list">
          <div v-for="p in wpUserPipes" :key="p.id" class="wsp-item" :class="p.status">
            <span class="wsp-item-icon">━</span>
            <div class="wsp-item-info">
              <span class="wsp-item-label">{{ p.label || p.id }}</span>
              <span class="wsp-item-meta">{{ p.diam }}mm · {{ p.mat?.toUpperCase() }}</span>
            </div>
            <span class="wsp-item-status" :class="p.status">
              {{ p.status==='leaking'?'รั่ว':p.status==='blocked'?'อุดตัน':'ปกติ' }}
            </span>
          </div>
        </div>

        <div v-if="wpUserNodes.length" class="wsp-list" style="margin-top:6px">
          <div v-for="n in wpUserNodes" :key="n.id" class="wsp-item">
            <span class="wsp-item-icon">{{ n.type==='valve'?'✕':n.type==='hydrant'?'✚':'●' }}</span>
            <div class="wsp-item-info">
              <span class="wsp-item-label">{{ n.type==='valve'?'วาล์ว':n.type==='hydrant'?'หัวดับเพลิง':'มิเตอร์' }}</span>
              <span class="wsp-item-meta">{{ n.id }}</span>
            </div>
          </div>
        </div>

        <div v-if="wpUserPipes.length || wpUserNodes.length" class="wpt-actions" style="margin-top:8px">
          <button class="wpt-btn wpt-undo" :disabled="!wpUserPipes.length && !wpUserNodes.length" @click="undoWPLast">↩ Undo</button>
          <button class="wpt-btn wpt-clear" :disabled="!wpUserPipes.length && !wpUserNodes.length" @click="clearWPUser">🗑 ล้าง</button>
        </div>
      </div>
    </Transition>

    <!-- ── WP User Pipe Labels ── -->
    <template v-if="wpUserPipes.length">
      <div v-for="pos in wpUserPipeScreen" :key="'wupl-'+pos.id" v-show="pos.visible"
           :style="{ position:'fixed', left:pos.x+'px', top:pos.y+'px', transform:'translate(-50%,-50%)', zIndex:360, pointerEvents:'none' }">
        <span class="wp-gis-label" :class="pos.pipe.status">{{ pos.pipe.label }}</span>
      </div>
    </template>
    <!-- ── WP User Node Labels ── -->
    <template v-if="wpUserNodes.length">
      <div v-for="pos in wpUserNodeScreen" :key="'wunn-'+pos.id" v-show="pos.visible"
           :style="{ position:'fixed', left:pos.x+'px', top:pos.y+'px', transform:'translate(-50%,-50%)', zIndex:370, pointerEvents:'none' }">
        <span class="wpt-node-chip" :class="pos.node.type">
          {{ pos.node.type==='valve'?'✕':pos.node.type==='hydrant'?'✚':'M' }}
        </span>
      </div>
    </template>

    <!-- ── อบต. Boundary Labels ── -->
    <template v-if="tambonVisible && tambonLabelPos.length">
      <div v-for="lbl in tambonLabelPos" :key="'tb-'+lbl.id" v-show="lbl.visible"
           :style="{ position:'fixed', left:lbl.x+'px', top:lbl.y+'px', transform:'translate(-50%,-50%)', zIndex:280, pointerEvents:'none' }">
        <span class="tambon-label">{{ lbl.name }}</span>
      </div>
    </template>

    <!-- ── Walk Person Drag Hint ── -->
    <div v-if="walkDragActive" class="walk-drop-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;margin-bottom:6px">
        <circle cx="12" cy="4" r="2"/><path d="M12 7v5M9 9l-3 5M15 9l3 5M10 12l1.5 5M14 12l-1.5 5"/>
      </svg>
      วางที่นี่เพื่อดูมุมมองจากจุดนี้
    </div>

    <!-- ── Walk Mode HUD ── -->
    <Transition name="panel-slide">
      <div v-if="walkMode" class="walk-hud">
        <div class="walk-hud-badge">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0">
            <circle cx="8" cy="3" r="1.5"/><path d="M8 5v4M6 7l-2 3M10 7l2 3M6.5 9l1 3M9.5 9l-1 3"/>
          </svg>
          Walk Mode
        </div>
        <span class="walk-hud-hint">{{ walkHint }}</span>
        <button type="button" class="walk-hud-exit" @click="exitWalkMode">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:9px;height:9px"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
          ออก
        </button>
      </div>
    </Transition>

    <!-- ── Floating Panels (above bottom bar) ── -->

    <!-- Map Panel -->
    <Transition name="panel-slide">
      <div v-if="panelMapOpen" class="float-panel fp-map panel-card">
        <div class="pc-header">
          <span class="pc-title">Map Location</span>
        </div>
        <div class="map-search">
          <input v-model.trim="mapSearchQuery" class="dt-input map-search-input" type="text" placeholder="ค้นหาสถานที่..." @keydown.enter.prevent="searchMapPlace" />
          <button type="button" class="search-btn" :disabled="mapSearchLoading" @click="searchMapPlace">
            <svg v-if="!mapSearchLoading" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><line x1="8.5" y1="8.5" x2="12" y2="12"/></svg>
            <span v-else class="loading-dot"></span>
          </button>
        </div>
        <div v-if="mapSearchResults.length" class="map-search-results">
          <button v-for="item in mapSearchResults" :key="`${item.lat},${item.lng},${item.display}`" type="button" class="map-result-btn" @click="applyMapSearchResult(item)">{{ item.display }}</button>
        </div>
        <button type="button" class="drag-select-btn" :class="{ 'ds-active': mapDragSelectOn }" :disabled="!viewerReady" @click="mapDragSelectOn = !mapDragSelectOn">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 1.5"><rect x="1" y="1" width="12" height="12" rx="1"/></svg>
          Drag Select
          <span class="ds-state" :class="mapDragSelectOn ? 'ts-on':'ts-off'">{{ mapDragSelectOn ? "ON" : "OFF" }}</span>
        </button>
        <div class="coord-table">
          <div class="coord-row">
            <span class="coord-label">LAT</span>
            <input :value="mapLat.toFixed(6)" class="dt-input coord-val" type="text" readonly />
          </div>
          <div class="coord-row">
            <span class="coord-label">LNG</span>
            <input :value="mapLng.toFixed(6)" class="dt-input coord-val" type="text" readonly />
          </div>
          <div class="coord-row">
            <span class="coord-label">ZOOM</span>
            <input v-model.number="mapZoom" class="dt-input coord-val" type="number" min="1" max="20" step="1" />
          </div>
        </div>
        <button type="button" class="apply-btn" @click="applyMapLocation">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,7 7,2 12,7"/><line x1="7" y1="2" x2="7" y2="13"/></svg>
          Apply Map
        </button>
        <div v-if="osmBuilding3dLoading" style="margin-top:8px">
          <div style="display:flex;justify-content:space-between;color:#38bdf8;font-size:11px;margin-bottom:3px">
            <span style="display:flex;align-items:center;gap:5px"><span class="loading-dot"></span>อาคาร 3D</span>
            <span style="font-weight:700">{{ osmLoadingPct }}%</span>
          </div>
          <div style="background:rgba(255,255,255,.12);border-radius:3px;height:3px;overflow:hidden">
            <div :style="{ width: osmLoadingPct + '%', background: osmLoadingPct === 100 ? '#22c55e' : '#38bdf8', height: '100%', transition: 'width .4s ease' }"></div>
          </div>
          <div style="color:#64748b;font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ osmLoadingStep }}</div>
        </div>
        <p v-if="mapSearchError" class="err-text">{{ mapSearchError }}</p>
        <p class="attrib-text">© OpenStreetMap · CartoDB</p>
      </div>
    </Transition>

    <!-- Model Panel -->
    <Transition name="panel-slide">
      <div v-if="panelModelOpen && modelEntities.length" class="float-panel fp-model panel-card">
        <div class="panel-heading"><span class="ph-dot"></span> Model Placement</div>
        <select class="dt-select" :value="selectedModelId ?? ''" @change="onSelectedModelChange">
          <option value="">— Select model —</option>
          <option v-for="entity in modelEntities" :key="entity.id" :value="entity.id">#{{ entity.id }} {{ entity.name }}</option>
        </select>
        <div class="action-row">
          <button type="button" class="mini-btn" :disabled="selectedModelId == null" @click="focusSelectedModel">Focus</button>
          <button type="button" class="mini-btn" :disabled="selectedModelId == null" @click="copySelectedModel">Copy</button>
          <button type="button" class="mini-btn" :disabled="!modelClipboard" @click="pasteCopiedModel">Paste</button>
          <button type="button" class="mini-btn danger-btn" :disabled="modelEntities.length === 0" @click="removeSelectedModel">Delete</button>
        </div>
        <div v-if="selectedModelId != null" class="transform-grid">
          <label class="tr-row"><span>X</span><input v-model.number="transformX" class="dt-input" type="number" step="0.1" @input="applySelectedTransform" /><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('x', -0.1)">−</button><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('x', 0.1)">+</button></label>
          <label class="tr-row"><span>Y</span><input v-model.number="transformY" class="dt-input" type="number" step="0.1" @input="applySelectedTransform" /><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('y', -0.1)">−</button><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('y', 0.1)">+</button></label>
          <label class="tr-row"><span>Z</span><input v-model.number="transformZ" class="dt-input" type="number" step="0.1" @input="applySelectedTransform" /><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('z', -0.1)">−</button><button class="nudge-btn" :disabled="selectedModelId == null" @click="nudgeSelected('z', 0.1)">+</button></label>
          <label class="tr-row tr-row-2"><span>RotY</span><input v-model.number="transformRotY" class="dt-input" type="number" step="1" @input="applySelectedTransform" /></label>
          <label class="tr-row tr-row-2"><span>Scale</span><input v-model.number="transformScale" class="dt-input" type="number" step="0.001" min="0.001" @input="applySelectedTransform" /></label>
        </div>
      </div>
    </Transition>

    <!-- Lamp Panel -->
    <Transition name="panel-slide">
      <div v-if="panelLampOpen" class="float-panel fp-lamp panel-card">
        <div class="panel-heading"><span class="ph-dot" style="background:#ffd060;box-shadow:0 0 6px #ffd060"></span> Street Lights</div>
        <div v-if="!lightDevices.length" class="muted-text" style="text-align:center;padding:10px 0">
          เปิด Place Mode แล้วคลิกบนแผนที่เพื่อวางเสาไฟ
        </div>
        <template v-else>
          <div class="lamp-stats">
            <div class="lamp-stat-box">
              <span class="lamp-stat-num">{{ lightDevices.length }}</span>
              <span class="lamp-stat-lbl">ทั้งหมด</span>
            </div>
            <div class="lamp-stat-box">
              <span class="lamp-stat-num" style="color:var(--on-color)">{{ lightDevices.filter(d => d.on).length }}</span>
              <span class="lamp-stat-lbl">เปิดอยู่</span>
            </div>
            <div class="lamp-stat-box">
              <span class="lamp-stat-num" style="color:var(--text-sec)">{{ lightDevices.filter(d => !d.on).length }}</span>
              <span class="lamp-stat-lbl">ปิดอยู่</span>
            </div>
          </div>
          <div class="action-row">
            <button type="button" class="apply-btn" style="flex:1" @click="setAllLights(true)">เปิดทั้งหมด</button>
            <button type="button" class="mini-btn" style="flex:1" @click="setAllLights(false)">ปิดทั้งหมด</button>
          </div>
          <div class="device-list">
            <div v-for="device in lightDevices" :key="device.id" class="device-row lamp-row" @click="openLightDetail(device.id)">
              <span class="lamp-pole-icon">🏮</span>
              <span class="device-name">{{ device.name }}</span>
              <span :class="device.on ? 'badge-on' : 'badge-off'" class="tool-badge">{{ device.on ? "ON" : "OFF" }}</span>
              <button type="button" class="mini-btn" @click.stop="toggleLightState(device.id)">{{ device.on ? "ปิด" : "เปิด" }}</button>
              <button type="button" class="mini-btn danger-btn" @click.stop="removeLightDevice(device.id)">✕</button>
            </div>
          </div>
        </template>
      </div>
    </Transition>

    <!-- Status Panel -->
    <Transition name="panel-slide">
      <div v-if="panelStatusOpen" class="float-panel fp-status panel-card">
        <div class="panel-heading"><span class="ph-dot"></span> Project</div>
        <div class="stat-row"><span class="stat-label">Models</span><span class="stat-val">{{ modelEntities.length }}</span></div>
        <div class="stat-row"><span class="stat-label">Street Lights</span><span class="stat-val">{{ lightDevices.length }}</span></div>
        <div class="stat-row"><span class="stat-label">Roads</span><span class="stat-val">{{ roadCount }}</span></div>
        <div v-if="loadedAssetCount" class="stat-row"><span class="stat-label">Assets</span><span class="stat-val">{{ loadedAssetCount }}</span></div>
        <div class="panel-section-label">SAVE / LOAD</div>
        <div v-if="isLimitedUser" style="display:flex;align-items:center;gap:5px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.25);border-radius:6px;padding:4px 8px;margin-bottom:4px">
          <span style="font-size:9px;font-weight:700;background:#eab308;color:#000;padding:1px 5px;border-radius:3px">{{ is7DayUser ? '7 วัน' : 'DEMO' }}</span>
          <span class="muted-text" style="font-size:0.6rem">บันทึกได้ {{ savedProjects.length }}/1 โปรเจค</span>
        </div>
        <label class="tr-row tr-row-2"><span>Name</span><input v-model.trim="projectName" class="dt-input" type="text" placeholder="Project name…" /></label>
        <div class="action-row">
          <button type="button" class="apply-btn" style="flex:1" :disabled="savingProject || !viewerReady || (isLimitedUser && savedProjects.length >= 1)" :title="isLimitedUser && savedProjects.length >= 1 ? `ไลเซนส์ ${is7DayUser ? '7 วัน' : 'DEMO'} บันทึกได้สูงสุด 1 โปรเจค` : ''" @click="saveProjectToSupabase">{{ savingProject ? "Saving…" : "💾 Save" }}</button>
          <button type="button" class="mini-btn" :disabled="loadingProjects" @click="fetchSavedProjects">{{ loadingProjects ? "…" : "↺ Refresh" }}</button>
        </div>
        <div class="saved-project-list">
          <p v-if="!savedProjects.length" class="muted-text">No saved projects</p>
          <div v-for="p in savedProjects" :key="p.id" class="saved-project-item">
            <div class="saved-project-meta">
              <p class="saved-project-name">{{ p.name }}</p>
              <p class="saved-project-date">{{ formatSavedProjectDate(p.created_at) }}</p>
            </div>
            <div class="action-row">
              <button type="button" class="mini-btn" :disabled="!!projectActionBusyId" @click="loadProjectFromSupabase(p.id)">{{ projectActionBusyId === `load:${p.id}` ? "…" : "Load" }}</button>
              <button type="button" class="mini-btn danger-btn" :disabled="!!projectActionBusyId" @click="deleteProjectFromSupabase(p.id)">{{ projectActionBusyId === `delete:${p.id}` ? "…" : "Del" }}</button>
            </div>
          </div>
        </div>
        <div v-if="projectLoadSuccess || projectLoadError || projectSaveSuccess || projectSaveError || projectDeleteSuccess || projectDeleteError || statusText" class="notify-stack">
          <p v-if="projectLoadError || projectSaveError || projectDeleteError" class="err-text">{{ projectLoadError || projectSaveError || projectDeleteError }}</p>
          <p v-else-if="projectLoadSuccess || projectSaveSuccess || projectDeleteSuccess" class="ok-text">{{ projectLoadSuccess || projectSaveSuccess || projectDeleteSuccess }}</p>
          <p class="muted-text" style="font-family:monospace">{{ statusText }}</p>
        </div>
        <p v-if="errorText" class="err-text">{{ errorText }}</p>
      </div>
    </Transition>

    <!-- ══ CCTV Settings Panel ══ -->
    <Transition name="panel-slide">
      <div v-if="showCctvPanel" class="float-panel fp-cctv panel-card">
        <div class="panel-heading">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;flex-shrink:0;color:var(--h-accent)">
            <rect x="1" y="3.5" width="9" height="7" rx="1.2"/><path d="M10 6l3-2v6l-3-2V6z"/>
          </svg>
          ตั้งค่ากล้อง CCTV
        </div>

        <!-- Add form -->
        <div class="cctv-add-section">
          <input v-model.trim="cctvNewName" class="dt-input" type="text" placeholder="ชื่อกล้อง" style="font-size:0.62rem" />
          <input v-model.trim="cctvNewUrl" class="dt-input" type="url" placeholder="URL กล้อง / stream…" style="font-size:0.62rem" @keydown.enter.prevent="addCctvCamera" />
          <button type="button" class="apply-btn" style="width:100%" @click="addCctvCamera">+ เพิ่มกล้อง</button>
        </div>

        <!-- Camera list – draggable -->
        <div class="cctv-section-label" style="margin-top:8px">
          ลากกล้องไปวางบนแผนที่
        </div>
        <div v-if="!cctvCameras.length" class="muted-text" style="text-align:center;padding:8px 0;font-size:0.58rem">ยังไม่มีกล้อง</div>
        <div
          v-for="cam in cctvCameras" :key="cam.id"
          class="cctv-drag-row"
          draggable="true"
          @dragstart="onCctvDragStart(cam.id)"
          @dragend="cctvDragCamId = null; cctvDragOver = false"
        >
          <svg class="cctv-drag-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 6.5l4-2.5v7l-4-2.5V6.5z"/>
          </svg>
          <span class="cctv-drag-name">{{ cam.name }}</span>
          <span class="cctv-drag-hint">⠿</span>
          <button type="button" class="ccr-del" @click.stop="removeCctvCamera(cam.id)" title="ลบ">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ══ CCTV Drag-over hint ══ -->
    <div v-if="cctvDragCamId !== null" class="cctv-dropzone-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;margin-bottom:6px">
        <rect x="1" y="5" width="15" height="11" rx="2"/><path d="M16 9l7-4v10l-7-4V9z"/>
      </svg>
      วางกล้องบนแผนที่
    </div>

    <!-- ══ CCTV Markers on map ══ -->
    <div
      v-for="marker in cctvMarkers" :key="marker.id"
      class="cctv-marker"
      :style="{
        left: (cctvScreenPos.find(p => p.id === marker.id)?.x ?? -9999) + 'px',
        top:  (cctvScreenPos.find(p => p.id === marker.id)?.y ?? -9999) + 'px',
        display: cctvScreenPos.find(p => p.id === marker.id)?.visible === false ? 'none' : ''
      }"
      @click="cctvActiveFeed = { markerId: marker.id, cameraId: marker.cameraId }"
    >
      <div class="cctv-marker-pulse"></div>
      <svg class="cctv-marker-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="5" width="13" height="10" rx="2"/><path d="M14 8l5-3v8l-5-3V8z"/>
        <circle cx="7" cy="10" r="2" fill="currentColor" stroke="none" opacity=".4"/>
      </svg>
      <span class="cctv-marker-label">{{ getCctvCamera(marker.cameraId)?.name }}</span>
      <button type="button" class="cctv-marker-del" @click.stop="removeCctvMarker(marker.id)" title="ลบ">✕</button>
    </div>

    <!-- ══ CCTV Feed Popup ══ -->
    <!-- ══ CCTV Feed Modal ══ -->
    <Transition name="cctv-feed-pop">
      <div
        v-if="cctvActiveFeed && getCctvCamera(cctvActiveFeed.cameraId)"
        class="cctv-feed-modal"
        @click.self="cctvActiveFeed = null"
      >
        <div class="cfp-window">
          <!-- Title bar -->
          <div class="cfp-titlebar">
            <div class="cfp-titlebar-dots">
              <span class="cfp-dot cfp-dot-red" @click="cctvActiveFeed = null"></span>
              <span class="cfp-dot cfp-dot-yellow"></span>
              <span class="cfp-dot cfp-dot-green"></span>
            </div>
            <div class="cfp-titlebar-center">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;color:var(--h-accent)">
                <rect x="1" y="3.5" width="9" height="7" rx="1.2"/><path d="M10 6l3-2v6l-3-2V6z"/>
              </svg>
              <span class="cfp-titlebar-name">{{ getCctvCamera(cctvActiveFeed.cameraId)!.name }}</span>
              <span class="cfp-titlebar-type">{{ cctvStreamType(getCctvCamera(cctvActiveFeed.cameraId)!.url) }}</span>
            </div>
            <button type="button" class="cfp-close-btn" @click="cctvActiveFeed = null" title="ปิด">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
            </button>
          </div>
          <!-- Feed area -->
          <div class="cfp-feed-area">
            <template v-if="cctvStreamType(getCctvCamera(cctvActiveFeed.cameraId)!.url) === 'mjpeg'">
              <img :src="getCctvCamera(cctvActiveFeed.cameraId)!.url" class="cfp-feed" alt="stream" />
            </template>
            <template v-else-if="cctvStreamType(getCctvCamera(cctvActiveFeed.cameraId)!.url) === 'video'">
              <video :src="getCctvCamera(cctvActiveFeed.cameraId)!.url" class="cfp-feed" autoplay muted controls playsinline />
            </template>
            <template v-else>
              <iframe :src="getCctvCamera(cctvActiveFeed.cameraId)!.url" class="cfp-feed" allow="autoplay; encrypted-media; camera" allowfullscreen frameborder="0" />
            </template>
            <!-- Scanline overlay for CCTV feel -->
            <div class="cfp-scanlines" aria-hidden="true"></div>
            <!-- Status bar -->
            <div class="cfp-statusbar">
              <span class="cfp-rec">⬤ REC</span>
              <span class="cfp-cam-id">CAM {{ cctvActiveFeed.markerId.toString().padStart(2,'0') }}</span>
              <span class="cfp-time">{{ new Date().toLocaleTimeString('th-TH') }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Street Light Detail Popup ───────────────────────────── -->
    <Transition name="detail-fade">
      <div v-if="showStreetLightDetail" class="light-detail-overlay" @click.self="closeLightDetail">
        <div class="light-detail-panel">
          <template v-if="getSelectedLightDetail() as any">

            <!-- Top status stripe -->
            <div class="ld-stripe" :class="getSelectedLightDetail()!.on ? 'stripe-on' : 'stripe-off'"></div>

            <!-- Header -->
            <div class="ld-header">
              <div class="ld-badge-icon" :class="getSelectedLightDetail()!.on ? 'lbi-on' : 'lbi-off'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="22" x2="12" y2="10"/>
                  <path d="M12 10 C12 10 12 6 16 5"/>
                  <rect x="14" y="3" width="5" height="3" rx="1.2"/>
                  <line x1="15" y1="6" x2="15" y2="7.5"/>
                  <line x1="17" y1="6" x2="17" y2="7.5"/>
                  <ellipse cx="16" cy="8" rx="2" ry="0.8"/>
                </svg>
              </div>
              <div class="ld-title-wrap">
                <p class="ld-title">{{ getSelectedLightDetail()!.name }}</p>
                <p class="ld-subtitle">{{ getSelectedLightDetail()!.zone }}&nbsp;&nbsp;·&nbsp;&nbsp;LED {{ getSelectedLightDetail()!.wattage }} W</p>
              </div>
              <button type="button" class="ld-close" @click="closeLightDetail" title="ปิด">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
              </button>
            </div>

            <!-- Status + toggle -->
            <div class="ld-status-bar">
              <div class="ld-status-pill" :class="getSelectedLightDetail()!.on ? 'sp-on' : 'sp-off'">
                <span class="sp-dot"></span>
                {{ getSelectedLightDetail()!.on ? "OPERATIONAL" : "INACTIVE" }}
              </div>
              <button type="button" class="ld-power-btn" :class="getSelectedLightDetail()!.on ? 'pw-on' : 'pw-off'"
                @click="toggleLightState(selectedStreetLightId!)">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M8 2v5M5.5 4A5 5 0 1 0 10.5 4"/>
                </svg>
                {{ getSelectedLightDetail()!.on ? "ปิดไฟ" : "เปิดไฟ" }}
              </button>
            </div>

            <!-- Info table -->
            <div class="ld-info-table">
              <div class="ld-row">
                <span class="ld-lbl">รหัสอุปกรณ์</span>
                <span class="ld-val ld-code">SL-{{ getSelectedLightDetail()!.id.toString().padStart(4, '0') }}</span>
              </div>
              <div class="ld-row">
                <span class="ld-lbl">โซนพื้นที่</span>
                <span class="ld-val">{{ getSelectedLightDetail()!.zone }}</span>
              </div>
              <div class="ld-row">
                <span class="ld-lbl">ประเภทหลอด</span>
                <span class="ld-val">LED {{ getSelectedLightDetail()!.wattage }} W · High Pressure Sodium</span>
              </div>
              <div class="ld-row">
                <span class="ld-lbl">วันที่ติดตั้ง</span>
                <span class="ld-val">{{ getSelectedLightDetail()!.installDate }}</span>
              </div>
              <div class="ld-row">
                <span class="ld-lbl">พิกัด (X, Z)</span>
                <span class="ld-val ld-code">{{ getSelectedLightDetail()!.posX }},  {{ getSelectedLightDetail()!.posZ }}</span>
              </div>
            </div>

            <!-- History section -->
            <div class="ld-history-header">
              <span class="lhh-label">ประวัติการดำเนินงาน</span>
              <span class="lhh-count">{{ getSelectedLightDetail()!.history.length }} รายการ</span>
            </div>
            <div class="ld-history">
              <div v-for="(entry, i) in getSelectedLightDetail()!.history" :key="i" class="ld-history-item"
                :class="`lhi-${entry.type === 'การติดตั้ง' ? 'install' : entry.type === 'ซ่อมบำรุง' ? 'repair' : entry.type === 'เปลี่ยนหลอดไฟ' ? 'replace' : 'inspect'}`">
                <div class="lhi-left">
                  <div class="lhi-date-day">{{ entry.date.slice(8) }}</div>
                  <div class="lhi-date-month">{{ ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][Number(entry.date.slice(5,7))] }}</div>
                  <div class="lhi-date-year">{{ entry.date.slice(0,4) }}</div>
                </div>
                <div class="lhi-bar"></div>
                <div class="lhi-right">
                  <div class="lhi-top">
                    <span class="lhi-badge">{{ entry.type }}</span>
                  </div>
                  <p class="lhi-note">{{ entry.note }}</p>
                  <p class="lhi-tech">
                    <svg class="lhi-icon" viewBox="0 0 14 14" fill="currentColor"><path d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6a5 5 0 0 1 10 0H2z"/></svg>
                    {{ entry.tech }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer actions -->
            <div class="ld-footer">
              <button type="button" class="ld-del-btn" @click="removeLightDevice(selectedStreetLightId!); closeLightDetail()">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 4h12M6 4V2h4v2M5 4v9h6V4"/><line x1="7" y1="7" x2="7" y2="11"/><line x1="9" y1="7" x2="9" y2="11"/></svg>
                ลบ
              </button>
              <button type="button" class="ld-close-btn" @click="closeLightDetail">ปิดหน้าต่าง</button>
            </div>

          </template>
        </div>
      </div>
    </Transition>

    <!-- ── Street Light Rotate Context Menu ── -->
    <Transition name="ctx-pop">
      <div v-if="showLightRotateMenu" class="lrm-overlay" @click.self="closeLightRotateMenu">
        <div class="lrm-card" :style="{ left: lightRotateMenuX + 'px', top: lightRotateMenuY + 'px' }">

          <!-- Header (drag handle) -->
          <div class="lrm-header lrm-drag-handle"
            @pointerdown="onLrmPointerDown"
            @pointermove="onLrmPointerMove"
            @pointerup="onLrmPointerUp">
            <div class="lrm-header-icon">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <path d="M3 9a6 6 0 1 0 6-6"/><path d="M5 5L3 3l-2 2"/>
              </svg>
            </div>
            <div class="lrm-header-text">
              <span class="lrm-title">ปรับทิศทางเสาไฟ</span>
              <span class="lrm-sub">{{ lightDevices.find(d => d.id === lightRotateMenuId)?.name ?? `#${lightRotateMenuId}` }}</span>
            </div>
            <button type="button" class="lrm-close" @click="closeLightRotateMenu">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
            </button>
          </div>

          <!-- Angle display -->
          <div class="lrm-angle-display">
            <svg class="lrm-compass" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="rgba(56,189,248,0.15)" stroke-width="1.5" fill="none"/>
              <circle cx="32" cy="32" r="28" stroke="rgba(56,189,248,0.35)" stroke-width="1" fill="none" stroke-dasharray="4 4"/>
              <!-- North tick -->
              <line x1="32" y1="4" x2="32" y2="10" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
              <text x="32" y="18" text-anchor="middle" fill="#536070" font-size="7" font-family="system-ui">N</text>
              <!-- Direction arrow (rotates with angle) -->
              <g :transform="`rotate(${lightRotateMenuAngle}, 32, 32)`">
                <line x1="32" y1="32" x2="32" y2="8" stroke="#ffd060" stroke-width="2.5" stroke-linecap="round"/>
                <polygon points="32,5 29,12 35,12" fill="#ffd060"/>
                <circle cx="32" cy="32" r="3" fill="#ffd060"/>
              </g>
            </svg>
            <div class="lrm-angle-val">
              <span class="lrm-deg-num">{{ lightRotateMenuAngle }}</span>
              <span class="lrm-deg-sym">°</span>
            </div>
          </div>

          <!-- Rotation buttons -->
          <div class="lrm-btn-row">
            <button type="button" class="lrm-rot-btn lrm-large" @click="rotateLightBy(-90)" title="-90°">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 8A6 6 0 1 0 8 14"/><path d="M14 4v4h-4"/></svg>
              <span>-90°</span>
            </button>
            <button type="button" class="lrm-rot-btn" @click="rotateLightBy(-45)" title="-45°">-45°</button>
            <button type="button" class="lrm-rot-btn" @click="rotateLightBy(-15)" title="-15°">-15°</button>
            <button type="button" class="lrm-rot-btn lrm-small" @click="rotateLightBy(-5)" title="-5°">-5°</button>
            <button type="button" class="lrm-rot-btn lrm-small" @click="rotateLightBy(5)" title="+5°">+5°</button>
            <button type="button" class="lrm-rot-btn" @click="rotateLightBy(15)" title="+15°">+15°</button>
            <button type="button" class="lrm-rot-btn" @click="rotateLightBy(45)" title="+45°">+45°</button>
            <button type="button" class="lrm-rot-btn lrm-large lrm-cw" @click="rotateLightBy(90)" title="+90°">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8a6 6 0 1 0 6-6"/><path d="M2 4v4h4"/></svg>
              <span>+90°</span>
            </button>
          </div>

          <!-- Preset cardinal directions -->
          <div class="lrm-presets">
            <span class="lrm-preset-label">ทิศด่วน</span>
            <div class="lrm-preset-row">
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(0)">N</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(45)">NE</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(90)">E</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(135)">SE</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(180)">S</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(225)">SW</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(270)">W</button>
              <button type="button" class="lrm-preset-btn" @click="setLightRotation(315)">NW</button>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <AiMapBeta
      v-if="viewerReady"
      :aqi="pm25Avg()"
      :pm25="pm25Pm25Avg()"
      :weather="pm25Weather"
      :traffic="trafficStats"
      :water-sources="waterSources"
      :lamps-on="lightDevices.filter(d => d.on).length"
      :lamps-total="lightDevices.length"
      :cctv-count="cctvCameras.length"
      :model-count="modelEntities.length"
      :location-name="pm25LocationName"
      :pollutants="aiPollutants"
      @refresh="refreshAiMapBeta"
    />

    <!-- ── Onboarding Tour ── -->
    <OnboardingTour ref="tourRef" />

  </main>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────── */
* { box-sizing: border-box; }

/* ── Loading Screen ───────────────────────────────────── */
.loader-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: #02050d;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

/* Animated background grid */
.loader-bg-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: grid-drift 18s linear infinite;
}
@keyframes grid-drift { from { background-position: 0 0; } to { background-position: 48px 48px; } }

/* Central radial glow */
.loader-bg-glow {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(56,189,248,0.07) 0%, transparent 70%);
  pointer-events: none;
}

/* Main content box */
.loader-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 0; width: 420px;
}

/* Hero image */
/* Logo card — clean white pill on dark bg */
.loader-logo-card {
  display: flex; align-items: center; justify-content: center;
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 36px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 8px 40px rgba(0,0,0,0.55),
    0 0 60px rgba(56,189,248,0.12);
  animation: logo-float 3s ease-in-out infinite;
}
.loader-logo-img {
  height: 64px; width: auto; max-width: 260px;
  object-fit: contain; display: block;
}
@keyframes logo-float {
  0%,100% { transform: translateY(0);   box-shadow: 0 8px 40px rgba(0,0,0,0.55), 0 0 60px rgba(56,189,248,0.12); }
  50%      { transform: translateY(-5px); box-shadow: 0 16px 50px rgba(0,0,0,0.6), 0 0 80px rgba(56,189,248,0.22); }
}
.loader-subtitle {
  margin: 10px 0 0; font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.32em; text-transform: uppercase;
  color: #38bdf8;
  text-shadow: 0 0 14px rgba(56,189,248,0.5);
}

/* Divider */
.loader-divider {
  width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.25), transparent);
}

/* Steps list */
.loader-steps {
  list-style: none; margin: 0; padding: 0;
  width: 100%; display: flex; flex-direction: column; gap: 10px;
}
.loader-step {
  display: flex; align-items: center; gap: 10px;
  opacity: 0.3; transition: opacity 0.4s;
}
.loader-step.ls-active { opacity: 1; }
.loader-step.ls-done   { opacity: 0.65; }

.ls-icon {
  width: 18px; height: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ls-icon svg { width: 14px; height: 14px; }
.ls-spin { animation: spin 0.9s linear infinite; transform-origin: center; }
@keyframes spin { to { transform: rotate(360deg); } }
.ls-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
}
.ls-label {
  font-size: 0.72rem; font-weight: 600; color: #94a3b8;
  letter-spacing: 0.03em;
}
.ls-active .ls-label { color: #e2eaf4; }
.ls-done .ls-label   { color: #34d399; }

/* Progress bar */
.loader-progress-track {
  width: 100%; height: 3px; border-radius: 999px;
  background: rgba(255,255,255,0.06); overflow: hidden;
}
.loader-progress-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(56,189,248,0.5);
}
.loader-pct {
  margin: 0; font-size: 0.58rem; color: #334155;
  font-family: monospace; letter-spacing: 0.06em; align-self: flex-end;
}

/* Fade-out transition */
.loader-fade-leave-active { transition: opacity 0.7s ease; }
.loader-fade-leave-to     { opacity: 0; }

.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0d1117;
  font-family: 'Inter', system-ui, sans-serif;
}

.viewport {
  width: 100%;
  height: calc(100% - 52px);
  background: #0d1117;
}

/* ── Design Tokens ────────────────────────────────────── */
.page {
  --h-bg:      rgba(13, 17, 26, 0.96);
  --h-border:  rgba(255,255,255,0.07);
  --h-blur:    blur(18px);
  --h-accent:  #38bdf8;
  --h-accent2: rgba(56,189,248,0.12);
  --h-pri:     #e2eaf4;
  --h-sec:     #536070;
  --h-mono:    #7dd3fc;
  --h-inp:     rgba(255,255,255,0.05);
  --h-inp-b:   rgba(255,255,255,0.10);
  --h-btn:     rgba(255,255,255,0.05);
  --h-btn-hov: rgba(255,255,255,0.09);
  --h-on:      #34d399;
  --h-off:     #475569;
  --h-danger:  #f87171;
  --h-r:       9px;
  --danger: #f87171;
  --on-color: #34d399;
  --off-color: #475569;
  --accent: #38bdf8;
  --accent-dim: rgba(56,189,248,0.12);
  --glass-bg: rgba(13,17,26,0.96);
  --glass-border: rgba(255,255,255,0.07);
  --glass-blur: blur(18px);
  --text-pri: #e2eaf4;
  --text-sec: #536070;
  --text-mono: #7dd3fc;
  --input-bg: rgba(255,255,255,0.05);
  --input-border: rgba(255,255,255,0.10);
  --btn-bg: rgba(255,255,255,0.05);
  --btn-hover: rgba(255,255,255,0.09);
}

/* ── Bottom Bar ───────────────────────────────────────── */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 52px;
  display: flex; align-items: center; gap: 4px;
  padding: 0 14px;
  background: var(--h-bg); backdrop-filter: var(--h-blur);
  border-top: 1px solid var(--h-border);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.45), 0 -1px 0 rgba(255,255,255,0.04);
  z-index: 100;
}

.bb-sep { width: 1px; height: 26px; flex-shrink: 0; background: var(--h-border); margin: 0 6px; }

/* Brand */
.bb-brand { display: flex; align-items: center; flex-shrink: 0; }
.bb-logo-wrap {
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-radius: 8px;
  padding: 3px 10px;
  height: 36px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.08);
  overflow: hidden;
}
.bb-logo-img { height: 28px; width: auto; max-width: 120px; object-fit: contain; display: block; }

/* Tool toggles */
.bb-tools { display: flex; gap: 4px; flex-shrink: 0; }
.bb-tool {
  display: flex; align-items: center; gap: 5px;
  height: 34px; padding: 0 10px; border-radius: 8px;
  border: 1px solid var(--h-border); background: var(--h-btn);
  color: var(--h-sec); cursor: pointer; transition: all 0.15s;
  font-size: 0.6rem; font-weight: 700; white-space: nowrap;
}
.bb-tool:hover { background: var(--h-btn-hov); color: var(--h-pri); border-color: rgba(255,255,255,0.12); }
.bb-tool:disabled { opacity: 0.35; cursor: not-allowed; }
.bbt-active { background: var(--h-accent2) !important; border-color: rgba(56,189,248,0.35) !important; color: var(--h-accent) !important; }
.bbt-icon  { width: 13px; height: 13px; flex-shrink: 0; }
.bbt-label { /* inherits from bb-tool */ }
.bbt-state { font-size: 0.5rem; font-weight: 800; letter-spacing: 0.07em; padding: 1px 5px; border-radius: 999px; flex-shrink: 0; }
.ts-on  { background: rgba(52,211,153,0.15); color: var(--h-on);  border: 1px solid rgba(52,211,153,0.3); }
.ts-off { background: rgba(71,85,105,0.2);  color: var(--h-off); border: 1px solid rgba(71,85,105,0.3); }

/* Navigation tabs */
.bb-nav { display: flex; gap: 2px; flex-shrink: 0; }
.bb-tab {
  display: flex; align-items: center; gap: 5px;
  height: 34px; padding: 0 12px; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  color: var(--h-sec); font-size: 0.62rem; font-weight: 700;
  letter-spacing: 0.04em; cursor: pointer; transition: all 0.15s;
  position: relative; white-space: nowrap;
}
.bb-tab svg { width: 13px; height: 13px; flex-shrink: 0; }
.bb-tab:hover { color: var(--h-pri); background: var(--h-btn); border-color: var(--h-border); }
.bb-tab:disabled { opacity: 0.28; cursor: not-allowed; }
.bbtab-active { background: var(--h-accent2) !important; border-color: rgba(56,189,248,0.3) !important; color: var(--h-accent) !important; }
.bbtab-badge {
  margin-left: 4px;
  background: var(--h-accent); color: #0d1117;
  font-size: 0.48rem; font-weight: 800; min-width: 14px; height: 14px;
  border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; padding: 0 3px;
}

/* Action buttons (right end) */
.bb-actions { display: flex; gap: 3px; margin-left: auto; flex-shrink: 0; }
.bb-act {
  width: 32px; height: 32px; border-radius: 7px;
  border: 1px solid var(--h-border); background: var(--h-btn);
  color: var(--h-sec); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.bb-act svg { width: 14px; height: 14px; }
.bb-act:hover  { background: var(--h-btn-hov); border-color: rgba(255,255,255,0.15); color: var(--h-pri); }
.bb-act.active { background: var(--h-accent2); border-color: var(--h-accent); color: var(--h-accent); }
.bb-act:disabled { opacity: 0.3; cursor: not-allowed; }

/* PM2.5 AQI tab in bottom bar */
.bb-tab-aqi { gap: 6px; }
.bb-aqi-box {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 22px; padding: 0 5px;
  border-radius: 5px; font-size: 0.65rem; font-weight: 800;
  letter-spacing: 0.01em; flex-shrink: 0;
}
.bb-aqi-label { font-size: 0.62rem; font-weight: 700; }
.bb-aqi-spinner {
  display: inline-block; width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.6);
  animation: bb-spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes bb-spin { to { transform: rotate(360deg); } }

/* ── Floating panels (above bottom bar) ──────────────── */
.float-panel {
  position: fixed;
  bottom: 60px;
  width: min(290px, calc(100vw - 28px));
  max-height: calc(100vh - 80px);
  overflow-y: auto; overflow-x: hidden;
  scrollbar-width: thin; scrollbar-color: var(--h-border) transparent;
  z-index: 99;
}
.fp-map    { left: 14px; }
.fp-model  { left: 320px; }
.fp-lamp   { left: 50%; transform: translateX(-50%); }
.fp-status { right: 14px; }
.fp-cctv   { left: 14px; width: min(240px, calc(100vw - 28px)); }

/* ══ CCTV Settings Panel ══ */
.cctv-add-section { display: flex; flex-direction: column; gap: 5px; }
.cctv-section-label {
  font-size: 0.52rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--h-sec); padding: 2px 0;
}
.cctv-drag-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 7px;
  border: 1px solid var(--h-border); background: var(--h-btn);
  cursor: grab; transition: all 0.15s; user-select: none;
}
.cctv-drag-row:hover { background: var(--h-btn-hov); border-color: rgba(56,189,248,0.3); }
.cctv-drag-row:active { cursor: grabbing; }
.cctv-drag-icon { width: 13px; height: 13px; flex-shrink: 0; color: var(--h-accent); }
.cctv-drag-name { font-size: 0.62rem; font-weight: 600; color: var(--h-pri); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cctv-drag-hint { font-size: 0.75rem; color: var(--h-sec); flex-shrink: 0; opacity: 0.5; }
.ccr-del { width: 18px; height: 18px; flex-shrink: 0; border-radius: 4px; border: none; background: transparent; color: var(--h-sec); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ccr-del:hover { background: rgba(248,113,113,0.15); color: #f87171; }
.ccr-del svg { width: 9px; height: 9px; }
.cctv-close-btn {
  margin-left: auto; width: 20px; height: 20px; flex-shrink: 0;
  border-radius: 5px; border: 1px solid var(--h-border); background: var(--h-btn);
  color: var(--h-sec); cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.cctv-close-btn:hover { background: var(--h-btn-hov); color: var(--h-pri); }
.cctv-close-btn svg { width: 9px; height: 9px; }

/* ══ Drag-over hint ══ */
.cctv-dropzone-hint {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 120; pointer-events: none;
  display: flex; flex-direction: column; align-items: center;
  color: var(--h-accent); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em;
  text-shadow: 0 0 20px rgba(56,189,248,0.8);
  animation: cctv-pulse 1s ease-in-out infinite;
}
@keyframes cctv-pulse { 0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)} }

/* ══ CCTV Marker on map ══ */
.cctv-marker {
  position: fixed; z-index: 110;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  cursor: pointer;
}
.cctv-marker-pulse {
  position: absolute; width: 36px; height: 36px; border-radius: 50%;
  background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4);
  animation: cctv-ring 2s ease-out infinite;
}
@keyframes cctv-ring { 0%{transform:scale(0.6);opacity:1} 100%{transform:scale(1.6);opacity:0} }
.cctv-marker-icon {
  width: 28px; height: 28px; position: relative; z-index: 1;
  color: #38bdf8; filter: drop-shadow(0 0 6px rgba(56,189,248,0.7));
  background: rgba(2,5,13,0.75); border-radius: 7px; padding: 4px;
  border: 1px solid rgba(56,189,248,0.4);
  transition: transform 0.15s;
}
.cctv-marker:hover .cctv-marker-icon { transform: scale(1.15); }
.cctv-marker-label {
  position: relative; z-index: 1;
  font-size: 0.52rem; font-weight: 700; color: #fff;
  background: rgba(2,5,13,0.8); padding: 1px 6px; border-radius: 4px;
  white-space: nowrap; backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.08);
}
.cctv-marker-del {
  position: absolute; top: -5px; right: -5px; z-index: 2;
  width: 14px; height: 14px; border-radius: 50%;
  border: 1px solid rgba(248,113,113,0.5); background: rgba(2,5,13,0.9);
  color: #f87171; font-size: 7px; cursor: pointer;
  display: none; align-items: center; justify-content: center; line-height: 1;
}
.cctv-marker:hover .cctv-marker-del { display: flex; }

/* ══ CCTV Feed Modal ══ */
.cctv-feed-modal {
  position: fixed; inset: 0; bottom: 52px; z-index: 160;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.25);
  pointer-events: all;
}
.cfp-window {
  width: min(900px, calc(100vw - 40px));
  height: min(580px, calc(100vh - 120px));
  display: flex; flex-direction: column;
  /* Glass effect */
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255,255,255,0.18);
  border-bottom-color: rgba(255,255,255,0.08);
  border-right-color: rgba(255,255,255,0.08);
  border-radius: 14px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 2px 0 rgba(255,255,255,0.12) inset,
    0 32px 80px rgba(0,0,0,0.5),
    0 0 80px rgba(56,189,248,0.08);
  overflow: hidden;
}

/* Title bar */
.cfp-titlebar {
  display: flex; align-items: center; gap: 10px;
  padding: 0 14px; height: 38px; flex-shrink: 0;
  background: rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  user-select: none;
}
.cfp-titlebar-dots { display: flex; gap: 6px; flex-shrink: 0; }
.cfp-dot { width: 11px; height: 11px; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
.cfp-dot-red    { background: #ff5f57; }
.cfp-dot-yellow { background: #ffbd2e; }
.cfp-dot-green  { background: #28ca41; }
.cfp-dot:hover  { filter: brightness(1.2); }
.cfp-titlebar-center {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  font-size: 0.62rem; color: rgba(255,255,255,0.55);
}
.cfp-titlebar-name { font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 0.02em; }
.cfp-titlebar-type {
  font-size: 0.48rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);
  padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15);
}
.cfp-close-btn {
  width: 22px; height: 22px; flex-shrink: 0; border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.35); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.cfp-close-btn:hover { background: rgba(255,95,87,0.25); color: #ff5f57; border-color: rgba(255,95,87,0.4); }
.cfp-close-btn svg { width: 9px; height: 9px; }

/* Feed area */
.cfp-feed-area {
  flex: 1; position: relative;
  background: rgba(0,0,0,0.35);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.cfp-feed { width: 100%; height: 100%; object-fit: contain; display: block; border: none; outline: none; }

/* Scanlines */
.cfp-scanlines { display: none; }

/* Status bar */
.cfp-statusbar {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 3;
  display: flex; align-items: center; gap: 12px;
  padding: 5px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  font-size: 0.55rem; font-weight: 700; letter-spacing: 0.08em; color: rgba(255,255,255,0.5);
  pointer-events: none;
}
.cfp-rec { color: #f87171; display: flex; align-items: center; gap: 3px; animation: cfp-blink 1.5s step-end infinite; }
@keyframes cfp-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
.cfp-cam-id { color: var(--h-accent); }
.cfp-time { margin-left: auto; }

.cctv-feed-pop-enter-active, .cctv-feed-pop-leave-active { transition: opacity 0.2s, transform 0.2s; }
.cctv-feed-pop-enter-from, .cctv-feed-pop-leave-to { opacity: 0; transform: scale(0.96); }

/* ── PM2.5 Panel (Glassmorphism) ── */
.pm25-panel {
  position: fixed; top: 14px; left: 14px;
  width: min(210px, calc(100vw - 28px));
  z-index: 99;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  font-family: system-ui, -apple-system, sans-serif;
  padding: 14px 15px 12px;
}
.pm25-close-btn {
  position: absolute; top: 9px; right: 9px;
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.08);
  color: rgba(0,0,0,0.4); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; z-index: 1;
}
.pm25-close-btn:hover { background: rgba(0,0,0,0.16); }
.pm25-close-btn svg { width: 7px; height: 7px; }
/* Loading */
.pm25-loading-row {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 0; font-size: 0.62rem; color: rgba(0,0,0,0.55);
}
/* No data */
.pm25-nodata {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 14px 0; font-size: 0.6rem; color: rgba(0,0,0,0.5); text-align: center;
}
/* Top row */
.pm25-top-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 6px; margin-bottom: 10px; padding-right: 4px;
}
.pm25-left { display: flex; flex-direction: column; gap: 6px; }
.pm25-aqi-box {
  display: inline-flex; flex-direction: column; align-items: center;
  padding: 6px 16px; border-radius: 14px; width: fit-content;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.pm25-aqi-num { font-size: 2.1rem; font-weight: 900; line-height: 1; letter-spacing: -0.03em; }
.pm25-aqi-label { font-size: 0.42rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; opacity: 0.65; }
.pm25-level-text { font-size: 0.72rem; font-weight: 700; }
.pm25-label-big {
  flex-shrink: 0; align-self: center;
  font-size: 1.6rem; font-weight: 900; letter-spacing: -0.02em; line-height: 1;
}
/* Pollutant row */
.pm25-pollutant-row {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.6rem; margin-bottom: 5px;
  color: rgba(0,0,0,0.65);
}
/* Weather row */
.pm25-weather-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.6rem; margin-bottom: 8px; flex-wrap: wrap;
  color: rgba(0,0,0,0.5);
}
.pm25-wx-item { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
/* Footer */
.pm25-footer-row {
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08);
}
.pm25-station-name {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.5rem; color: rgba(0,0,0,0.4);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.pm25-refresh-btn {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.12); background: rgba(255,255,255,0.45);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.pm25-refresh-btn:hover { background: rgba(255,255,255,0.75); }
.pm25-refresh-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── PM2.5 Detail Modal ── */
.pm25-modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.pm25-modal {
  background: transparent;
  width: min(860px, 100%);
  height: min(720px, 88vh);
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: system-ui,-apple-system,sans-serif;
}
.pm25-modal::-webkit-scrollbar { display: none; }
.pm25-modal-head-left { display: flex; align-items: center; gap: 10px; }
.pm25-modal-head-icon {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  display: flex; align-items: center; justify-content: center;
}
.pm25-modal-head-title { font-size: 1.1rem; font-weight: 700; color: #fff; }
.pm25-modal-head-sub { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 1px; }
.pm25-modal-x {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: #fff; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.pm25-modal-x:hover { background: rgba(255,255,255,0.25); }
/* Loader */
.pm25-modal-loader {
  display: flex; align-items: center; gap: 10px; padding: 32px 20px;
  color: #e2e8f0; font-size: 0.9rem;
  background: rgba(15,23,42,0.7); border-radius: 14px;
}
/* Sections */
.pm25-modal-section { padding: 16px 22px; }
.pm25-ms-header { display: flex; align-items: flex-start; margin-bottom: 12px; }
.pm25-ms-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
.pm25-ms-sub   { font-size: 0.75rem; color: #94a3b8; }
/* 3-card layout */
.pm25-cards-wrapper {
  display: flex; flex-direction: column; gap: 12px;
  padding: 8px 0;
  flex: 1; min-height: 0;
}
.pm25-cards-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4px 4px; flex-shrink: 0;
}
.pm25-cards-topbar-left { display: flex; align-items: center; gap: 10px; }
.pm25-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 14px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.pm25-cards-bottom {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  flex: 1; min-height: 0;
}
.pm25-cards-bottom .pm25-card {
  flex-shrink: 1; overflow-y: auto; scrollbar-width: none;
}
.pm25-cards-bottom .pm25-card::-webkit-scrollbar { display: none; }
.pm25-poll-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
@media (max-width: 520px) {
  .pm25-cards-bottom { grid-template-columns: 1fr; }
  .pm25-poll-row { grid-template-columns: 1fr; }
}
/* Hourly scroll */
.pm25-hourly-scroll {
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px;
  scrollbar-width: none;
}
.pm25-hourly-scroll::-webkit-scrollbar { display: none; }
.pm25-hi {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  min-width: 68px; flex-shrink: 0; padding: 10px 8px; border-radius: 12px;
  border: 1px solid #f1f5f9; background: #fafbfc; transition: background 0.12s;
}
.pm25-hi:hover { background: #f1f5f9; }
.pm25-hi-now { background: #eff6ff !important; border-color: #bfdbfe !important; }
.pm25-hi-time  { font-size: 0.7rem; color: #64748b; font-weight: 500; }
.pm25-hi-aqi {
  width: 50px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.88rem; font-weight: 800;
}
.pm25-hi-wicon { line-height: 0; }
.pm25-hi-temp  { font-size: 0.8rem; font-weight: 600; color: #334155; }
.pm25-hi-wind  { display: flex; align-items: center; gap: 3px; font-size: 0.65rem; color: #94a3b8; }
.pm25-hi-hum   { font-size: 0.65rem; color: #94a3b8; }
/* Divider */
.pm25-modal-divider { height: 1px; background: #f1f5f9; margin: 0 22px; }
/* Two columns */
.pm25-modal-cols { display: grid; grid-template-columns: 1fr auto 1fr; }
.pm25-modal-col-divider { width: 1px; background: #f1f5f9; margin: 16px 0; }
/* Daily list */
.pm25-daily-list { display: flex; flex-direction: column; gap: 3px; }
.pm25-di {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 8px; border-radius: 8px; font-size: 0.78rem;
  transition: background 0.1s;
}
.pm25-di:hover { background: #f8fafc; }
.pm25-di-today { background: #eff6ff !important; border: 1px solid #bfdbfe !important; }
.pm25-di-day   { width: 52px; flex-shrink: 0; color: #334155; font-weight: 600; }
.pm25-di-icon  { flex-shrink: 0; line-height: 0; }
.pm25-di-aqi {
  width: 40px; height: 26px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800;
}
.pm25-di-temps { flex: 1; font-weight: 600; color: #334155; font-size: 0.78rem; }
.pm25-di-temps span { color: #94a3b8; font-weight: 400; margin-left: 4px; }
.pm25-di-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.pm25-di-wind  { font-size: 0.65rem; color: #64748b; white-space: nowrap; }
.pm25-di-hum   { font-size: 0.65rem; color: #64748b; white-space: nowrap; }
/* Pollutants */
.pm25-poll-grid { display: flex; flex-direction: column; gap: 8px; }
.pm25-poll-item { padding: 11px 13px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; }
.pm25-poll-top { margin-bottom: 7px; }
.pm25-poll-name { display: block; font-size: 0.88rem; font-weight: 700; color: #1e293b; }
.pm25-poll-desc { display: block; font-size: 0.68rem; color: #94a3b8; margin-top: 2px; }
.pm25-poll-val  { display: flex; align-items: center; gap: 7px; font-size: 1rem; font-weight: 700; color: #334155; }
.pm25-pdot      { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.pm25-poll-unit { font-size: 0.7rem; font-weight: 400; color: #94a3b8; margin-left: 1px; }
/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Traffic Panel ── */
.fp-traffic { left: 50%; transform: translateX(-50%); width: min(260px, calc(100vw - 28px)); }
.traffic-legend { display: flex; flex-direction: column; gap: 5px; padding: 6px 0; border-top: 1px solid var(--h-border); border-bottom: 1px solid var(--h-border); }
.tleg-row { display: flex; align-items: center; gap: 7px; }
.tleg-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }
.tleg-label { font-size: 0.6rem; color: var(--h-pri); flex: 1; }
.tleg-val { font-size: 0.6rem; font-weight: 700; flex-shrink: 0; font-variant-numeric: tabular-nums; }

/* ── Water Layer ── */
.fp-water { left: 50%; transform: translateX(-50%); width: min(280px, calc(100vw - 28px)); max-height: 70vh; overflow-y: auto; }
.water-source-list { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; max-height: 340px; overflow-y: auto; }
.water-source-item {
  background: rgba(14,165,233,0.07);
  border: 1px solid rgba(14,165,233,0.18);
  border-radius: 8px; padding: 7px 9px;
  cursor: pointer; transition: background .15s;
}
.water-source-item:hover { background: rgba(14,165,233,0.14); }
.wsi-active { background: rgba(14,165,233,0.22) !important; border-color: rgba(14,165,233,0.5) !important; }
.wsi-top { display: flex; align-items: center; gap: 5px; }
.wsi-icon { font-size: 0.75rem; flex-shrink: 0; }
.wsi-name { font-size: 0.62rem; color: var(--h-pri); font-weight: 600; flex: 1; line-height: 1.3; }
.wsi-pct { font-size: 0.65rem; font-weight: 800; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.wsi-bar-track { height: 3px; background: rgba(255,255,255,0.08); border-radius: 99px; margin-top: 5px; overflow: hidden; }
.wsi-bar-fill { height: 100%; border-radius: 99px; transition: width .4s ease; }
.wsi-detail { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(14,165,233,0.15); display: flex; flex-direction: column; gap: 3px; }
.wsi-drow { display: flex; justify-content: space-between; font-size: 0.58rem; color: var(--h-sec); }
.wsi-drow span:last-child { color: var(--h-pri); font-weight: 600; }
.wsi-no-data { font-size: 0.57rem; color: var(--h-sec); opacity: .6; text-align: center; padding: 2px 0; }
.water-marker { filter: drop-shadow(0 0 6px #0ea5e9); }

/* ── Water pin marker ── */
.wpin {
  color: #38bdf8;
  filter: drop-shadow(0 1px 4px rgba(14,165,233,0.6));
  transition: transform .15s, color .15s;
  line-height: 0;
}
.wpin:hover { transform: scale(1.25); color: #7dd3fc; }
.wpin-active { color: #0ea5e9; transform: scale(1.3); filter: drop-shadow(0 0 8px rgba(14,165,233,0.9)); }

/* ── Water popup (shown only for selected) ── */
.wmap-popup {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(2,8,22,0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(14,165,233,0.45);
  border-radius: 10px;
  padding: 9px 12px 8px;
  min-width: 160px; max-width: 220px;
  box-shadow: 0 6px 28px rgba(0,0,0,0.6), 0 0 18px rgba(14,165,233,0.2);
  user-select: none;
  pointer-events: auto;
}
.wmap-popup-close {
  position: absolute; top: 5px; right: 7px;
  background: none; border: none; color: rgba(148,210,252,0.5);
  font-size: 0.65rem; cursor: pointer; padding: 0; line-height: 1;
}
.wmap-popup-close:hover { color: #e0f2fe; }
.wmap-popup-title {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.68rem; font-weight: 700; color: #e0f2fe;
  padding-right: 14px; margin-bottom: 6px; line-height: 1.3;
}
.wmap-popup-bar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.wmap-popup-bar-track { flex: 1; height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.wmap-popup-bar-fill { height: 100%; border-radius: 99px; transition: width .4s; }
.wmap-popup-rows { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid rgba(14,165,233,0.12); padding-top: 5px; }
.wmap-popup-row { display: flex; justify-content: space-between; gap: 8px; font-size: 0.59rem; color: rgba(148,210,252,0.65); }
.wmap-popup-row span:last-child { color: #bae6fd; font-weight: 600; text-align: right; }
.wmap-popup-arrow {
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-top: 7px solid rgba(14,165,233,0.45);
}
/* Transition */
.wfade-enter-active, .wfade-leave-active { transition: opacity .15s, transform .15s; }
.wfade-enter-from, .wfade-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }

/* ── Walk drag button ── */
.walk-drag-btn {
  cursor: grab !important;
  transition: all 0.15s;
}
.walk-drag-btn:active, .walk-dragging { cursor: grabbing !important; transform: scale(1.15); }
.walk-dragging { background: var(--h-accent2) !important; border-color: var(--h-accent) !important; color: var(--h-accent) !important; }

/* ── Walk drag drop hint ── */
/* ── Water Pipe Layer ── */
.fp-waterpipe { left: 50%; transform: translateX(-50%); width: min(290px, calc(100vw - 28px)); max-height: 72vh; overflow-y: auto; }
.wp-node-list { display: flex; flex-direction: column; gap: 3px; }
.wp-node-item { display: flex; align-items: center; gap: 6px; padding: 5px 7px; border-radius: 6px; background: rgba(0,200,255,0.06); border-left: 3px solid rgba(0,200,255,0.2); cursor: pointer; transition: background .15s; }
.wp-node-item.warning { border-left-color: #e0a030; }
.wp-node-item.critical { border-left-color: #e05050; background: rgba(224,80,80,0.07); }
.wp-node-item:hover { background: rgba(0,200,255,0.12); }
.wp-node-icon { font-size: 0.75rem; flex-shrink: 0; }
.wp-node-info { flex: 1; min-width: 0; }
.wp-node-name { font-size: 0.6rem; color: var(--h-pri); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wp-node-id { font-size: 0.55rem; color: var(--h-sec); }
.wp-node-status { font-size: 0.55rem; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.wp-node-status.normal   { background: rgba(34,197,94,0.15); color: #22c55e; }
.wp-node-status.warning  { background: rgba(224,160,48,0.15); color: #e0a030; }
.wp-node-status.critical { background: rgba(224,80,80,0.15); color: #e05050; }
.wp-node-status.offline  { background: rgba(128,128,128,0.15); color: #888; }
.wp-pipe-list { display: flex; flex-direction: column; gap: 2px; }
.wp-pipe-item { display: flex; align-items: center; gap: 5px; padding: 4px 7px; border-radius: 5px; background: rgba(0,200,255,0.05); font-size: 0.58rem; }
.wp-pipe-item.leaking  { background: rgba(224,160,48,0.1); }
.wp-pipe-item.blocked  { background: rgba(224,80,80,0.1); }
.wp-pipe-id    { color: #00ccff; font-weight: 700; flex-shrink: 0; }
.wp-pipe-label { color: var(--h-sec); flex: 1; }
.wp-pipe-status { flex-shrink: 0; }
.wp-pipe-status.normal      { color: #22c55e; }
.wp-pipe-status.leaking     { color: #e0a030; }
.wp-pipe-status.blocked     { color: #e05050; }
.wp-pipe-status.maintenance { color: #8080e0; }

/* ── GIS-style pipe label ── */
.wp-gis-label {
  display: inline-block;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(0,100,200,0.5);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.6rem; font-weight: 800;
  color: #0044cc;
  white-space: nowrap;
  letter-spacing: 0.04em;
  font-family: 'Orbitron', monospace;
  text-shadow: none;
}
.wp-gis-label.leaking { color: #c07000; border-color: rgba(200,120,0,0.5); }
.wp-gis-label.blocked { color: #cc0000; border-color: rgba(200,0,0,0.5); }

/* ── GIS-style node chip ── */
.wpn-gis-chip {
  display: flex; align-items: center; gap: 4px;
  background: rgba(10,20,50,0.82);
  border: 1.5px solid #dd2222;
  border-radius: 5px;
  padding: 2px 7px 2px 4px;
  white-space: nowrap;
  box-shadow: 0 1px 6px rgba(0,0,0,0.5);
}
.wpn-gis-chip.warning { border-color: #e0a030; }
.wpn-gis-chip.normal  { border-color: #1a88ff; }
.wpn-gis-icon { font-size: 0.68rem; flex-shrink: 0; }
.wpn-gis-id   { font-size: 0.6rem; font-weight: 800; color: #ff6666; letter-spacing: 0.03em; font-family: 'Orbitron', monospace; }
.wpn-gis-chip.warning .wpn-gis-id { color: #e0a030; }
.wpn-gis-chip.normal  .wpn-gis-id { color: #55aaff; }

/* ── GIS popup ── */
.wpn-gis-popup {
  position: absolute; top: calc(100% + 5px); left: 50%; transform: translateX(-50%);
  background: rgba(2,10,25,0.92); backdrop-filter: blur(12px);
  border: 1px solid rgba(0,150,255,0.4); border-radius: 8px;
  padding: 7px 10px; min-width: 170px; z-index: 10;
}
.wpn-gis-popup-name { font-size: 0.62rem; font-weight: 700; color: #55aaff; margin-bottom: 5px; }
.wpn-gis-popup-row  { display: flex; justify-content: space-between; gap: 8px; font-size: 0.57rem; color: var(--h-sec); margin-bottom: 2px; }
.wpn-gis-popup-row span:last-child { color: var(--h-pri); font-weight: 600; }
.wpn-s-normal   { color: #22c55e !important; }
.wpn-s-warning  { color: #e0a030 !important; }
.wpn-s-critical { color: #e05050 !important; }
.wpn-s-offline  { color: #888    !important; }

/* ── Water Supply Panel (ประปา) ── */
.wsp-panel {
  position: fixed; right: 14px; bottom: 52px; z-index: 509;
  width: 240px; max-height: 70vh; overflow-y: auto;
  background: rgba(2,8,22,0.93); backdrop-filter: blur(16px);
  border: 1px solid rgba(0,204,255,0.35); border-radius: 12px;
  padding: 12px; color: var(--h-pri);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  scrollbar-width: none;
}
.wsp-summary {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 6px;
  margin: 10px 0;
}
.wsp-stat {
  background: rgba(0,204,255,0.07); border: 1px solid rgba(0,204,255,0.15);
  border-radius: 8px; padding: 6px 4px; text-align: center;
}
.wsp-stat-val { font-size: 1.1rem; font-weight: 700; color: #00ccff; line-height: 1; }
.wsp-stat-lbl { font-size: 0.55rem; color: var(--h-sec); margin-top: 3px; }
.wsp-tool-btn {
  width: 100%; height: 32px; border-radius: 8px; border: 1px solid rgba(0,204,255,0.4);
  background: rgba(0,204,255,0.1); color: #00ccff; font-size: 0.7rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background .15s;
}
.wsp-tool-btn:hover { background: rgba(0,204,255,0.2); }
.wsp-list-title { font-size: 0.6rem; font-weight: 700; color: var(--h-sec); text-transform: uppercase; letter-spacing: .06em; margin: 10px 0 4px; }
.wsp-empty { text-align: center; padding: 14px 0; font-size: 0.65rem; color: var(--h-sec); line-height: 1.7; }
.wsp-empty span { font-size: 0.6rem; opacity: .6; }
.wsp-list { display: flex; flex-direction: column; gap: 3px; }
.wsp-item {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 7px; border-radius: 7px;
  background: rgba(0,204,255,0.04); border: 1px solid rgba(0,204,255,0.1);
  font-size: 0.62rem;
}
.wsp-item.leaking  { border-color: rgba(224,160,48,0.3); background: rgba(224,160,48,0.07); }
.wsp-item.blocked  { border-color: rgba(224,80,80,0.3); background: rgba(224,80,80,0.07); }
.wsp-item-icon { font-size: 0.75rem; color: #00ccff; flex-shrink: 0; width: 14px; text-align: center; }
.wsp-item-info { flex: 1; min-width: 0; }
.wsp-item-label { display: block; color: var(--h-pri); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wsp-item-meta  { display: block; color: var(--h-sec); font-size: 0.55rem; margin-top: 1px; }
.wsp-item-status { flex-shrink: 0; font-size: 0.55rem; font-weight: 700; }
.wsp-item-status.normal      { color: #22c55e; }
.wsp-item-status.leaking     { color: #e0a030; }
.wsp-item-status.blocked     { color: #e05050; }
.wsp-item-status.maintenance { color: #8080e0; }

/* ── Water Pipe Drawing Tool ── */
.wpt-panel {
  position: fixed; right: 14px; bottom: 52px; z-index: 510;
  width: 220px;
  background: rgba(2,8,22,0.92); backdrop-filter: blur(16px);
  border: 1px solid rgba(0,204,255,0.3); border-radius: 12px;
  padding: 12px; color: var(--h-pri);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.wpt-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.65rem; font-weight: 700; color: #00e8ff;
  margin-bottom: 10px;
}
.wpt-header span { flex: 1; }
.wpt-close { background: none; border: none; color: #888; cursor: pointer; font-size: 0.75rem; padding: 0 2px; }
.wpt-close:hover { color: #fff; }

.wpt-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px; }
.wpt-mode-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: rgba(0,204,255,0.06); border: 1px solid rgba(0,204,255,0.2);
  border-radius: 8px; padding: 6px 4px; cursor: pointer; color: var(--h-sec);
  font-size: 0.57rem; font-weight: 600; transition: all .15s;
}
.wpt-mode-btn:hover  { background: rgba(0,204,255,0.12); border-color: rgba(0,204,255,0.4); color: var(--h-pri); }
.wpt-mode-btn.active { background: rgba(0,204,255,0.2);  border-color: #00ccff; color: #00e8ff; }
.wpt-mode-icon { font-size: 1rem; line-height: 1; }

.wpt-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.wpt-label  { font-size: 0.58rem; color: var(--h-sec); flex-shrink: 0; width: 54px; }
.wpt-select {
  flex: 1; background: rgba(0,204,255,0.07); border: 1px solid rgba(0,204,255,0.25);
  border-radius: 6px; color: var(--h-pri); font-size: 0.58rem; padding: 3px 6px;
}
.wpt-select:focus { outline: none; border-color: #00ccff; }

.wpt-hint {
  font-size: 0.57rem; color: #6aabcf; background: rgba(0,204,255,0.06);
  border-radius: 6px; padding: 5px 8px; margin-bottom: 8px; line-height: 1.4;
  border: 1px solid rgba(0,204,255,0.12);
}
.wpt-stats { display: flex; gap: 5px; align-items: center; font-size: 0.57rem; color: var(--h-sec); margin-bottom: 7px; }
.wpt-stats strong { color: #00e8ff; }
.wpt-actions { display: flex; gap: 5px; }
.wpt-btn {
  flex: 1; padding: 5px 6px; border-radius: 7px; font-size: 0.58rem; font-weight: 700;
  cursor: pointer; border: 1px solid; transition: all .15s;
}
.wpt-btn:disabled { opacity: .35; cursor: not-allowed; }
.wpt-undo  { background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.3); color: #38bdf8; }
.wpt-clear { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.3);  color: #ef4444; }
.wpt-undo:not(:disabled):hover  { background: rgba(56,189,248,0.2); }
.wpt-clear:not(:disabled):hover { background: rgba(239,68,68,0.2); }

/* Node chip labels (screen overlay) */
.wpt-node-chip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  font-size: 0.65rem; font-weight: 900; line-height: 1;
}
.wpt-node-chip.valve   { background: rgba(224,160,48,0.9); color: #fff; border: 1.5px solid #e0a030; }
.wpt-node-chip.hydrant { background: rgba(220,30,30,0.9);  color: #fff; border: 1.5px solid #ee3333; }
.wpt-node-chip.meter   { background: rgba(26,85,204,0.9);  color: #fff; border: 1.5px solid #1a55cc; }

/* ── อบต. Boundary Label ── */
.tambon-label {
  display: inline-block;
  background: rgba(20, 15, 0, 0.72);
  border: 1.5px solid rgba(255, 204, 0, 0.85);
  color: #ffe866;
  font-family: 'Noto Sans Thai', sans-serif;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  backdrop-filter: blur(2px);
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.walk-drop-hint {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 120; pointer-events: none;
  display: flex; flex-direction: column; align-items: center;
  color: #34d399; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em;
  text-shadow: 0 0 20px rgba(52,211,153,0.8);
  animation: walk-drop-pulse 0.8s ease-in-out infinite;
}
@keyframes walk-drop-pulse { 0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.05)} }

/* ── Walk Mode HUD ── */
.walk-hud {
  position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%);
  z-index: 110;
  display: flex; align-items: center; gap: 10px;
  padding: 6px 10px 6px 8px;
  background: rgba(2,5,13,0.82); backdrop-filter: blur(16px);
  border: 1px solid rgba(56,189,248,0.35); border-radius: 999px;
  box-shadow: 0 0 20px rgba(56,189,248,0.15);
  white-space: nowrap;
}
.walk-hud-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--h-accent); flex-shrink: 0;
}
.walk-hud-hint { font-size: 0.57rem; color: rgba(255,255,255,0.5); }
.walk-hud-exit {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 999px; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6); font-size: 0.58rem; font-weight: 700; cursor: pointer;
  transition: all 0.15s;
}
.walk-hud-exit:hover { background: rgba(255,95,87,0.2); color: #ff5f57; border-color: rgba(255,95,87,0.4); }

/* Panel slide transition */
.panel-slide-enter-active, .panel-slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Panel cards ──────────────────────────────────────── */
.panel-card {
  background: var(--h-bg); backdrop-filter: var(--h-blur);
  border: 1px solid var(--h-border); border-radius: var(--h-r);
  padding: 11px 11px 12px; display: flex; flex-direction: column; gap: 7px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.25);
}
.pc-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 7px; border-bottom: 1px solid var(--h-border); }
.pc-title { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--h-pri); }
.panel-heading { display: flex; align-items: center; gap: 6px; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--h-pri); padding-bottom: 7px; border-bottom: 1px solid var(--h-border); }
.ph-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--h-accent); flex-shrink: 0; }
.panel-section-label { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--h-sec); margin-top: 2px; }

/* ── Inputs ───────────────────────────────────────────── */
.dt-input {
  height: 28px; border-radius: 6px;
  border: 1px solid var(--h-inp-b); background: var(--h-inp);
  color: var(--h-mono); font-size: 0.68rem; padding: 0 9px; width: 100%;
  transition: border-color 0.15s; font-family: monospace;
}
.dt-input:focus { outline: none; border-color: var(--h-accent); box-shadow: 0 0 0 2px rgba(56,189,248,0.12); }
.dt-input[readonly] { color: var(--h-sec); font-family: monospace; }
.dt-select {
  height: 28px; border-radius: 6px;
  border: 1px solid var(--h-inp-b); background: var(--h-inp);
  color: var(--h-pri); font-size: 0.68rem; width: 100%; padding: 0 6px;
}

/* ── Map search ───────────────────────────────────────── */
.map-search { display: grid; grid-template-columns: 1fr 32px; gap: 5px; align-items: center; }
.map-search-input { min-width: 0; }
.search-btn {
  width: 32px; height: 28px; border-radius: 6px;
  border: 1px solid var(--h-inp-b); background: var(--h-btn);
  color: var(--h-sec); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.search-btn svg { width: 13px; height: 13px; }
.search-btn:hover { background: var(--h-btn-hov); color: var(--h-pri); border-color: var(--h-accent); }
.search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.loading-dot { width: 7px; height: 7px; border-radius: 50%; border: 2px solid var(--h-sec); border-top-color: var(--h-accent); animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.map-search-results { display: flex; flex-direction: column; gap: 3px; max-height: 120px; overflow: auto; }
.map-result-btn {
  text-align: left; border: 1px solid var(--h-border); background: var(--h-btn);
  color: var(--h-pri); border-radius: 6px; font-size: 0.62rem; padding: 5px 8px; cursor: pointer;
  transition: all 0.12s; line-height: 1.3;
}
.map-result-btn:hover { background: var(--h-btn-hov); border-color: rgba(255,255,255,0.15); }

/* Drag select button */
.drag-select-btn {
  display: flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 9px; border-radius: 6px;
  border: 1px solid var(--h-inp-b); background: var(--h-btn);
  color: var(--h-sec); font-size: 0.62rem; font-weight: 700; cursor: pointer;
  transition: all 0.15s;
}
.drag-select-btn svg { width: 12px; height: 12px; flex-shrink: 0; }
.drag-select-btn .ds-state { margin-left: auto; }
.drag-select-btn:hover { background: var(--h-btn-hov); color: var(--h-pri); }
.drag-select-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ds-active { background: var(--h-accent2) !important; border-color: rgba(56,189,248,0.3) !important; color: var(--h-accent) !important; }

/* Coordinate table */
.coord-table { display: flex; flex-direction: column; gap: 4px; }
.coord-row { display: grid; grid-template-columns: 38px 1fr; align-items: center; gap: 6px; }
.coord-label { font-size: 0.56rem; font-weight: 800; letter-spacing: 0.09em; color: var(--h-sec); text-transform: uppercase; }
.coord-val { font-family: 'JetBrains Mono', monospace; }
.attrib-text { margin: 0; font-size: 0.52rem; color: var(--h-sec); opacity: 0.7; }

/* ── Buttons ──────────────────────────────────────────── */
.apply-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; border-radius: 7px;
  border: 1px solid rgba(56,189,248,0.4);
  background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(14,116,144,0.25));
  color: var(--h-accent); font-size: 0.68rem; font-weight: 800;
  letter-spacing: 0.06em; cursor: pointer; width: 100%; transition: all 0.15s;
}
.apply-btn svg { width: 13px; height: 13px; }
.apply-btn:hover { background: linear-gradient(135deg, rgba(56,189,248,0.22), rgba(14,116,144,0.35)); border-color: rgba(56,189,248,0.6); }
.apply-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.mini-btn {
  height: 26px; padding: 0 9px; border-radius: 6px;
  border: 1px solid var(--h-border); background: var(--h-btn);
  color: var(--h-pri); font-size: 0.62rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.mini-btn:hover { background: var(--h-btn-hov); border-color: rgba(255,255,255,0.15); color: var(--h-accent); }
.mini-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.mini-active { background: var(--h-accent2) !important; border-color: rgba(56,189,248,0.3) !important; color: var(--h-accent) !important; }
.danger-btn { border-color: rgba(248,113,113,0.3) !important; color: var(--h-danger) !important; }
.danger-btn:hover { background: rgba(248,113,113,0.1) !important; border-color: rgba(248,113,113,0.5) !important; }
.action-row { display: flex; gap: 4px; flex-wrap: wrap; }

/* Transform grid */
.transform-grid { display: flex; flex-direction: column; gap: 4px; }
.tr-row { display: grid; grid-template-columns: 36px 1fr 22px 22px; align-items: center; gap: 4px; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.05em; color: var(--h-sec); }
.tr-row-2 { grid-template-columns: 36px 1fr; }
.nudge-btn { height: 22px; width: 22px; border-radius: 5px; border: 1px solid var(--h-border); background: var(--h-btn); color: var(--h-pri); font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.nudge-btn:hover { background: var(--h-btn-hov); border-color: var(--h-accent); color: var(--h-accent); }
.nudge-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Stats */
.stat-row { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.stat-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.06em; color: var(--h-sec); text-transform: uppercase; }
.stat-val { font-size: 0.7rem; font-weight: 800; color: var(--h-accent); font-family: monospace; }
.saved-project-list { display: flex; flex-direction: column; gap: 4px; max-height: 160px; overflow: auto; }
.saved-project-item { display: grid; grid-template-columns: 1fr auto; gap: 6px; align-items: center; border: 1px solid var(--h-border); border-radius: 7px; background: rgba(255,255,255,0.03); padding: 5px 7px; }
.saved-project-meta { min-width: 0; }
.saved-project-name { margin: 0; font-size: 0.65rem; color: var(--text-pri); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.saved-project-date { margin: 2px 0 0; font-size: 0.57rem; color: var(--text-sec); }
.notify-stack { display: flex; flex-direction: column; gap: 4px; }
.muted-text { margin: 0; font-size: 0.62rem; color: var(--text-sec); }
.ok-text   { margin: 0; font-size: 0.62rem; color: var(--on-color); }
.err-text  { margin: 0; font-size: 0.62rem; color: var(--danger); }
.device-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
.device-row { display: flex; align-items: center; gap: 5px; justify-content: space-between; padding: 4px 6px; border: 1px solid var(--glass-border); border-radius: 7px; background: rgba(0,20,40,0.35); }
.device-name { font-size: 0.63rem; color: var(--text-pri); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-input { display: none; }

/* ── Tab count badge ──────────────────────────────────── */
.tab-count { margin-left: 4px; background: var(--accent-dim); color: var(--accent); border-radius: 999px; font-size: 0.52rem; padding: 1px 5px; font-weight: 800; }

/* ── Lamp panel ────────────────────────────────────────── */
.lamp-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; }
.lamp-stat-box { background: rgba(0,20,40,0.45); border: 1px solid var(--glass-border); border-radius: 8px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.lamp-stat-num { font-size: 1.1rem; font-weight: 800; color: var(--accent); line-height: 1; font-family: monospace; }
.lamp-stat-lbl { font-size: 0.52rem; color: var(--text-sec); font-weight: 700; letter-spacing: 0.05em; }
.lamp-row { cursor: pointer; transition: border-color 0.15s; }
.lamp-row:hover { border-color: rgba(255,208,96,0.5); background: rgba(30,20,0,0.45); }
.lamp-pole-icon { font-size: 0.85rem; flex-shrink: 0; }

/* ── Light Detail Popup — Professional Light Theme ──────────── */
.light-detail-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,23,42,0.60); backdrop-filter: blur(6px);
}
.light-detail-panel {
  width: min(460px, calc(100vw - 24px));
  max-height: calc(100vh - 40px);
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.22);
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Top accent stripe */
.ld-stripe { height: 4px; flex-shrink: 0; }
.stripe-on  { background: linear-gradient(90deg, #16a34a, #4ade80); }
.stripe-off { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }

/* Header */
.ld-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.ld-badge-icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ld-badge-icon svg { width: 26px; height: 26px; }
.lbi-on  { background: #ecfdf5; color: #16a34a; border: 1.5px solid #bbf7d0; }
.lbi-off { background: #f1f5f9; color: #64748b; border: 1.5px solid #e2e8f0; }
.ld-title-wrap { flex: 1; min-width: 0; }
.ld-title { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
.ld-subtitle { margin: 3px 0 0; font-size: 0.72rem; color: #64748b; font-weight: 500; }
.ld-close {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; color: #94a3b8; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.ld-close svg { width: 12px; height: 12px; }
.ld-close:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }

/* Status bar */
.ld-status-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 18px; background: #fff; border-bottom: 1px solid #f1f5f9;
}
.ld-status-pill {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
  padding: 5px 12px; border-radius: 999px;
}
.sp-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sp-on  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.sp-on .sp-dot  { background: #22c55e; box-shadow: 0 0 6px #22c55e80; animation: blink 2s ease-in-out infinite; }
.sp-off { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.sp-off .sp-dot { background: #94a3b8; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.45} }

.ld-power-btn {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 16px; border-radius: 8px;
  font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1.5px solid;
}
.ld-power-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.pw-on  { background: #fff1f2; border-color: #fecdd3; color: #dc2626; }
.pw-on:hover  { background: #fee2e2; border-color: #fca5a5; }
.pw-off { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
.pw-off:hover { background: #dcfce7; border-color: #86efac; }

/* Info table */
.ld-info-table { display: flex; flex-direction: column; border-bottom: 1px solid #f1f5f9; }
.ld-row {
  display: grid; grid-template-columns: 130px 1fr; align-items: center;
  padding: 8px 18px; gap: 12px;
}
.ld-row:nth-child(odd) { background: #f8fafc; }
.ld-lbl { font-size: 0.68rem; font-weight: 600; color: #64748b; letter-spacing: 0.02em; }
.ld-val { font-size: 0.75rem; font-weight: 600; color: #0f172a; }
.ld-code { font-family: 'JetBrains Mono', 'Fira Mono', monospace; color: #1e40af; font-size: 0.73rem; }

/* History section header */
.ld-history-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px 8px;
  background: #fff;
}
.lhh-label { font-size: 0.72rem; font-weight: 700; color: #334155; letter-spacing: 0.04em; text-transform: uppercase; }
.lhh-count { font-size: 0.68rem; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; font-weight: 600; }

/* History items */
.ld-history { overflow-y: auto; max-height: 260px; display: flex; flex-direction: column; gap: 6px; padding: 0 14px 14px; background: #fff; }
.ld-history-item {
  display: flex; gap: 0; border-radius: 10px; overflow: hidden;
  border: 1px solid #e2e8f0; background: #fff;
}
.lhi-left {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 10px 12px; min-width: 52px; gap: 1px;
  background: #f8fafc; border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.lhi-date-day  { font-size: 1.15rem; font-weight: 800; color: #1e293b; line-height: 1; }
.lhi-date-month{ font-size: 0.6rem;  font-weight: 700; color: #64748b; text-transform: uppercase; }
.lhi-date-year { font-size: 0.58rem; color: #94a3b8; font-weight: 500; margin-top: 2px; }
.lhi-bar { width: 4px; flex-shrink: 0; }
.lhi-install .lhi-bar { background: #22c55e; }
.lhi-repair  .lhi-bar { background: #f97316; }
.lhi-replace .lhi-bar { background: #eab308; }
.lhi-inspect .lhi-bar { background: #3b82f6; }
.lhi-right { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lhi-top { display: flex; align-items: center; gap: 7px; }
.lhi-badge {
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.05em;
  padding: 2px 8px; border-radius: 4px;
}
.lhi-install .lhi-badge { background: #dcfce7; color: #15803d; }
.lhi-repair  .lhi-badge { background: #ffedd5; color: #c2410c; }
.lhi-replace .lhi-badge { background: #fef9c3; color: #a16207; }
.lhi-inspect .lhi-badge { background: #dbeafe; color: #1d4ed8; }
.lhi-note { margin: 0; font-size: 0.72rem; color: #334155; line-height: 1.45; font-weight: 500; }
.lhi-tech {
  margin: 0; font-size: 0.65rem; color: #64748b; font-weight: 500;
  display: flex; align-items: center; gap: 4px;
}
.lhi-icon { width: 11px; height: 11px; flex-shrink: 0; opacity: 0.6; }

/* Footer */
.ld-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-shrink: 0;
}
.ld-del-btn {
  display: flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px; border-radius: 8px;
  border: 1.5px solid #fecdd3; background: #fff; color: #dc2626;
  font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
}
.ld-del-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.ld-del-btn:hover { background: #fee2e2; border-color: #fca5a5; }
.ld-close-btn {
  flex: 1; height: 36px; border-radius: 8px;
  border: 1.5px solid #3b82f6; background: #1d4ed8; color: #fff;
  font-size: 0.75rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em; transition: all 0.15s;
}
.ld-close-btn:hover { background: #1e40af; }

/* ── Detail panel transition ─────────────────────────────── */
.detail-fade-enter-active, .detail-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.detail-fade-enter-from, .detail-fade-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }

@media (max-width: 768px) {
  .bb-logo-wrap { padding: 3px 8px; }
  .bb-logo-img { max-width: 90px; }
  .bbt-label { display: none; }
  .bb-sep { margin: 0 2px; }
  .bb-tool { padding: 0 8px; }
  .bb-tab  { padding: 0 8px; }
}

/* ── Light Rotate Context Menu ───────────────────────── */
.lrm-overlay {
  position: fixed; inset: 0; z-index: 300; pointer-events: none;
}
.lrm-card {
  position: absolute;
  width: 270px;
  background: rgba(10,14,26,0.97);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(56,189,248,0.22);
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.06);
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  pointer-events: all;
}

/* Header */
.lrm-header {
  display: flex; align-items: center; gap: 9px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(56,189,248,0.06);
}
.lrm-drag-handle {
  cursor: grab;
  user-select: none;
}
.lrm-drag-handle:active { cursor: grabbing; }
.lrm-header-icon {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25);
  display: flex; align-items: center; justify-content: center; color: #38bdf8;
}
.lrm-header-icon svg { width: 16px; height: 16px; }
.lrm-header-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.lrm-title { font-size: 0.72rem; font-weight: 800; color: #e2eaf4; letter-spacing: 0.04em; }
.lrm-sub   { font-size: 0.6rem; color: #536070; font-weight: 500; margin-top: 1px; }
.lrm-close {
  width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #536070; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.lrm-close svg { width: 10px; height: 10px; }
.lrm-close:hover { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.3); color: #f87171; }

/* Compass + angle */
.lrm-angle-display {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 14px 16px 10px;
}
.lrm-compass { width: 64px; height: 64px; flex-shrink: 0; }
.lrm-angle-val { display: flex; align-items: baseline; gap: 2px; }
.lrm-deg-num { font-size: 2.6rem; font-weight: 800; color: #ffd060; font-family: monospace; line-height: 1; min-width: 64px; text-align: right; }
.lrm-deg-sym { font-size: 1.2rem; font-weight: 700; color: #536070; }

/* Rotation buttons */
.lrm-btn-row {
  display: flex; align-items: center; gap: 3px;
  padding: 0 12px 10px;
}
.lrm-rot-btn {
  flex: 1; height: 30px; border-radius: 7px; min-width: 0;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: #94a3b8; font-size: 0.58rem; font-weight: 700; cursor: pointer;
  transition: all 0.14s; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 3px;
}
.lrm-rot-btn svg { width: 12px; height: 12px; flex-shrink: 0; }
.lrm-rot-btn:hover { background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.3); color: #38bdf8; }
.lrm-small { font-size: 0.54rem; }
.lrm-large { flex: 1.4; font-size: 0.56rem; }
.lrm-cw svg { transform: scaleX(-1); }

/* Cardinal presets */
.lrm-presets {
  padding: 0 12px 13px;
  display: flex; flex-direction: column; gap: 6px;
}
.lrm-preset-label { font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #475569; }
.lrm-preset-row { display: flex; gap: 3px; }
.lrm-preset-btn {
  flex: 1; height: 26px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
  color: #64748b; font-size: 0.56rem; font-weight: 800; cursor: pointer;
  transition: all 0.13s; letter-spacing: 0.03em;
}
.lrm-preset-btn:hover { background: rgba(255,208,96,0.12); border-color: rgba(255,208,96,0.3); color: #ffd060; }

/* Pop transition */
.ctx-pop-enter-active, .ctx-pop-leave-active { transition: opacity 0.15s, transform 0.15s; }
.ctx-pop-enter-from, .ctx-pop-leave-to { opacity: 0; transform: scale(0.92) translateY(-6px); }

/* ── Night mode UI overrides ─────────────────────────── */
.night-mode .bottom-bar {
  background: rgba(2, 5, 15, 0.97);
  border-top-color: rgba(30, 80, 180, 0.18);
  box-shadow: 0 -6px 32px rgba(0,10,40,0.7), 0 -1px 0 rgba(60,120,255,0.08);
}
.night-mode .float-panel {
  background: rgba(3, 6, 18, 0.97);
  border-color: rgba(40, 90, 200, 0.2);
  box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(40,90,200,0.1);
}
/* Viewport gets a subtle blue-night vignette */
.night-mode .viewport::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(2,4,18,0.55) 100%);
}
.night-mode .viewport { position: relative; }

/* ── Compass ──────────────────────────────────────────── */
.map-compass {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 120;
  cursor: default;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.55));
  transition: opacity 0.2s;
  opacity: 0.88;
  pointer-events: none;
}
.map-compass:hover { opacity: 1; }
</style>
