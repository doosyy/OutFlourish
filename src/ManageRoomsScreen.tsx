// ManageRoomsScreen — list, add, edit, and delete rooms.
// Neutral system voice. Each room shows its name, light level, and plant count.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type Room, type LightLevel } from './store'
import { PCT } from './tokens'
import { TopBar, FormField } from './components/UI'
import { SunGlyph, PlusGlyph } from './components/Glyphs'

const LIGHT_LABELS: Record<LightLevel, string> = {
  low: 'Low light',
  medium: 'Medium light',
  bright: 'Bright light',
}

const LIGHT_HINTS: Record<LightLevel, string> = {
  low: 'North-facing or shaded — watering intervals extended 20%',
  medium: 'Standard indirect light — no adjustment',
  bright: 'Direct or strong indirect — intervals shortened 10%',
}

export default function ManageRoomsScreen() {
  const navigate = useNavigate()
  const { rooms, plants, addRoom, updateRoom, deleteRoom } = useStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Count plants per room (by room name, since Plant.room is a name FK)
  const plantCountFor = (roomName: string) =>
    plants.filter(p => p.room === roomName).length

  return (
    <div className="min-h-screen" style={{ background: PCT.cream, color: PCT.ink, paddingBottom: 110 }}>
      <TopBar title="Rooms" onBack={() => navigate(-1)} />

      <div className="px-5.5 pt-2 pb-4">
        <p style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 14, color: PCT.inkSoft, lineHeight: 1.5,
        }}>
          Light levels affect watering intervals. Low-light rooms extend them by 20%; bright rooms shorten by 10%.
        </p>
      </div>

      {/* Room list */}
      <div className="px-5.5 flex flex-col gap-2.5 mb-4">
        {rooms.map(room => (
          <div key={room.id}>
            {editingId === room.id ? (
              <RoomEditCard
                room={room}
                plantCount={plantCountFor(room.name)}
                onSave={async (data) => {
                  await updateRoom(room.id, data)
                  setEditingId(null)
                }}
                onDelete={async () => {
                  await deleteRoom(room.id)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RoomCard
                room={room}
                plantCount={plantCountFor(room.name)}
                onEdit={() => setEditingId(room.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add room */}
      {showAddForm ? (
        <div className="px-5.5">
          <RoomEditCard
            onSave={async (data) => {
              await addRoom(data as Omit<Room, 'id'>)
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : (
        <div className="px-5.5">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2.5"
            style={{
              padding: '16px 22px',
              background: 'transparent',
              border: `1.5px dashed ${PCT.terracotta}55`,
              borderRadius: 22,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              color: PCT.terracotta,
            }}
          >
            <PlusGlyph color={PCT.terracotta} size={16} />
            Add a room
          </button>

          <div className="text-center mt-9" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
            lineHeight: 1.5, padding: '0 32px',
          }}>
            A room is just a label and a light level.<br />
            Move plants between rooms from each plant's detail.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── RoomCard — read-only row ────────────────────────────────────────────────
function RoomCard({ room, plantCount, onEdit }: {
  room: Room; plantCount: number; onEdit: () => void
}) {
  return (
    <div style={{
      background: PCT.paper,
      border: `1px solid ${PCT.ink}10`,
      borderRadius: 20,
      padding: '16px 18px',
    }}>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center flex-shrink-0" style={{
          width: 42, height: 42, borderRadius: 12,
          background: lightBg(room.light),
        }}>
          <SunGlyph color={lightColor(room.light)} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 20, lineHeight: 1.1, color: PCT.ink,
          }}>{room.name}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: lightColor(room.light),
            }}>{LIGHT_LABELS[room.light]}</span>
            <span style={{ color: PCT.inkFaint, fontSize: 10 }}>·</span>
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: PCT.inkFaint,
            }}>
              {plantCount} plant{plantCount !== 1 ? 's' : ''}
            </span>
          </div>
          {room.notes && (
            <div className="mt-1" style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 13, color: PCT.inkSoft, lineHeight: 1.4,
            }}>{room.notes}</div>
          )}
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: '6px 12px',
            background: PCT.cream,
            border: `1px solid ${PCT.ink}14`,
            borderRadius: 10,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 13,
            color: PCT.inkSoft,
          }}
        >Edit</button>
      </div>
    </div>
  )
}

// ─── RoomEditCard — inline edit / add form ───────────────────────────────────
function RoomEditCard({ room, plantCount, onSave, onDelete, onCancel }: {
  room?: Room
  plantCount?: number
  onSave: (data: Partial<Omit<Room, 'id'>>) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(room?.name ?? '')
  const [light, setLight] = useState<LightLevel>(room?.light ?? 'medium')
  const [notes, setNotes] = useState(room?.notes ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isNew = !room

  const handleSave = async () => {
    if (!name.trim()) return
    await onSave({ name: name.trim(), light, notes: notes.trim() || undefined })
  }

  return (
    <div style={{
      background: PCT.paper,
      border: `1px solid ${PCT.ink}14`,
      borderRadius: 22,
      padding: '18px 18px 14px',
    }}>
      <div className="mb-3" style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: PCT.terracotta,
      }}>{isNew ? 'New room' : 'Editing room'}</div>

      <FormField label="Room name" value={name} onChange={setName} placeholder="e.g. Living Room" />

      {/* Light selector */}
      <div className="mb-4">
        <div className="mb-2" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>Light level</div>
        <div className="flex flex-col gap-2">
          {(['low', 'medium', 'bright'] as LightLevel[]).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLight(lvl)}
              className="flex items-center gap-3 text-left"
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: light === lvl ? lightBg(lvl) : PCT.cream,
                border: `1.5px solid ${light === lvl ? lightColor(lvl) + '60' : PCT.ink + '12'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <SunGlyph color={lightColor(lvl)} size={16} />
              <div>
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: 16, color: PCT.ink,
                }}>{LIGHT_LABELS[lvl]}</div>
                <div style={{
                  fontFamily: 'Newsreader, Georgia, serif',
                  fontSize: 12, color: PCT.inkFaint, lineHeight: 1.3,
                }}>{LIGHT_HINTS[lvl]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <FormField label="Notes" value={notes} onChange={setNotes}
        placeholder="Optional — e.g. East-facing windows" subhint="Optional" />

      <div className="flex gap-2.5 mt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1"
          style={{
            padding: '14px',
            background: 'transparent',
            border: `1px solid ${PCT.ink}22`,
            borderRadius: 16,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16,
            color: PCT.inkSoft,
          }}
        >Cancel</button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1"
          style={{
            padding: '14px',
            background: name.trim() ? PCT.terracotta : PCT.inkFaint,
            color: PCT.cream,
            borderRadius: 16,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16,
            boxShadow: name.trim() ? '0 6px 16px rgba(165,78,38,0.28)' : 'none',
          }}
        >{isNew ? 'Add room' : 'Save changes'}</button>
      </div>

      {/* Delete — only for existing rooms */}
      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (!confirmDelete) { setConfirmDelete(true); return }
            onDelete()
          }}
          className="w-full mt-2.5"
          style={{
            padding: '11px',
            background: confirmDelete ? PCT.thirsty : 'transparent',
            border: confirmDelete ? 'none' : `1px solid ${PCT.thirsty}44`,
            color: confirmDelete ? PCT.cream : PCT.thirsty,
            borderRadius: 12,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 13,
          }}
        >
          {confirmDelete
            ? `Confirm — remove ${room?.name}${(plantCount ?? 0) > 0 ? ` (${plantCount} plants unassigned)` : ''}`
            : `Remove ${room?.name}`}
        </button>
      )}
    </div>
  )
}

// ─── Light helpers ───────────────────────────────────────────────────────────
function lightColor(light: LightLevel): string {
  if (light === 'low') return PCT.inkSoft
  if (light === 'medium') return PCT.olive
  return PCT.terracottaDeep
}

function lightBg(light: LightLevel): string {
  if (light === 'low') return PCT.paperDeep
  if (light === 'medium') return PCT.oliveSoft
  return PCT.terracottaSoft
}
