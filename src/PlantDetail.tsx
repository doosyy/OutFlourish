import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  usePlantStore,
  getLastWatered,
  getNextWateredDue,
  getHydrationScale,
  formatRelativeTime,
  formatDue,
  type WaterLog,
} from './store'
import { getSpeciesById } from './speciesDb'
import PlantIllustration from './PlantIllustration'

const LOG_ICON: Record<WaterLog['type'], string> = {
  water: '💧',
  fertilize: '🌿',
  repot: '🪴',
}

interface CareCardProps { icon: string; title: string; content: string }
function CareCard({ icon, title, content }: CareCardProps) {
  return (
    <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800">
      <p className="text-amber-400 font-semibold text-sm mb-1">{icon} {title}</p>
      <p className="text-stone-300 text-sm leading-relaxed">{content}</p>
    </div>
  )
}

interface EditFormProps {
  plantId: string
  initial: { name: string; species?: string; emoji?: string; baseIntervalDays: number; room?: string }
  existingRooms: string[]
  onClose: () => void
  onDelete: () => void
}

function EditPlantForm({ plantId, initial, existingRooms, onClose, onDelete }: EditFormProps) {
  const { updatePlant, deletePlant } = usePlantStore()
  const [name, setName] = useState(initial.name)
  const [species, setSpecies] = useState(initial.species ?? '')
  const [emoji, setEmoji] = useState(initial.emoji ?? '🌱')
  const [intervalDays, setIntervalDays] = useState(initial.baseIntervalDays)
  const [room, setRoom] = useState(initial.room ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updatePlant(plantId, {
      name: name.trim(),
      species: species.trim() || undefined,
      emoji,
      baseIntervalDays: intervalDays,
      room: room.trim() || undefined,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deletePlant(plantId)
    onDelete()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900 rounded-3xl p-5 border border-stone-800 mb-4">
      <h3 className="font-bold text-stone-50 text-lg mb-4">Edit Plant</h3>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="w-14 bg-stone-800 rounded-xl px-2 py-2 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={2}
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Plant name *"
            className="flex-1 bg-stone-800 rounded-xl px-3 py-2 text-stone-50 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <input
          value={species}
          onChange={e => setSpecies(e.target.value)}
          placeholder="Species"
          className="w-full bg-stone-800 rounded-xl px-3 py-2 text-stone-50 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          value={room}
          onChange={e => setRoom(e.target.value)}
          list="edit-rooms-list"
          placeholder="Room / location"
          className="w-full bg-stone-800 rounded-xl px-3 py-2 text-stone-50 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {existingRooms.length > 0 && (
          <datalist id="edit-rooms-list">
            {existingRooms.map(r => <option key={r} value={r} />)}
          </datalist>
        )}
        <div className="flex items-center gap-3">
          <span className="text-stone-400 text-sm">Water every</span>
          <input
            type="number" min={1} max={90}
            value={intervalDays}
            onChange={e => setIntervalDays(Number(e.target.value))}
            className="w-16 bg-stone-800 rounded-xl px-3 py-2 text-stone-50 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-stone-400 text-sm">days</span>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 bg-stone-800 rounded-xl text-stone-300 font-medium">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-2.5 bg-green-500 rounded-xl text-white font-semibold">
          Save
        </button>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className={`w-full mt-3 py-2.5 rounded-xl font-medium text-sm transition-colors
          ${confirmDelete ? 'bg-red-600 text-white' : 'bg-stone-800/50 text-red-400'}`}
      >
        {confirmDelete ? '⚠️ Confirm Delete' : 'Delete Plant'}
      </button>
    </form>
  )
}

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plants, logWater } = usePlantStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showCareGuide, setShowCareGuide] = useState(false)

  const plant = plants.find(p => p.id === id)

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-stone-500 gap-4">
        <p className="text-lg">Plant not found</p>
        <button onClick={() => navigate('/')} className="text-green-400 underline">
          Go home
        </button>
      </div>
    )
  }

  const now = Date.now()
  const lastWatered = getLastWatered(plant)
  const nextDue = getNextWateredDue(plant, now)
  const hydration = getHydrationScale(plant, now)
  const { label: dueLabel, urgency } = formatDue(nextDue, now)
  const speciesProfile = plant.speciesId ? getSpeciesById(plant.speciesId) : null
  const waterCount = plant.history.filter(e => e.type === 'water').length
  const existingRooms = [...new Set(plants.map(p => p.room).filter((r): r is string => !!r))]

  const dueColor = urgency === 'overdue'
    ? 'text-red-400'
    : urgency === 'soon'
    ? 'text-amber-400'
    : 'text-green-400'

  return (
    <div
      className="min-h-screen bg-stone-950 pb-8"
      style={{ paddingTop: 'max(16px, var(--sat))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 text-xl active:scale-90 transition-transform"
          aria-label="Back"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-stone-50 flex items-center gap-2">
            <span>{plant.emoji ?? '🌱'}</span>
            <span className="truncate">{plant.name}</span>
          </h1>
          {plant.species && (
            <p className="text-stone-500 text-sm truncate italic">{plant.species}</p>
          )}
          {plant.room && (
            <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
              📍 {plant.room}
            </span>
          )}
        </div>
      </div>

      {/* Toxicity warning */}
      {speciesProfile?.toxic && (
        <div className="mx-4 mb-4 mt-2 px-4 py-3 bg-red-950 border border-red-800 rounded-2xl flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-red-300 font-semibold text-sm">Toxic plant</p>
            <p className="text-red-400 text-xs">
              {speciesProfile.toxicTo === 'both' && 'Keep away from pets and children.'}
              {speciesProfile.toxicTo === 'pets' && 'Keep away from pets.'}
              {speciesProfile.toxicTo === 'children' && 'Keep away from young children.'}
            </p>
          </div>
        </div>
      )}

      {/* Illustration */}
      <div className="flex justify-center py-4">
        <PlantIllustration plant={plant} size={220} />
      </div>

      {/* Hydration bar */}
      <div className="px-6 mb-5">
        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full hydration-bar-fill rounded-full"
            style={{ width: `${Math.max(2, hydration * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-600 mt-1">
          <span>Wilted</span>
          <span>{Math.round(hydration * 100)}% hydrated</span>
          <span>Freshly watered</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-5">
        <div className="bg-stone-900 rounded-2xl p-3 text-center border border-stone-800">
          <p className="text-stone-500 text-xs mb-1">Last watered</p>
          <p className="text-stone-50 font-semibold text-sm">
            {lastWatered ? formatRelativeTime(lastWatered) : 'Never'}
          </p>
        </div>
        <div className="bg-stone-900 rounded-2xl p-3 text-center border border-stone-800">
          <p className="text-stone-500 text-xs mb-1">Next due</p>
          <p className={`font-semibold text-sm ${dueColor}`}>{dueLabel}</p>
        </div>
        <div className="bg-stone-900 rounded-2xl p-3 text-center border border-stone-800">
          <p className="text-stone-500 text-xs mb-1">Waterings</p>
          <p className="text-stone-50 font-semibold text-sm">{waterCount}</p>
        </div>
      </div>

      {/* Edit form */}
      {showEdit && (
        <div className="px-4">
          <EditPlantForm
            plantId={plant.id}
            initial={plant}
            existingRooms={existingRooms}
            onClose={() => setShowEdit(false)}
            onDelete={() => navigate('/', { replace: true })}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 space-y-3 mb-5">
        <button
          onClick={() => logWater(plant.id, 'water')}
          className="w-full py-4 bg-green-500 rounded-2xl text-white font-bold text-base
                     active:scale-[0.97] transition-transform shadow-lg shadow-green-900/40"
        >
          💧 Log Water
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => logWater(plant.id, 'fertilize')}
            className="py-3 bg-stone-800 rounded-2xl text-stone-300 font-semibold text-sm active:scale-95 transition-transform"
          >
            🌿 Fertilize
          </button>
          <button
            onClick={() => setShowEdit(v => !v)}
            className={`py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform
              ${showEdit ? 'bg-green-900/40 text-green-400' : 'bg-stone-800 text-stone-300'}`}
          >
            ✏️ {showEdit ? 'Close Edit' : 'Edit Plant'}
          </button>
        </div>
        <button
          onClick={() => logWater(plant.id, 'repot')}
          className="w-full py-3 bg-stone-800 rounded-2xl text-stone-400 font-medium text-sm active:scale-95 transition-transform"
        >
          🪴 Log Repot
        </button>
      </div>

      {/* Care Guide */}
      <div className="px-4 mb-5">
        {speciesProfile ? (
          <>
            <button
              onClick={() => setShowCareGuide(v => !v)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <span className="text-stone-200 font-semibold">📖 Care Guide</span>
              <span className="text-stone-500 text-sm">{showCareGuide ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showCareGuide && (
              <div className="space-y-3 mt-1">
                <CareCard icon="☀️" title="Light" content={speciesProfile.light} />
                <CareCard icon="💧" title="Watering" content={speciesProfile.watering} />
                <CareCard icon="🌿" title="Fertilising" content={speciesProfile.fertilising} />
                <CareCard icon="🍂" title="Seasonal (Melbourne)" content={speciesProfile.seasonal} />
                <CareCard icon="🔍" title="Common Problems" content={speciesProfile.commonProblems} />
              </div>
            )}
          </>
        ) : (
          <div className="py-3 border-t border-stone-800">
            <p className="text-stone-600 text-sm">
              No care guide — custom plant.{' '}
              <button
                onClick={() => navigate('/add')}
                className="text-green-500 underline"
              >
                Search species database →
              </button>
            </p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="px-4">
        <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">History</h2>
        {plant.history.length === 0 ? (
          <p className="text-stone-600 text-sm">No history yet.</p>
        ) : (
          <div className="space-y-1">
            {plant.history.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-stone-800/50">
                <span className="text-xl">{LOG_ICON[entry.type]}</span>
                <div className="flex-1">
                  <p className="text-stone-300 text-sm capitalize">{entry.type}</p>
                  {entry.note && <p className="text-stone-600 text-xs">{entry.note}</p>}
                </div>
                <span className="text-stone-600 text-xs">{formatRelativeTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
