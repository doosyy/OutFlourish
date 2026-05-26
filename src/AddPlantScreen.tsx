// AddPlantScreen — two screens, one route.
//
//   1. Search state (when no species selected): editorial header + search field
//      with live caret + match count + species result rows + "Add it by hand"
//
//   2. Form state (after selecting species): species preview card + FormFields
//      (nickname, room, interval stepper) + Save CTA with NFC pairing variant

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NFC } from '@exxili/capacitor-nfc'
import { useStore } from './store'
import type { SpeciesProfile, Difficulty } from './speciesDb'
import { useSpeciesDb } from './speciesLoader'
import { PCT } from './tokens'
import { TopBar, FormField } from './components/UI'
import PhotoPicker from './components/PhotoPicker'
import { SearchGlyph, NFCGlyph } from './components/Glyphs'

export default function AddPlantScreen() {
  const navigate = useNavigate()
  const { addPlant, updatePlant, pendingNfcWrite, setPendingNfcWrite, rooms, setErrorSheet } = useStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SpeciesProfile | null>(null)
  const [name, setName] = useState('')
  const [room, setRoom] = useState(rooms[0]?.name ?? '')
  const [interval, setInterval] = useState(7)
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState('')   // empty = use selected.photo on save
  const [photoPath, setPhotoPath] = useState<string | undefined>(undefined)
  const draftPlantId = useMemo(() => `plant_${Date.now()}`, [])

  const handlePhotoChange = (newPhoto: string, newPath?: string) => {
    setPhoto(newPhoto)
    setPhotoPath(newPath)
  }

  const speciesDb = useSpeciesDb()
  const results = useMemo(() => speciesDb ? speciesDb.searchSpecies(query) : [], [query, speciesDb])

  const handleBack = () => {
    if (selected) {
      setSelected(null)
      return
    }
    setPendingNfcWrite(false)
    navigate(-1)
  }

  const handleSelect = (sp: SpeciesProfile) => {
    setSelected(sp)
    setName(sp.name)
    setInterval(sp.baseIntervalDays)
    setPhoto('')  // default to species photo
    setPhotoPath(undefined)
  }

  const handleSave = async () => {
    if (!selected || !name.trim() || saving) return
    setSaving(true)
    const newPlant = await addPlant({
      name: name.trim(),
      species: selected.name,
      speciesId: selected.id,
      photo: photo || selected.photo,
      photoPath: photo ? photoPath : undefined,
      baseIntervalDays: interval,
      recommendedMl: selected.recommendedMl,
      winterMl: selected.winterMl,
      room: room.trim() || undefined,
      mood: selected.defaultMood,
    })
    // Pair the blank NFC tag with the new plant.
    if (pendingNfcWrite) {
      try {
        // NDEF Well Known Text record: status byte 0x02 (UTF-8, 2-char lang code) + 'en' + payload
        const langCode = 'en'
        const text = newPlant.id  // e.g. 'plant_1716629192988'
        const status = langCode.length & 0x3f
        const encoder = new TextEncoder()
        const langBytes = encoder.encode(langCode)
        const textBytes = encoder.encode(text)
        const payload = [status, ...langBytes, ...textBytes]
        await NFC.writeNDEF({
          records: [{ type: 'T', payload }],
          rawMode: true,
        })
        await updatePlant(newPlant.id, { nfcTagId: newPlant.id, nfcPairedAt: Date.now() })
        setPendingNfcWrite(false)
      } catch (err) {
        console.warn('[NFC] write failed:', err)
        setErrorSheet('tag-write-failed')
        setSaving(false)
        return
      }
    }
    navigate('/')
  }

  if (selected) {
    return (
      <AddPlantForm
        selected={selected}
        name={name}
        room={room}
        interval={interval}
        photo={photo || selected.photo}
        plantId={draftPlantId}
        existingRooms={rooms.map(r => r.name)}
        saving={saving}
        pendingNfcWrite={pendingNfcWrite}
        onNameChange={setName}
        onRoomChange={setRoom}
        onIntervalChange={setInterval}
        onPhotoChange={handlePhotoChange}
        onChangeSpecies={() => setSelected(null)}
        onBack={handleBack}
        onSave={handleSave}
      />
    )
  }

  return (
    <div className="min-h-screen" style={{ background: PCT.cream, paddingBottom: 90 }}>
      <TopBar title="Add a plant" onBack={handleBack} />

      {/* NFC banner if a blank tag was scanned */}
      {pendingNfcWrite && (
        <div className="mx-5.5 mb-4 flex items-center gap-3.5" style={{
          padding: '16px 18px',
          background: PCT.terracotta,
          color: PCT.cream,
          borderRadius: 22,
          boxShadow: '0 12px 28px rgba(165,78,38,0.28)',
        }}>
          <div className="flex items-center justify-center flex-shrink-0" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
          }}>
            <NFCGlyph color={PCT.cream} size={20} />
          </div>
          <div className="flex-1">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              opacity: 0.75, marginBottom: 3,
            }}>A blank tag was detected</div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 16, lineHeight: 1.25,
            }}>Save below to pair this tag with the new plant.</div>
          </div>
        </div>
      )}

      {/* Editorial header */}
      <div className="px-5.5 pt-1.5 pb-4.5">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta, marginBottom: 6,
        }}>The library · {!speciesDb ? 'loading…' : results.length === 0 ? 'no matches' : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`}</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 38, lineHeight: 1.0, fontWeight: 400, letterSpacing: '-0.025em',
        }}>What's joining<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>the household?</span>
        </h1>
      </div>

      {/* Search field */}
      <div className="px-5.5 pb-4.5">
        <label className="flex items-center gap-2.5" style={{
          padding: '14px 18px',
          background: PCT.paper,
          border: `1px solid ${PCT.ink}14`,
          borderRadius: 18,
        }}>
          <SearchGlyph color={PCT.inkSoft} size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or alias…"
            autoFocus
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 16, color: PCT.ink,
            }}
          />
          <span style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: 1.4, color: PCT.inkFaint,
            textTransform: 'uppercase',
          }}>{results.length} match{results.length !== 1 ? 'es' : ''}</span>
        </label>
      </div>

      {/* Results */}
      <div className="px-5.5">
        {!speciesDb ? (
          <div className="text-center py-6" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 15, color: PCT.inkFaint,
          }}>
            Loading the library…
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-6" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16, color: PCT.inkSoft,
          }}>
            No species found for “{query}”. Add by hand below.
          </div>
        ) : (
          results.map(sp => <SpeciesRow key={sp.id} species={sp} onSelect={() => handleSelect(sp)} />)
        )}
      </div>

      {/* Add by hand */}
      <div className="text-center pt-6 px-5.5">
        <div className="mb-2" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 16, color: PCT.inkSoft,
        }}>
          Don't see your plant?
        </div>
        <button
          onClick={() => handleSelect({
            id: 'custom',
            name: query || 'My plant',
            scientificName: '',
            aliases: [],
            photo: '',
            baseIntervalDays: 7,
            recommendedMl: 200,
            winterMl: 140,
            difficulty: 'Beginner',
            humidity: 'Medium',
            light: 'medium',
            toxic: false,
            careGuide: { light: '', water: '', food: '', season: '', trouble: '' },
          } as SpeciesProfile)}
          style={{
            padding: '12px 22px',
            background: 'transparent',
            border: `1px solid ${PCT.terracotta}`,
            color: PCT.terracottaDeep,
            borderRadius: 999,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 15,
          }}
        >
          Add it by hand →
        </button>
      </div>
    </div>
  )
}

// ─── SpeciesRow ──────────────────────────────────────────────────────────────
function SpeciesRow({ species, onSelect }: { species: SpeciesProfile; onSelect: () => void }) {
  const diffColor: Record<Difficulty, string> = {
    Beginner: PCT.olive,
    Intermediate: PCT.soon,
    Advanced: PCT.thirsty,
  }
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3.5 w-full text-left"
      style={{
        padding: '14px 4px',
        borderBottom: `1px solid ${PCT.ink}14`,
      }}
    >
      <div className="relative flex-shrink-0" style={{
        width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
        boxShadow: `inset 0 0 0 1px ${PCT.ink}22`,
      }}>
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
        }} />
        {species.photo && (
          <img
            src={species.photo}
            alt={species.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 21, lineHeight: 1.0, color: PCT.ink,
        }}>{species.name}</div>
        <div className="mt-0.5 truncate" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 13, color: PCT.inkSoft,
        }}>{species.scientificName}</div>
        <div className="mt-1.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: PCT.inkFaint,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: diffColor[species.difficulty] }}>{species.difficulty}</span>
          {' · '}
          {species.humidity} humidity
          {species.toxic && <>{' · '}<span style={{ color: PCT.thirsty }}>toxic</span></>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
          color: PCT.inkFaint,
        }}>water every</div>
        <div className="mt-0.5" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22, lineHeight: 1.0, color: PCT.terracotta,
        }}>{species.baseIntervalDays}d</div>
      </div>
    </button>
  )
}

// ─── AddPlantForm ────────────────────────────────────────────────────────────
interface FormProps {
  selected: SpeciesProfile
  name: string
  room: string
  interval: number
  photo: string
  plantId: string
  existingRooms: string[]
  saving: boolean
  pendingNfcWrite: boolean
  onNameChange: (v: string) => void
  onRoomChange: (v: string) => void
  onIntervalChange: (v: number) => void
  onPhotoChange: (v: string, path?: string) => void
  onChangeSpecies: () => void
  onBack: () => void
  onSave: () => void
}

function AddPlantForm({
  selected, name, room, interval, photo, plantId, existingRooms, saving, pendingNfcWrite,
  onNameChange, onRoomChange, onIntervalChange, onPhotoChange, onChangeSpecies, onBack, onSave,
}: FormProps) {
  return (
    <div className="min-h-screen" style={{ background: PCT.cream, paddingBottom: 90 }}>
      <TopBar title="A new arrival" onBack={onBack} />

      {pendingNfcWrite && (
        <div className="mx-5.5 mb-4 flex items-center gap-3.5" style={{
          padding: '16px 18px',
          background: PCT.terracotta, color: PCT.cream,
          borderRadius: 22,
          boxShadow: '0 12px 28px rgba(165,78,38,0.28)',
        }}>
          <div className="flex items-center justify-center flex-shrink-0" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
          }}>
            <NFCGlyph color={PCT.cream} size={20} />
          </div>
          <div className="flex-1">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              opacity: 0.75, marginBottom: 3,
            }}>Blank tag held nearby</div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 16, lineHeight: 1.25,
            }}>Save below to pair this tag with {name || 'this plant'}.</div>
          </div>
        </div>
      )}

      {/* Species preview card */}
      <div className="px-5.5 pb-4.5">
        <div className="flex items-center gap-3.5" style={{
          padding: 16,
          background: PCT.paper,
          border: `1px solid ${PCT.ink}14`,
          borderRadius: 22,
        }}>
          <PhotoPicker
            currentPhoto={photo}
            speciesPhoto={selected.photo}
            plantId={plantId}
            onChange={onPhotoChange}
          />
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
              color: PCT.terracotta, marginBottom: 2,
            }}>Species</div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 22, lineHeight: 1.0, color: PCT.ink,
            }}>{selected.name}</div>
            <button
              onClick={onChangeSpecies}
              className="mt-0.5"
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: 'italic', fontSize: 13, color: PCT.inkSoft,
                textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >
              change species
            </button>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="px-5.5">
        <FormField label="Nickname" subhint="Plants live longer when named."
          value={name} onChange={onNameChange} placeholder="Give it a nickname" focused />
        <FormField label="Room" subhint="Helps you keep track."
          value={room} onChange={onRoomChange} placeholder="Living room, kitchen…"
          suggestions={existingRooms} />

        {/* Interval stepper */}
        <div className="mb-4.5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
              color: PCT.terracotta,
            }}>Watering interval</span>
            <span style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 12, color: PCT.inkFaint,
            }}>Adjusted by season.</span>
          </div>
          <div className="flex items-center gap-3" style={{
            padding: '14px 18px',
            background: PCT.paper,
            border: `1px solid ${PCT.ink}14`,
            borderRadius: 16,
          }}>
            <span style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 15, color: PCT.inkSoft,
            }}>Drink every</span>
            <div className="flex items-center gap-1.5" style={{
              padding: '4px 14px',
              background: PCT.cream,
              border: `1px solid ${PCT.ink}18`,
              borderRadius: 12,
            }}>
              <button
                onClick={() => onIntervalChange(Math.max(1, interval - 1))}
                style={{ width: 26, height: 26, fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 18, color: PCT.terracottaDeep }}
              >−</button>
              <span style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: 24, color: PCT.terracotta, minWidth: 28, textAlign: 'center',
              }}>{interval}</span>
              <button
                onClick={() => onIntervalChange(Math.min(90, interval + 1))}
                style={{ width: 26, height: 26, fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 18, color: PCT.terracottaDeep }}
              >+</button>
            </div>
            <span style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 15, color: PCT.inkSoft,
            }}>days</span>
          </div>
        </div>
      </div>

      {/* Save CTA */}
      <div className="px-5.5 pt-6">
        <button
          onClick={onSave}
          disabled={!name.trim() || saving}
          className="w-full flex items-center justify-center gap-2.5 disabled:opacity-50"
          style={{
            padding: 18,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 22,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 20,
            boxShadow: '0 12px 28px rgba(165,78,38,0.32)',
          }}
        >
          {pendingNfcWrite && <NFCGlyph color={PCT.cream} size={16} />}
          {saving ? 'Saving…'
            : pendingNfcWrite ? 'Save & pair the tag'
            : `Welcome ${name || 'them'} home`}
        </button>
        <div className="text-center mt-2.5" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 13, color: PCT.inkFaint,
        }}>
          {selected.id === 'custom'
            ? 'Care guide stays empty for custom plants.'
            : 'Care guide auto-attaches from the library.'}
        </div>
      </div>
    </div>
  )
}
