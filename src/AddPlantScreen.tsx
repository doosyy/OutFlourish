import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlantStore } from './store'
import { searchSpecies, type SpeciesProfile } from './speciesDb'

// NFC write — optional
let Nfc: { write: Function } | null = null
let NfcUtils: new () => { createNdefTextRecord: Function } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@capawesome-team/capacitor-nfc')
  Nfc = mod.Nfc
  NfcUtils = mod.NfcUtils
} catch { /* not installed */ }

interface FormState {
  name: string
  species: string
  speciesId: string
  emoji: string
  baseIntervalDays: number
  room: string
}

export default function AddPlantScreen() {
  const navigate = useNavigate()
  const { addPlant, pendingNfcWrite, setPendingNfcWrite, plants } = usePlantStore()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpeciesProfile[]>([])
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesProfile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [form, setForm] = useState<FormState>({
    name: '',
    species: '',
    speciesId: '',
    emoji: '🌱',
    baseIntervalDays: 7,
    room: '',
  })

  const existingRooms = [...new Set(plants.map(p => p.room).filter((r): r is string => !!r))]
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearch = (val: string) => {
    setQuery(val)
    setSearchResults(val.trim() ? searchSpecies(val) : [])
  }

  const selectSpecies = (sp: SpeciesProfile) => {
    setSelectedSpecies(sp)
    setForm({
      name: sp.name,
      species: sp.name,
      speciesId: sp.id,
      emoji: sp.emoji,
      baseIntervalDays: sp.baseIntervalDays,
      room: form.room,
    })
    setShowForm(true)
    setQuery('')
    setSearchResults([])
  }

  const handleManualAdd = () => {
    setSelectedSpecies(null)
    setShowForm(true)
    setQuery('')
    setSearchResults([])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const newPlant = await addPlant({
      name: form.name.trim(),
      species: form.species.trim() || undefined,
      speciesId: form.speciesId || undefined,
      emoji: form.emoji || '🌱',
      baseIntervalDays: form.baseIntervalDays,
      room: form.room.trim() || undefined,
    })

    // Write NFC tag if pending
    if (pendingNfcWrite && Nfc && NfcUtils) {
      try {
        const utils = new NfcUtils!()
        const { record } = utils.createNdefTextRecord({ text: newPlant.id, language: 'en' })
        await Nfc!.write({ message: { records: [record] } })
        setNfcWriteStatus('success')
      } catch {
        setNfcWriteStatus('failed')
      }
      setPendingNfcWrite(false)
    }

    setSaving(false)
    navigate(`/plant/${newPlant.id}`, { replace: true })
  }

  return (
    <div
      className="min-h-screen bg-stone-950 px-4 pb-8"
      style={{ paddingTop: 'max(16px, var(--sat))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { setPendingNfcWrite(false); navigate(-1) }}
          className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 text-xl active:scale-90 transition-transform"
          aria-label="Back"
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-stone-50">Add Plant</h1>
      </div>

      {/* NFC banner */}
      {pendingNfcWrite && (
        <div className="mb-5 px-4 py-3 bg-green-950 border border-green-700 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">📲</span>
          <div>
            <p className="text-green-300 font-semibold text-sm">New NFC Tag Detected</p>
            <p className="text-green-500 text-xs">Save this plant to pair it with the tag.</p>
          </div>
        </div>
      )}

      {/* NFC write result */}
      {nfcWriteStatus === 'success' && (
        <div className="mb-4 px-4 py-3 bg-green-950 border border-green-700 rounded-2xl text-green-300 text-sm">
          ✅ NFC tag paired successfully!
        </div>
      )}
      {nfcWriteStatus === 'failed' && (
        <div className="mb-4 px-4 py-3 bg-red-950 border border-red-700 rounded-2xl text-red-300 text-sm">
          ⚠️ Tag write failed — hold the phone to the tag and try again.
        </div>
      )}

      {!showForm ? (
        <>
          {/* Search bar */}
          <div className="relative mb-3">
            <input
              ref={searchRef}
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search species (e.g. pothos, monstera)..."
              autoFocus
              className="w-full bg-stone-800 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-500
                         focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSearchResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-lg"
              >
                ×
              </button>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 mb-4">
              {searchResults.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => selectSpecies(sp)}
                  className="w-full flex items-center gap-3 p-3 bg-stone-900 rounded-2xl border border-stone-800 active:scale-[0.98] transition-transform text-left"
                >
                  <span className="text-2xl flex-shrink-0">{sp.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-50">{sp.name}</span>
                      {sp.toxic && <span className="text-xs text-red-400">⚠️ toxic</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sp.difficulty === 'Beginner' ? 'bg-green-900/50 text-green-400' :
                        sp.difficulty === 'Intermediate' ? 'bg-amber-900/50 text-amber-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {sp.difficulty}
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs truncate">{sp.aliases.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-stone-400 text-xs">every</p>
                    <p className="text-stone-300 font-semibold text-sm">{sp.baseIntervalDays}d</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim() && searchResults.length === 0 && (
            <div className="text-center py-6">
              <p className="text-stone-500 text-sm">No species found for "{query}"</p>
            </div>
          )}

          {/* Manual add link */}
          <div className="text-center mt-4">
            <button
              onClick={handleManualAdd}
              className="text-green-400 text-sm font-medium underline underline-offset-2"
            >
              Can't find your plant? Add it manually →
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Selected species preview */}
          {selectedSpecies && (
            <div className="mb-5 p-4 bg-stone-900 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedSpecies.emoji}</span>
                <div>
                  <p className="font-bold text-stone-50">{selectedSpecies.name}</p>
                  <p className="text-stone-500 text-xs">{selectedSpecies.light}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedSpecies.difficulty === 'Beginner' ? 'bg-green-900/50 text-green-400' :
                  selectedSpecies.difficulty === 'Intermediate' ? 'bg-amber-900/50 text-amber-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {selectedSpecies.difficulty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                  💧 {selectedSpecies.humidity} humidity
                </span>
                {selectedSpecies.toxic && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400">
                    ⚠️ Toxic to {selectedSpecies.toxicTo}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setShowForm(false); setSelectedSpecies(null) }}
                className="mt-2 text-stone-500 text-xs underline"
              >
                Change species
              </button>
            </div>
          )}

          {/* Plant form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-2">
              <input
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-14 bg-stone-800 rounded-xl px-2 py-3 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={2}
              />
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Plant nickname *"
                required
                autoFocus={!selectedSpecies}
                className="flex-1 bg-stone-800 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-500
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {!selectedSpecies && (
              <input
                value={form.species}
                onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                placeholder="Species (optional)"
                className="w-full bg-stone-800 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-500
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}

            {/* Room */}
            <div>
              <input
                value={form.room}
                onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                list="rooms-list"
                placeholder="Room / location (optional)"
                className="w-full bg-stone-800 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-500
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {existingRooms.length > 0 && (
                <datalist id="rooms-list">
                  {existingRooms.map(r => <option key={r} value={r} />)}
                </datalist>
              )}
            </div>

            {/* Watering interval */}
            <div className="flex items-center gap-3 bg-stone-800 rounded-xl px-4 py-3">
              <span className="text-stone-400 text-sm flex-shrink-0">Water every</span>
              <input
                type="number"
                min={1}
                max={90}
                value={form.baseIntervalDays}
                onChange={e => setForm(f => ({ ...f, baseIntervalDays: Number(e.target.value) }))}
                className="w-16 bg-stone-700 rounded-lg px-2 py-1 text-stone-50 text-center
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-stone-400 text-sm">days</span>
              <span className="text-stone-600 text-xs flex-1 text-right">Adjusted by season</span>
            </div>

            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="w-full py-4 bg-green-500 rounded-2xl text-white font-bold text-base
                         active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              {saving ? 'Saving...' : pendingNfcWrite ? '💾 Save & Pair NFC Tag' : '💾 Save Plant'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
