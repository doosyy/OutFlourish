import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Badge } from '@capawesome/capacitor-badge'
import { LocalNotifications } from '@capacitor/local-notifications'

// ─── Data Models ──────────────────────────────────────────────────────────────

export type LightLevel = 'low' | 'medium' | 'bright'
export type Hemisphere = 'Northern' | 'Southern'
export type DueState = 'overdue' | 'soon' | 'ok' | 'fresh'
export type Severity = 'overdue' | 'soon' | 'ok'

export interface WaterLog {
  id: string
  timestamp: number
  type: 'water' | 'fertilize' | 'repot'
  amountMl?: number
  note?: string
}

export interface Plant {
  id: string                   // plant_{timestamp}
  name: string
  species?: string             // display name
  speciesId?: string           // FK → SpeciesProfile.id
  photo: string                // user upload OR fallback to species.photo (relative path or full URL)
  baseIntervalDays: number
  recommendedMl: number        // per drink in growing season
  winterMl: number             // dialed-back winter amount
  room?: string                // FK → Room.name
  mood?: string                // user-editable anthropomorphic line
  history: WaterLog[]
  createdAt: number
  nfcTagId?: string
}

export interface Room {
  id: string                   // kebab-case, e.g. 'living-room'
  name: string                 // display, e.g. 'Living Room'
  light: LightLevel
  notes?: string
}

export interface AppSettings {
  onboardingComplete: boolean
  homeView: 'by-urgency' | 'by-room'
  reminders: {
    enabled: boolean
    timeOfDay: string          // 'HH:mm', e.g. '07:30'
    quietHours: { start: string; end: string }
    snoozeHours: number
  }
  watering: {
    defaultUnit: 'ml' | 'oz'
    drainageReminder: boolean
    seasonalDosing: boolean
  }
  rooms: {
    groupHomeByRoom: boolean
    lightAwareCare: boolean
  }
  season: {
    hemisphere: Hemisphere
    region: string             // 'Melbourne, AU'
  }
  household: {
    petMode: boolean
    childMode: boolean
    pets: string               // free-text 'Cat, Dog'
  }
}

export interface PendingConfirm {
  plantId: string
  hoursAgo: number
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  homeView: 'by-urgency',
  reminders: {
    enabled: true,
    timeOfDay: '07:30',
    quietHours: { start: '21:00', end: '07:00' },
    snoozeHours: 3,
  },
  watering: {
    defaultUnit: 'ml',
    drainageReminder: true,
    seasonalDosing: true,
  },
  rooms: {
    groupHomeByRoom: false,
    lightAwareCare: true,
  },
  season: {
    hemisphere: 'Southern',
    region: 'Melbourne, AU',
  },
  household: {
    petMode: true,
    childMode: false,
    pets: '',
  },
}

const SEED_ROOM: Room = {
  id: 'living-room',
  name: 'Living Room',
  light: 'medium',
  notes: undefined,
}

// ─── Repository (iCloud-swap boundary) ───────────────────────────────────────

const PLANTS_KEY = 'plants_v1'
const ROOMS_KEY = 'rooms_v1'
const SETTINGS_KEY = 'settings_v1'
const LAST_EXPORT_KEY = 'lastExportAt'

export const Repository = {
  async loadPlants(): Promise<Plant[]> {
    const { value } = await Preferences.get({ key: PLANTS_KEY })
    if (!value) return []
    try {
      const raw = JSON.parse(value) as unknown[]
      return raw.map(migratePlant).filter(Boolean) as Plant[]
    } catch {
      return []
    }
  },
  async savePlants(plants: Plant[]): Promise<void> {
    await Preferences.set({ key: PLANTS_KEY, value: JSON.stringify(plants) })
  },

  async loadRooms(): Promise<Room[]> {
    const { value } = await Preferences.get({ key: ROOMS_KEY })
    if (!value) return [SEED_ROOM]
    try {
      const parsed = JSON.parse(value) as Room[]
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SEED_ROOM]
    } catch {
      return [SEED_ROOM]
    }
  },
  async saveRooms(rooms: Room[]): Promise<void> {
    await Preferences.set({ key: ROOMS_KEY, value: JSON.stringify(rooms) })
  },

  async loadSettings(): Promise<AppSettings> {
    const { value } = await Preferences.get({ key: SETTINGS_KEY })
    if (!value) return DEFAULT_SETTINGS
    try {
      // Merge with defaults so new fields don't break older saves
      const parsed = JSON.parse(value) as Partial<AppSettings>
      return mergeSettings(DEFAULT_SETTINGS, parsed)
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  async saveSettings(settings: AppSettings): Promise<void> {
    await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
  },

  async getLastExportAt(): Promise<number | null> {
    const { value } = await Preferences.get({ key: LAST_EXPORT_KEY })
    return value ? parseInt(value, 10) : null
  },
  async setLastExportAt(ts: number): Promise<void> {
    await Preferences.set({ key: LAST_EXPORT_KEY, value: String(ts) })
  },
}

function migratePlant(raw: unknown): Plant | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown> & Partial<Plant> & { emoji?: string }
  if (typeof r.id !== 'string' || typeof r.name !== 'string') return null
  return {
    id: r.id,
    name: r.name,
    species: r.species,
    speciesId: r.speciesId,
    photo: (typeof r.photo === 'string' && r.photo) ? r.photo : '',
    baseIntervalDays: typeof r.baseIntervalDays === 'number' ? r.baseIntervalDays : 7,
    recommendedMl: typeof r.recommendedMl === 'number' ? r.recommendedMl : 240,
    winterMl: typeof r.winterMl === 'number' ? r.winterMl : 160,
    room: typeof r.room === 'string' ? r.room : undefined,
    mood: typeof r.mood === 'string' ? r.mood : undefined,
    history: Array.isArray(r.history) ? r.history as WaterLog[] : [],
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    nfcTagId: r.nfcTagId,
  }
}

function mergeSettings(defaults: AppSettings, partial: Partial<AppSettings>): AppSettings {
  return {
    onboardingComplete: partial.onboardingComplete ?? defaults.onboardingComplete,
    homeView: partial.homeView ?? defaults.homeView,
    reminders: { ...defaults.reminders, ...(partial.reminders ?? {}) },
    watering:  { ...defaults.watering,  ...(partial.watering  ?? {}) },
    rooms:     { ...defaults.rooms,     ...(partial.rooms     ?? {}) },
    season:    { ...defaults.season,    ...(partial.season    ?? {}) },
    household: { ...defaults.household, ...(partial.household ?? {}) },
  }
}

// ─── Seasonality (hemisphere-aware) ──────────────────────────────────────────

export function getSeason(date: Date = new Date(), hemisphere: Hemisphere = 'Southern'): string {
  const m = date.getMonth() + 1
  if (hemisphere === 'Southern') {
    if (m === 12 || m <= 2) return 'Summer'
    if (m <= 5) return 'Autumn'
    if (m <= 8) return 'Winter'
    return 'Spring'
  }
  // Northern
  if (m === 12 || m <= 2) return 'Winter'
  if (m <= 5) return 'Spring'
  if (m <= 8) return 'Summer'
  return 'Autumn'
}

export function getSeasonMultiplier(date: Date = new Date(), hemisphere: Hemisphere = 'Southern'): number {
  const season = getSeason(date, hemisphere)
  if (season === 'Summer') return 0.7
  if (season === 'Winter') return 2.0
  return 1.0
}

export function applyLightAdjustment(intervalDays: number, light: LightLevel): number {
  if (light === 'low')    return intervalDays * 1.20
  if (light === 'bright') return intervalDays * 0.90
  return intervalDays
}

// ─── Derived calculations ────────────────────────────────────────────────────

export function getLastWatered(plant: Plant): number | null {
  const entries = plant.history
    .filter(e => e.type === 'water')
    .sort((a, b) => b.timestamp - a.timestamp)
  return entries[0]?.timestamp ?? null
}

interface DueOptions {
  now?: number
  hemisphere?: Hemisphere
  roomLight?: LightLevel
  lightAware?: boolean
}

export function getEffectiveInterval(plant: Plant, opts: DueOptions = {}): number {
  const { hemisphere = 'Southern', roomLight, lightAware = true } = opts
  let interval = plant.baseIntervalDays * getSeasonMultiplier(new Date(opts.now ?? Date.now()), hemisphere)
  if (lightAware && roomLight) interval = applyLightAdjustment(interval, roomLight)
  return interval
}

export function getNextWateredDue(plant: Plant, opts: DueOptions = {}): number {
  const now = opts.now ?? Date.now()
  const lastWatered = getLastWatered(plant)
  if (lastWatered === null) return now
  return lastWatered + getEffectiveInterval(plant, { ...opts, now }) * 86_400_000
}

export function getHydrationScale(plant: Plant, opts: DueOptions = {}): number {
  const now = opts.now ?? Date.now()
  const lastWatered = getLastWatered(plant)
  if (lastWatered === null) return 0
  const nextDue = getNextWateredDue(plant, { ...opts, now })
  const total = nextDue - lastWatered
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, (nextDue - now) / total))
}

export function getMoistureLabel(hydration: number): string {
  if (hydration <= 0.08) return 'Bone dry'
  if (hydration <= 0.25) return 'Almost dry'
  if (hydration <= 0.45) return 'Drying out'
  if (hydration <= 0.65) return 'Just right'
  if (hydration <= 0.85) return 'Comfortably moist'
  return 'Freshly watered'
}

export function getDueState(plant: Plant, opts: DueOptions = {}): DueState {
  const now = opts.now ?? Date.now()
  const lastWatered = getLastWatered(plant)
  // Fresh = watered within the last 8 hours
  if (lastWatered !== null && now - lastWatered < 8 * 3_600_000) return 'fresh'
  const nextDue = getNextWateredDue(plant, { ...opts, now })
  const diffMs = nextDue - now
  if (diffMs < 0) return 'overdue'
  if (diffMs < 24 * 3_600_000) return 'soon'
  return 'ok'
}

export function getDueLabel(plant: Plant, opts: DueOptions = {}): string {
  const now = opts.now ?? Date.now()
  const lastWatered = getLastWatered(plant)
  if (lastWatered !== null && now - lastWatered < 8 * 3_600_000) {
    const sameDay = new Date(lastWatered).toDateString() === new Date(now).toDateString()
    if (sameDay) {
      const t = new Date(lastWatered).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
      return `Today, ${t}`
    }
    return 'Watered today'
  }
  const nextDue = getNextWateredDue(plant, { ...opts, now })
  const diffMs = nextDue - now
  const diffH = diffMs / 3_600_000
  const diffD = diffMs / 86_400_000
  if (diffMs < 0) {
    const overdueH = Math.abs(diffH)
    const overdueD = Math.abs(diffD)
    if (overdueD >= 1) {
      const d = Math.round(overdueD)
      return `${d} day${d !== 1 ? 's' : ''} overdue`
    }
    return `${Math.max(1, Math.round(overdueH))} hours overdue`
  }
  if (diffH < 1)  return 'Due now'
  if (diffH < 24) {
    const h = Math.max(1, Math.round(diffH))
    return `Due in ${h} hour${h !== 1 ? 's' : ''}`
  }
  if (diffD < 2)  return 'Due tomorrow'
  return `Due in ${Math.round(diffD)} days`
}

export function getLastWateredLabel(plant: Plant, now: number = Date.now()): string {
  const last = getLastWatered(plant)
  if (last === null) return 'Never'
  const diffMs = now - last
  const diffH = diffMs / 3_600_000
  const diffD = diffMs / 86_400_000
  if (diffH < 1)  return 'just now'
  if (diffH < 24) {
    const h = Math.max(1, Math.round(diffH))
    return `${h} hour${h !== 1 ? 's' : ''} ago`
  }
  if (diffD < 14) {
    const d = Math.round(diffD)
    return `${d} day${d !== 1 ? 's' : ''} ago`
  }
  return new Date(last).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export function getTotalWaterMl(plant: Plant): number {
  return plant.history
    .filter(e => e.type === 'water')
    .reduce((sum, e) => sum + (e.amountMl ?? plant.recommendedMl), 0)
}

export function getWaterCount(plant: Plant): number {
  return plant.history.filter(e => e.type === 'water').length
}

// ─── Badge & Notifications ───────────────────────────────────────────────────

async function updateBadge(plants: Plant[], opts: DueOptions): Promise<void> {
  try {
    const { isSupported } = await Badge.isSupported()
    if (!isSupported) return
    const now = Date.now()
    const count = plants.filter(p => {
      const due = getNextWateredDue(p, { ...opts, now })
      return due < now + 12 * 3_600_000
    }).length
    if (count === 0) await Badge.clear()
    else await Badge.set({ count })
  } catch {
    /* non-fatal */
  }
}

async function scheduleNotifications(plants: Plant[], opts: DueOptions): Promise<void> {
  try {
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') {
      const { display: granted } = await LocalNotifications.requestPermissions()
      if (granted !== 'granted') return
    }
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }
    const now = Date.now()
    const notifications = plants
      .map((p, i) => ({ plant: p, due: getNextWateredDue(p, { ...opts, now }), index: i }))
      .filter(({ due }) => due > now)
      .map(({ plant, due, index }) => ({
        id: index + 1,
        title: `${plant.name} needs water`,
        body: 'Tap to open OutFlourish and log a watering.',
        schedule: { at: new Date(due) },
        extra: { plantId: plant.id },
      }))
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch {
    /* non-fatal */
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface AppStore {
  plants: Plant[]
  rooms: Room[]
  settings: AppSettings
  isLoaded: boolean
  pendingConfirm: PendingConfirm | null
  pendingNfcWrite: boolean

  // bootstrap
  load: () => Promise<void>

  // plants
  addPlant: (data: Omit<Plant, 'id' | 'history' | 'createdAt'>) => Promise<Plant>
  updatePlant: (id: string, data: Partial<Omit<Plant, 'id' | 'history' | 'createdAt'>>) => Promise<void>
  deletePlant: (id: string) => Promise<void>
  logWater: (plantId: string, type?: WaterLog['type'], opts?: { amountMl?: number; note?: string }) => Promise<void>

  // rooms
  addRoom: (data: Omit<Room, 'id'>) => Promise<Room>
  updateRoom: (id: string, data: Partial<Omit<Room, 'id'>>) => Promise<void>
  deleteRoom: (id: string) => Promise<void>
  mergeRoom: (fromId: string, intoId: string) => Promise<void>

  // settings
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  completeOnboarding: (opts?: { hemisphere?: Hemisphere; region?: string }) => Promise<void>

  // NFC + confirmations
  processNFCScan: (plantId: string) => Promise<void>
  confirmPendingWater: () => Promise<void>
  cancelPendingWater: () => void
  setPendingNfcWrite: (value: boolean) => void

  // backup
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>

  // derived helper: room light lookup for a plant
  roomLightFor: (plant: Plant) => LightLevel | undefined
}

function roomIdFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `room-${Date.now()}`
}

async function updateAll(state: { plants: Plant[]; settings: AppSettings; rooms: Room[] }): Promise<void> {
  const opts: DueOptions = {
    hemisphere: state.settings.season.hemisphere,
    lightAware: state.settings.rooms.lightAwareCare,
  }
  await Promise.allSettled([updateBadge(state.plants, opts), scheduleNotifications(state.plants, opts)])
}

export const useStore = create<AppStore>()((set, get) => ({
  plants: [],
  rooms: [],
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  pendingConfirm: null,
  pendingNfcWrite: false,

  load: async () => {
    try { await Badge.requestPermissions() } catch { /* web/simulator */ }
    const [plants, rooms, settings] = await Promise.all([
      Repository.loadPlants(),
      Repository.loadRooms(),
      Repository.loadSettings(),
    ])
    set({ plants, rooms, settings, isLoaded: true })
    await updateAll({ plants, rooms, settings })
  },

  // ─── plants ─────────────────────────────────────────────────────────────
  addPlant: async (data) => {
    const plant: Plant = {
      ...data,
      id: `plant_${Date.now()}`,
      history: [],
      createdAt: Date.now(),
    }
    const plants = [...get().plants, plant]
    set({ plants })
    await Repository.savePlants(plants)
    await updateAll({ ...get(), plants })
    return plant
  },

  updatePlant: async (id, data) => {
    const plants = get().plants.map(p => p.id === id ? { ...p, ...data } : p)
    set({ plants })
    await Repository.savePlants(plants)
    await updateAll({ ...get(), plants })
  },

  deletePlant: async (id) => {
    const plants = get().plants.filter(p => p.id !== id)
    set({ plants })
    await Repository.savePlants(plants)
    await updateAll({ ...get(), plants })
  },

  logWater: async (plantId, type = 'water', opts = {}) => {
    const target = get().plants.find(p => p.id === plantId)
    if (!target) return
    const entry: WaterLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type,
      amountMl: type === 'water' ? (opts.amountMl ?? target.recommendedMl) : undefined,
      note: opts.note,
    }
    const plants = get().plants.map(p =>
      p.id === plantId ? { ...p, history: [entry, ...p.history] } : p,
    )
    set({ plants })
    await Repository.savePlants(plants)
    await updateAll({ ...get(), plants })
    if (type === 'water') {
      try { await Haptics.impact({ style: ImpactStyle.Medium }) } catch { /* web */ }
    }
  },

  // ─── rooms ──────────────────────────────────────────────────────────────
  addRoom: async (data) => {
    let id = roomIdFromName(data.name)
    const existing = new Set(get().rooms.map(r => r.id))
    let dedupe = 2
    while (existing.has(id)) id = `${roomIdFromName(data.name)}-${dedupe++}`
    const room: Room = { ...data, id }
    const rooms = [...get().rooms, room]
    set({ rooms })
    await Repository.saveRooms(rooms)
    return room
  },

  updateRoom: async (id, data) => {
    const before = get().rooms.find(r => r.id === id)
    const rooms = get().rooms.map(r => r.id === id ? { ...r, ...data } : r)
    set({ rooms })
    await Repository.saveRooms(rooms)
    // If room name changed, propagate to plants in that room
    if (before && data.name && data.name !== before.name) {
      const plants = get().plants.map(p => p.room === before.name ? { ...p, room: data.name } : p)
      set({ plants })
      await Repository.savePlants(plants)
    }
  },

  deleteRoom: async (id) => {
    const room = get().rooms.find(r => r.id === id)
    if (!room) return
    // Detach plants from this room (free-text → undefined)
    const plants = get().plants.map(p => p.room === room.name ? { ...p, room: undefined } : p)
    const rooms = get().rooms.filter(r => r.id !== id)
    set({ rooms, plants })
    await Promise.all([Repository.saveRooms(rooms), Repository.savePlants(plants)])
  },

  mergeRoom: async (fromId, intoId) => {
    const from = get().rooms.find(r => r.id === fromId)
    const into = get().rooms.find(r => r.id === intoId)
    if (!from || !into) return
    const plants = get().plants.map(p => p.room === from.name ? { ...p, room: into.name } : p)
    const rooms = get().rooms.filter(r => r.id !== fromId)
    set({ rooms, plants })
    await Promise.all([Repository.saveRooms(rooms), Repository.savePlants(plants)])
  },

  // ─── settings ───────────────────────────────────────────────────────────
  updateSettings: async (patch) => {
    const settings = mergeSettings(get().settings, patch)
    set({ settings })
    await Repository.saveSettings(settings)
    await updateAll({ ...get(), settings })
  },

  completeOnboarding: async (opts = {}) => {
    const cur = get().settings
    const settings: AppSettings = {
      ...cur,
      onboardingComplete: true,
      season: {
        hemisphere: opts.hemisphere ?? cur.season.hemisphere,
        region: opts.region ?? cur.season.region,
      },
    }
    set({ settings })
    await Repository.saveSettings(settings)
  },

  // ─── NFC + confirmations ────────────────────────────────────────────────
  processNFCScan: async (plantId) => {
    const plant = get().plants.find(p => p.id === plantId)
    if (!plant) return
    const lastWatered = getLastWatered(plant)
    const now = Date.now()
    if (lastWatered !== null && now - lastWatered < 12 * 3_600_000) {
      const hoursAgo = Math.round(((now - lastWatered) / 3_600_000) * 10) / 10
      set({ pendingConfirm: { plantId, hoursAgo } })
    } else {
      await get().logWater(plantId)
    }
  },

  confirmPendingWater: async () => {
    const { pendingConfirm } = get()
    if (!pendingConfirm) return
    set({ pendingConfirm: null })
    await get().logWater(pendingConfirm.plantId)
  },

  cancelPendingWater: () => set({ pendingConfirm: null }),

  setPendingNfcWrite: (value) => set({ pendingNfcWrite: value }),

  // ─── backup ─────────────────────────────────────────────────────────────
  exportData: async () => {
    const { plants, rooms, settings } = get()
    const payload = JSON.stringify({
      version: 2,
      exportedAt: Date.now(),
      plants, rooms, settings,
    }, null, 2)
    await Repository.setLastExportAt(Date.now())
    return payload
  },

  importData: async (json) => {
    const parsed = JSON.parse(json) as {
      version: number
      plants?: unknown[]
      rooms?: Room[]
      settings?: Partial<AppSettings>
    }
    if (!Array.isArray(parsed.plants)) throw new Error('Invalid backup file')

    const incomingPlants = parsed.plants.map(migratePlant).filter(Boolean) as Plant[]
    const merged = [...get().plants]
    for (const incoming of incomingPlants) {
      const idx = merged.findIndex(p => p.id === incoming.id)
      if (idx >= 0) merged[idx] = incoming
      else merged.push(incoming)
    }
    set({ plants: merged })
    await Repository.savePlants(merged)

    if (Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      const roomsMerged = [...get().rooms]
      for (const incoming of parsed.rooms) {
        const idx = roomsMerged.findIndex(r => r.id === incoming.id)
        if (idx >= 0) roomsMerged[idx] = incoming
        else roomsMerged.push(incoming)
      }
      set({ rooms: roomsMerged })
      await Repository.saveRooms(roomsMerged)
    }

    if (parsed.settings) {
      const settings = mergeSettings(get().settings, parsed.settings)
      set({ settings })
      await Repository.saveSettings(settings)
    }

    await updateAll(get())
  },

  // ─── derived ────────────────────────────────────────────────────────────
  roomLightFor: (plant) => {
    if (!plant.room) return undefined
    return get().rooms.find(r => r.name === plant.room)?.light
  },
}))

// Legacy export alias for old call-sites — will be replaced screen-by-screen
export const usePlantStore = useStore
export const PlantRepository = Repository
