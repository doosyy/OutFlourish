// Phase 2 placeholder — Phase 3 rewrites as AddPlantSearch + AddPlantForm
// with photo previews, the editorial header, and the species detail card.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from './store'
import { searchSpecies, type SpeciesProfile } from './speciesDb'

export default function AddPlantScreen() {
  const navigate = useNavigate()
  const { addPlant, pendingNfcWrite, setPendingNfcWrite, rooms } = useStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SpeciesProfile | null>(null)
  const [name, setName] = useState('')
  const [room, setRoom] = useState(rooms[0]?.name ?? '')

  const results = searchSpecies(query)

  const handleSave = async () => {
    if (!selected || !name.trim()) return
    await addPlant({
      name: name.trim(),
      species: selected.name,
      speciesId: selected.id,
      photo: selected.photo,
      baseIntervalDays: selected.baseIntervalDays,
      recommendedMl: selected.recommendedMl,
      winterMl: selected.winterMl,
      room: room.trim() || undefined,
      mood: selected.defaultMood,
    })
    if (pendingNfcWrite) setPendingNfcWrite(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen px-6 pb-12" style={{ paddingTop: 'max(56px, var(--sat))' }}>
      <button onClick={() => navigate(-1)} className="font-display italic text-ink-soft mb-4">
        ← Back
      </button>
      <h1 className="font-display italic text-3xl text-ink tracking-tighter mb-6">
        Phase 2 stub · Add plant
      </h1>

      {!selected && (
        <>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search species…"
            className="w-full p-4 bg-paper border border-ink/10 rounded-card font-body text-ink mb-4"
          />
          <ul className="space-y-2">
            {results.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => { setSelected(s); setName(s.name) }}
                  className="w-full flex items-center gap-3 p-3 bg-paper border border-ink/10 rounded-card text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${s.photo})` }}
                  />
                  <div className="flex-1">
                    <div className="font-display text-lg text-ink">{s.name}</div>
                    <div className="font-display italic text-xs text-ink-soft">{s.scientificName}</div>
                  </div>
                  <div className="font-display text-base text-terracotta">{s.baseIntervalDays}d</div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-paper border border-ink/10 rounded-card">
            <div
              className="w-16 h-16 rounded-card-s bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${selected.photo})` }}
            />
            <div className="flex-1">
              <div className="font-display text-xl text-ink">{selected.name}</div>
              <div className="font-display italic text-xs text-ink-soft">{selected.scientificName}</div>
            </div>
            <button onClick={() => setSelected(null)} className="font-display italic text-sm text-ink-soft">
              change
            </button>
          </div>

          <div>
            <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta mb-2">Nickname</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-4 bg-paper border border-ink/10 rounded-card font-display text-xl text-ink"
            />
          </div>

          <div>
            <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta mb-2">Room</div>
            <input
              value={room}
              onChange={e => setRoom(e.target.value)}
              list="rooms-list"
              className="w-full p-4 bg-paper border border-ink/10 rounded-card font-display text-xl text-ink"
            />
            <datalist id="rooms-list">
              {rooms.map(r => <option key={r.id} value={r.name} />)}
            </datalist>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-4 mt-3 bg-terracotta text-cream rounded-card font-display italic text-lg shadow-cta disabled:opacity-50"
          >
            Welcome {name || 'plant'} home
          </button>
        </div>
      )}
    </div>
  )
}
