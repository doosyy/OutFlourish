import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Badge } from '@capawesome/capacitor-badge'
import { LocalNotifications } from '@capacitor/local-notifications'

// ─── Data Models ──────────────────────────────────────────────────────────────

export interface WaterLog {
  id: string
  timestamp: number
  type: 'water' | 'fertilize' | 'repot'
  note?: string
}

export interface Plant {
  id: string
  name: string
  species?: string
  speciesId?: string
  emoji?: string
  baseIntervalDays: number
  room?: string
  history: WaterLog[]
  createdAt: number
  nfcTagId?: string
}

export interface PendingConfirm {
  plantId: string
  hoursAgo: number
}

// ─── Repository ───────────────────────────────────────────────────────────────

const PLANTS_KEY = 'plants_v1'
const LAST_EXPORT_KEY = 'lastExportAt'

export const PlantRepository = {
  async loadAll(): Promise<Plant[]> {
    const { value } = await Preferences.get({ key: PLANTS_KEY })
    if (!value) return []
    try {
      return JSON.parse(value) as Plant[]
    } catch {
      return []
    }
  },
  async saveAll(plants: Plant[]): Promise<void> {
    await Preferences.set({ key: PLANTS_KEY, value: JSON.stringify(plants) })
  },
  async getLastExportAt(): Promise<number | null> {
    const { value } = await Preferences.get({ key: LAST_EXPORT_KEY })
    return value ? parseInt(value, 10) : null
  },
  async setLastExportAt(ts: number): Promise<void> {
    await Preferences.set({ key: LAST_EXPORT_KEY, value: String(ts) })
  },
}

// ─── Melbourne Seasonality ────────────────────────────────────────────────────
// Southern Hemisphere: Summer=Dec–Feb, Autumn=Mar–May, Winter=Jun–Aug, Spring=Sep–Nov

export function getSeason(date: Date = new Date()): string {
  const m = date.getMonth() + 1
  if (m === 12 || m <= 2) return 'Summer'
  if (m <= 5) return 'Autumn'
  if (m <= 8) return 'Winter'
  return 'Spring'
}

export function getSeasonMultiplier(date: Date = new Date()): number {
  const m = date.getMonth() + 1
  if (m === 12 || m <= 2) return 0.7  // Summer: water more often
  if (m >= 6 && m <= 8) return 2.0    // Winter: water less often
  return 1.0
}

// ─── Derived Calculations ─────────────────────────────────────────────────────

export function getLastWatered(plant: Plant): number | null {
  const entries = plant.history
    .filter(e => e.type === 'water')
    .sort((a, b) => b.timestamp - a.timestamp)
  return entries[0]?.timestamp ?? null
}

export function getNextWateredDue(plant: Plant, now: number = Date.now()): number {
  const lastWatered = getLastWatered(plant)
  if (lastWatered === null) return now
  const multiplier = getSeasonMultiplier(new Date(now))
  return lastWatered + plant.baseIntervalDays * multiplier * 86_400_000
}

export function getHydrationScale(plant: Plant, now: number = Date.now()): number {
  const lastWatered = getLastWatered(plant)
  if (lastWatered === null) return 0
  const nextDue = getNextWateredDue(plant, now)
  const total = nextDue - lastWatered
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, (nextDue - now) / total))
}

export function getGrowthLevel(plant: Plant): number {
  return Math.min(100, (plant.history.length / 30) * 100)
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffM = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)
  if (diffM < 2) return 'just now'
  if (diffM < 60) return `${diffM}m ago`
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return new Date(timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export function formatDue(nextDue: number, now: number): { label: string; urgency: 'overdue' | 'soon' | 'ok' } {
  const diffMs = nextDue - now
  const diffH = diffMs / 3_600_000
  const diffD = diffMs / 86_400_000

  if (diffMs < 0) {
    const overdueD = Math.abs(diffD)
    const overdueH = Math.abs(diffH)
    return {
      label: overdueD >= 1 ? `${Math.round(overdueD)}d overdue` : `${Math.round(overdueH)}h overdue`,
      urgency: 'overdue',
    }
  }
  if (diffMs < 12 * 3_600_000) {
    return { label: `Due in ${Math.round(diffH)}h`, urgency: 'soon' }
  }
  if (diffD < 1) {
    return { label: `Due in ${Math.round(diffH)}h`, urgency: 'ok' }
  }
  return { label: `Due in ${Math.round(diffD)}d`, urgency: 'ok' }
}

// ─── Badge & Notifications ────────────────────────────────────────────────────

async function updateBadge(plants: Plant[]): Promise<void> {
  try {
    const { isSupported } = await Badge.isSupported()
    if (!isSupported) return
    const now = Date.now()
    const count = plants.filter(p => getNextWateredDue(p, now) < now + 12 * 3_600_000).length
    if (count === 0) {
      await Badge.clear()
    } else {
      await Badge.set({ count })
    }
  } catch {
    // Non-fatal
  }
}

async function scheduleNotifications(plants: Plant[]): Promise<void> {
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
      .map((p, i) => ({ plant: p, due: getNextWateredDue(p, now), index: i }))
      .filter(({ due }) => due > now)
      .map(({ plant, due, index }) => ({
        id: index + 1,
        title: `${plant.emoji ?? '🌱'} ${plant.name} needs water`,
        body: 'Tap to open PlantCare and log a watering.',
        schedule: { at: new Date(due) },
        extra: { plantId: plant.id },
      }))
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch {
    // Non-fatal
  }
}

async function updateAll(plants: Plant[]): Promise<void> {
  await Promise.allSettled([updateBadge(plants), scheduleNotifications(plants)])
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface PlantStore {
  plants: Plant[]
  isLoaded: boolean
  pendingConfirm: PendingConfirm | null
  pendingNfcWrite: boolean

  loadPlants: () => Promise<void>
  addPlant: (data: Omit<Plant, 'id' | 'history' | 'createdAt'>) => Promise<Plant>
  updatePlant: (id: string, data: Partial<Omit<Plant, 'id' | 'history' | 'createdAt'>>) => Promise<void>
  deletePlant: (id: string) => Promise<void>
  logWater: (plantId: string, type?: WaterLog['type'], note?: string) => Promise<void>
  processNFCScan: (plantId: string) => Promise<void>
  confirmPendingWater: () => Promise<void>
  cancelPendingWater: () => void
  setPendingNfcWrite: (value: boolean) => void
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
}

export const usePlantStore = create<PlantStore>()((set, get) => ({
  plants: [],
  isLoaded: false,
  pendingConfirm: null,
  pendingNfcWrite: false,

  loadPlants: async () => {
    try {
      await Badge.requestPermissions()
    } catch { /* not available on web */ }
    const plants = await PlantRepository.loadAll()
    set({ plants, isLoaded: true })
    await updateAll(plants)
  },

  addPlant: async (data) => {
    const plant: Plant = {
      ...data,
      id: `plant_${Date.now()}`,
      history: [],
      createdAt: Date.now(),
    }
    const plants = [...get().plants, plant]
    set({ plants })
    await PlantRepository.saveAll(plants)
    await updateAll(plants)
    return plant
  },

  updatePlant: async (id, data) => {
    const plants = get().plants.map(p => (p.id === id ? { ...p, ...data } : p))
    set({ plants })
    await PlantRepository.saveAll(plants)
    await updateAll(plants)
  },

  deletePlant: async (id) => {
    const plants = get().plants.filter(p => p.id !== id)
    set({ plants })
    await PlantRepository.saveAll(plants)
    await updateAll(plants)
  },

  logWater: async (plantId, type = 'water', note) => {
    const entry: WaterLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type,
      note,
    }
    const plants = get().plants.map(p =>
      p.id === plantId ? { ...p, history: [entry, ...p.history] } : p,
    )
    set({ plants })
    await PlantRepository.saveAll(plants)
    await updateAll(plants)

    if (type === 'water') {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } catch { /* web/simulator */ }
    }
  },

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

  exportData: async () => {
    const { plants } = get()
    const payload = JSON.stringify({ version: 1, exportedAt: Date.now(), plants }, null, 2)
    await PlantRepository.setLastExportAt(Date.now())
    return payload
  },

  importData: async (json) => {
    const parsed = JSON.parse(json) as { version: number; plants: Plant[] }
    if (!parsed.plants || !Array.isArray(parsed.plants)) throw new Error('Invalid backup file')
    const existing = get().plants
    const merged = [...existing]
    for (const incoming of parsed.plants) {
      const idx = merged.findIndex(p => p.id === incoming.id)
      if (idx >= 0) {
        merged[idx] = incoming
      } else {
        merged.push(incoming)
      }
    }
    set({ plants: merged })
    await PlantRepository.saveAll(merged)
    await updateAll(merged)
  },
}))
