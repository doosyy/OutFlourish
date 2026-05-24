import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  usePlantStore,
  getNextWateredDue,
  getHydrationScale,
  formatDue,
  type Plant,
} from './store'
import { getSpeciesById } from './speciesDb'

// NFC optional
let Nfc: { startScanSession: Function } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Nfc = require('@capawesome-team/capacitor-nfc').Nfc
} catch { /* not installed */ }

function PlantCard({ plant, now }: { plant: Plant; now: number }) {
  const navigate = useNavigate()
  const nextDue = getNextWateredDue(plant, now)
  const { label, urgency } = formatDue(nextDue, now)
  const hydration = getHydrationScale(plant, now)
  const speciesProfile = plant.speciesId ? getSpeciesById(plant.speciesId) : null
  const isToxic = speciesProfile?.toxic ?? false

  const urgencyBg = urgency === 'overdue'
    ? 'bg-red-900/60 text-red-300'
    : urgency === 'soon'
    ? 'bg-amber-900/60 text-amber-300'
    : 'bg-stone-800 text-stone-400'

  return (
    <button
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="w-full flex items-center gap-4 p-4 bg-stone-900 rounded-2xl border border-stone-800 active:scale-[0.98] transition-transform text-left"
    >
      {/* Emoji + toxic badge */}
      <div className="relative flex-shrink-0">
        <span className="text-3xl">{plant.emoji ?? '🌱'}</span>
        {isToxic && (
          <span className="absolute -bottom-1 -right-1 text-xs bg-red-900 text-red-300 rounded-full px-1 leading-4">
            ⚠️
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-50 truncate">{plant.name}</p>
          {plant.room && (
            <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full flex-shrink-0">
              {plant.room}
            </span>
          )}
        </div>
        {plant.species && (
          <p className="text-stone-500 text-sm truncate">{plant.species}</p>
        )}
        {/* Hydration bar */}
        <div className="mt-1.5 h-1.5 bg-stone-800 rounded-full overflow-hidden w-full">
          <div
            className="h-full hydration-bar-fill rounded-full"
            style={{ width: `${Math.max(2, hydration * 100)}%` }}
          />
        </div>
      </div>

      <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl whitespace-nowrap flex-shrink-0 ${urgencyBg}`}>
        {label}
      </span>
    </button>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { plants, isLoaded } = usePlantStore()
  const [now, setNow] = useState(Date.now())
  const [selectedRoom, setSelectedRoom] = useState('All')
  const [nfcScanning, setNfcScanning] = useState(false)

  // Refresh "now" every minute so urgency labels stay current
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Reset room filter if the selected room no longer exists
  useEffect(() => {
    const rooms = [...new Set(plants.map(p => p.room).filter(Boolean))]
    if (selectedRoom !== 'All' && !rooms.includes(selectedRoom)) {
      setSelectedRoom('All')
    }
  }, [plants, selectedRoom])

  const sortedPlants = [...plants].sort(
    (a, b) => getNextWateredDue(a, now) - getNextWateredDue(b, now),
  )

  const rooms = ['All', ...new Set(plants.map(p => p.room).filter((r): r is string => !!r))]

  const filteredPlants =
    selectedRoom === 'All'
      ? sortedPlants
      : sortedPlants.filter(p => p.room === selectedRoom)

  const urgentCount = plants.filter(
    p => getNextWateredDue(p, now) < now + 12 * 3_600_000,
  ).length

  const hasOverdue = plants.some(p => getNextWateredDue(p, now) < now)

  const dueChipStyle = urgentCount === 0
    ? 'bg-green-900/50 text-green-400'
    : hasOverdue
    ? 'bg-red-900/50 text-red-400'
    : 'bg-amber-900/50 text-amber-400'

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const handleScanNfc = async () => {
    if (!Nfc || nfcScanning) return
    setNfcScanning(true)
    try {
      await Nfc.startScanSession()
    } catch { /* unavailable */ }
    finally {
      setNfcScanning(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-stone-950 px-4 pb-32"
      style={{ paddingTop: 'max(24px, var(--sat))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-50">PlantCare</h1>
          <p className="text-stone-500 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 text-lg active:scale-90 transition-transform"
            aria-label="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => navigate('/add')}
            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform"
            aria-label="Add plant"
          >
            +
          </button>
        </div>
      </div>

      {/* Due counter */}
      {isLoaded && plants.length > 0 && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${dueChipStyle}`}>
          {urgentCount === 0
            ? '✅ All plants are happy'
            : `💧 ${urgentCount} plant${urgentCount > 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} water`}
        </div>
      )}

      {/* Room filter chips */}
      {rooms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {rooms.map(room => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
                ${selectedRoom === room
                  ? 'bg-green-500 text-white'
                  : 'bg-stone-800 text-stone-400'
                }`}
            >
              {room}
            </button>
          ))}
        </div>
      )}

      {/* Plant list */}
      <div className="space-y-3">
        {!isLoaded && (
          <div className="flex items-center justify-center py-16">
            <div className="text-stone-600 text-sm">Loading your plants...</div>
          </div>
        )}

        {isLoaded && plants.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-stone-400 font-semibold mb-1">No plants yet</p>
            <p className="text-stone-600 text-sm">Tap + to add your first plant</p>
          </div>
        )}

        {isLoaded && filteredPlants.length === 0 && plants.length > 0 && (
          <div className="text-center py-8">
            <p className="text-stone-500 text-sm">No plants in "{selectedRoom}"</p>
          </div>
        )}

        {filteredPlants.map(plant => (
          <PlantCard key={plant.id} plant={plant} now={now} />
        ))}
      </div>

      {/* NFC Scan button — fixed bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-4 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent"
        style={{ paddingBottom: 'max(20px, var(--sab))' }}
      >
        <button
          onClick={handleScanNfc}
          disabled={nfcScanning || !Nfc}
          className="w-full py-4 bg-green-500 rounded-2xl text-white font-bold text-base
                     active:scale-[0.97] transition-transform disabled:opacity-50
                     shadow-lg shadow-green-900/40"
        >
          {nfcScanning ? '📡 Scanning...' : '📲 Scan NFC Tag'}
        </button>
        {!Nfc && (
          <p className="text-center text-stone-600 text-xs mt-2">
            NFC plugin not available in this environment
          </p>
        )}
      </div>
    </div>
  )
}
