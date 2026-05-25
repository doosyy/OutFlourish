// HomeScreen — "Hybrid" layout from the design canvas.
// Terracotta summary widget up top (with terrazzo speckles + quick actions),
// editorial list below (Featured plant + Almanac rows), floating NFC pill.
//
// HomeByRoom alternate layout: when settings.rooms.groupHomeByRoom === true,
// renders plants grouped under room headers with light tags.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WaterAllSheet } from './sheets'
import {
  useStore,
  getDueState,
  getDueLabel,
  getHydrationScale,
  getMoistureLabel,
  type Plant,
  type DueOptions,
} from './store'
import { PCT, PCLightTag, accentFor } from './tokens'
import PlantPhotoMeter from './components/PlantPhotoMeter'
import { TerrazzoTexture, CircleBtn } from './components/UI'
import {
  GearGlyph, PlusGlyph, DropGlyph, NFCGlyph, LeafGlyph,
} from './components/Glyphs'

// We need access to roomLight + settings inside helpers — derive a Plant+ object once
interface AugmentedPlant extends Plant {
  hydration: number
  due: string
  dueState: ReturnType<typeof getDueState>
  moistureLabel: string
}

function augment(p: Plant, opts: DueOptions): AugmentedPlant {
  const hydration = getHydrationScale(p, opts)
  return {
    ...p,
    hydration,
    due: getDueLabel(p, opts),
    dueState: getDueState(p, opts),
    moistureLabel: getMoistureLabel(hydration),
  }
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { plants, rooms, settings, isLoaded } = useStore()
  const [now, setNow] = useState(Date.now())
  const [showWaterAll, setShowWaterAll] = useState(false)

  // Tick once a minute so urgency labels stay fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Augment each plant with derived state, respecting room-light + season
  const lightFor = (roomName?: string) => rooms.find(r => r.name === roomName)?.light
  const augmented = plants.map(p => augment(p, {
    now,
    hemisphere: settings.season.hemisphere,
    lightAware: settings.rooms.lightAwareCare,
    roomLight: lightFor(p.room),
  }))

  // Empty state — first launch
  if (isLoaded && augmented.length === 0) {
    return <EmptyHome onAdd={() => navigate('/add')} />
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display italic text-ink-faint">Loading…</p>
      </div>
    )
  }

  // Sort: most-urgent first
  const sorted = [...augmented].sort((a, b) => urgencyRank(a) - urgencyRank(b))
  const thirsty = sorted.filter(p => p.dueState === 'overdue' || p.dueState === 'soon')
  const happy = sorted.filter(p => p.dueState === 'ok' || p.dueState === 'fresh')

  if (settings.rooms.groupHomeByRoom) {
    return <HomeByRoom now={now} thirsty={thirsty} sorted={sorted} />
  }

  const greeting = greetingFor(new Date(now))
  const dateStr = new Date(now).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="min-h-screen relative" style={{
      background: PCT.cream,
      backgroundImage: `radial-gradient(circle at 100% 95%, ${PCT.oliveSoft}55, transparent 38%)`,
      paddingTop: 'max(56px, var(--sat))',
      paddingBottom: 140,
    }}>
      {/* Top bar */}
      <div className="flex justify-between items-center px-5.5 pt-3">
        <div>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta,
          }}>{dateStr}</div>
          <div className="mt-0.5" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 22, color: PCT.ink,
          }}>{greeting}</div>
        </div>
        <div className="flex gap-2">
          <CircleBtn onClick={() => navigate('/settings')} ariaLabel="Settings">
            <GearGlyph color={PCT.terracottaDeep} size={16} />
          </CircleBtn>
          <CircleBtn filled onClick={() => navigate('/add')} ariaLabel="Add plant">
            <PlusGlyph color={PCT.cream} size={16} />
          </CircleBtn>
        </div>
      </div>

      {/* Terracotta summary widget */}
      <SummaryWidget thirsty={thirsty} onWaterAll={() => setShowWaterAll(true)} />

      {/* Featured (most urgent) */}
      {thirsty.length > 0 && <FeaturedPlant plant={thirsty[0]} onClick={() => navigate(`/plant/${thirsty[0].id}`)} />}

      {/* Second urgent — soft highlight row */}
      {thirsty.length > 1 && (
        <AlmanacRow plant={thirsty[1]} highlight onClick={() => navigate(`/plant/${thirsty[1].id}`)} />
      )}

      {/* Section break + happy plants */}
      {happy.length > 0 && (
        <>
          <div className="flex items-center gap-3.5" style={{ margin: '24px 28px 4px' }}>
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
              color: PCT.inkFaint, whiteSpace: 'nowrap',
            }}>The smugly hydrated · {happy.length}</span>
            <span className="flex-1" style={{ height: 1, background: `${PCT.ink}22` }} />
          </div>
          {happy.map(p => (
            <AlmanacRow key={p.id} plant={p} onClick={() => navigate(`/plant/${p.id}`)} />
          ))}
        </>
      )}

      {/* If everyone is happy and nothing thirsty */}
      {thirsty.length === 0 && (
        <div className="px-7 mt-8" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 20, color: PCT.inkSoft, textAlign: 'center',
        }}>
          The household is, frankly, fine.
        </div>
      )}

      {/* Footer signoff */}
      <div className="px-7 pt-7 text-center" style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
        lineHeight: 1.6,
      }}>
        {seasonalCaption(new Date(now), settings.season.region)}
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontStyle: 'normal', fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: PCT.terracotta, marginTop: 6,
        }}>
          Press a tag · earn a plant's silent gratitude
        </div>
      </div>

      {/* Floating NFC pill */}
      <FloatingNfcPill />

      {/* Water-all sheet */}
      {showWaterAll && thirsty.length > 0 && (
        <WaterAllSheet
          plants={thirsty}
          onClose={() => setShowWaterAll(false)}
        />
      )}
    </div>
  )
}

// ─── Summary widget ──────────────────────────────────────────────────────────
function SummaryWidget({ thirsty, onWaterAll }: { thirsty: AugmentedPlant[]; onWaterAll: () => void }) {
  const navigate = useNavigate()
  const count = thirsty.length
  return (
    <div
      className="relative overflow-hidden"
      style={{
        margin: '20px 22px 28px',
        padding: 22,
        background: PCT.terracotta,
        borderRadius: 28,
        color: PCT.cream,
        boxShadow: '0 18px 40px rgba(165,78,38,0.32), inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}
    >
      <TerrazzoTexture />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          opacity: 0.7, marginBottom: 10,
        }}>The dramatic ones</div>

        <div className="flex items-end gap-3.5 mb-4">
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 96, lineHeight: 0.82, fontWeight: 400, letterSpacing: '-0.06em',
          }}>{count}</div>
          <div className="flex-1 pb-1.5" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 19, fontStyle: 'italic',
            opacity: 0.95, lineHeight: 1.15,
          }}>
            {count === 0 ? <>everyone is, mercifully,<br />settled today</>
              : count === 1 ? <>plant throwing<br />a quiet tantrum</>
              : <>plants throwing<br />a quiet tantrum</>}
          </div>
        </div>

        {count > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {thirsty.slice(0, 6).map(p => (
              <ThirstyChip key={p.id} plant={p} onClick={() => navigate(`/plant/${p.id}`)} />
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4.5">
          <QuickAction
            primary
            icon={<DropGlyph color={PCT.terracottaDeep} size={14} />}
            label="Water all"
            onClick={onWaterAll}
          />
          <QuickAction
            icon={<NFCGlyph color={PCT.cream} size={14} />}
            label="Scan tag"
          />
          <QuickAction
            icon={<LeafGlyph color={PCT.cream} size={14} />}
            label="Notes"
          />
        </div>
      </div>
    </div>
  )
}

function ThirstyChip({ plant, onClick }: { plant: AugmentedPlant; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full"
      style={{
        padding: '5px 12px 5px 6px',
        background: 'rgba(255,255,255,0.18)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 14, color: PCT.cream,
      }}
    >
      <span
        className="inline-block relative"
        style={{
          width: 22, height: 22, borderRadius: '50%', overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
        }}
      >
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
        }} />
        {plant.photo && (
          <img
            src={plant.photo}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </span>
      {plant.name}
    </button>
  )
}

function QuickAction({ icon, label, primary, onClick }: {
  icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 rounded-card-s cursor-pointer"
      style={{
        padding: '10px 8px',
        background: primary ? PCT.cream : 'rgba(255,255,255,0.16)',
        color: primary ? PCT.terracottaDeep : PCT.cream,
        boxShadow: primary
          ? '0 4px 10px rgba(0,0,0,0.12)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.2)',
        fontFamily: 'Newsreader, Georgia, serif',
        fontWeight: 600, fontSize: 13,
      }}
    >
      {icon}{label}
    </button>
  )
}

// ─── Featured plant — most urgent ────────────────────────────────────────────
function FeaturedPlant({ plant, onClick }: { plant: AugmentedPlant; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid items-center w-full text-left"
      style={{
        gridTemplateColumns: '1fr 124px',
        gap: 18,
        margin: '0 28px 8px',
        padding: '18px 0',
        borderTop: `1px solid ${PCT.ink}22`,
        borderBottom: `1px solid ${PCT.ink}22`,
        width: 'calc(100% - 56px)',
      }}
    >
      <div className="min-w-0">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: accentFor(plant.hydration), marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          · {plant.dueState === 'overdue' ? 'Overdue' : 'Due soon'} · {plant.room ?? 'Unsited'}
        </div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: plant.name.length > 18 ? 28 : 34, lineHeight: 0.95, color: PCT.ink,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', wordBreak: 'break-word',
        }}>{plant.name}</div>
        {plant.species && (
          <div className="mt-1" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17, color: PCT.terracottaDeep,
          }}>{plant.species}</div>
        )}
        {plant.mood && (
          <div className="mt-3" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 13, color: PCT.inkSoft,
            lineHeight: 1.45, maxWidth: 220,
          }}>
            “{plant.mood}”
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <PlantPhotoMeter
          photo={plant.photo}
          alt={plant.species ?? plant.name}
          hydration={plant.hydration}
          size={124}
        />
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 12, color: accentFor(plant.hydration),
        }}>
          {plant.moistureLabel} · {Math.round(plant.hydration * 100)}%
        </div>
      </div>
    </button>
  )
}

// ─── Almanac row — compact list item ─────────────────────────────────────────
function AlmanacRow({ plant, highlight = false, onClick }: {
  plant: AugmentedPlant; highlight?: boolean; onClick?: () => void
}) {
  const color = accentFor(plant.hydration)
  return (
    <button
      onClick={onClick}
      className="grid items-center w-full text-left"
      style={{
        gridTemplateColumns: '52px 1fr auto',
        gap: 14,
        padding: '14px 28px',
        borderBottom: `1px solid ${PCT.ink}14`,
        background: highlight ? `${PCT.terracottaSoft}33` : 'transparent',
      }}
    >
      <PlantPhotoMeter
        photo={plant.photo}
        alt={plant.species ?? plant.name}
        hydration={plant.hydration}
        size={52}
      />
      <div className="min-w-0">
        <div className="truncate" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22, lineHeight: 1.0, color: PCT.ink,
        }}>{plant.name}</div>
        {plant.mood && (
          <div className="mt-1 truncate" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 13, color, lineHeight: 1.35,
            maxWidth: 200,
          }}>
            “{plant.mood}”
          </div>
        )}
        <div className="mt-1" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: 1.5, color: PCT.inkFaint,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {plant.species ?? 'Unknown species'} · {plant.room ?? 'Unsited'} · {Math.round(plant.hydration * 100)}%
        </div>
      </div>
      <div className="text-right flex flex-col gap-0.5">
        <span style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: 2.2, textTransform: 'uppercase',
          color,
        }}>
          {plant.dueState === 'fresh' ? 'Just watered'
            : plant.dueState === 'overdue' ? 'Overdue'
            : plant.dueState === 'soon' ? 'Today'
            : 'Settled'}
        </span>
        <span style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 13, color: PCT.ink,
        }}>{plant.due}</span>
      </div>
    </button>
  )
}

// ─── Floating "Hold to a plant tag" pill ─────────────────────────────────────
function FloatingNfcPill() {
  const setErrorSheet = useStore(s => s.setErrorSheet)
  const handleTap = async () => {
    try {
      const { NFC } = await import('@exxili/capacitor-nfc')
      const { supported } = await NFC.isSupported()
      if (!supported) {
        setErrorSheet('nfc-unavailable')
        return
      }
      await NFC.startScan()
      // Native iOS modal opens. App.tsx onRead listener handles the result.
    } catch {
      setErrorSheet('nfc-unavailable')
    }
  }
  return (
    <div
      className="fixed left-6 right-6 flex justify-center pointer-events-none z-10"
      style={{ bottom: 'max(50px, var(--sab))' }}
    >
      <button
        onClick={handleTap}
        className="flex items-center gap-3 pointer-events-auto cursor-pointer"
        style={{
          background: PCT.ink,
          color: PCT.cream,
          padding: '14px 22px',
          borderRadius: 999,
          boxShadow: '0 12px 32px rgba(58,30,18,0.35)',
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 17,
        }}
      >
        <NFCGlyph color={PCT.terracottaSoft} size={20} />
        Hold to a plant tag
      </button>
    </div>
  )
}

// ─── HomeByRoom alternate layout ─────────────────────────────────────────────
function HomeByRoom({ now, thirsty, sorted }: {
  now: number
  thirsty: AugmentedPlant[]
  sorted: AugmentedPlant[]
}) {
  const navigate = useNavigate()
  const { rooms } = useStore()
  const grouped = rooms
    .map(room => ({ room, plants: sorted.filter(p => p.room === room.name) }))
    .filter(g => g.plants.length > 0)
  const unsited = sorted.filter(p => !p.room)
  const greeting = greetingFor(new Date(now))
  const dateStr = new Date(now).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen relative" style={{
      background: PCT.cream,
      backgroundImage: `radial-gradient(circle at 100% 95%, ${PCT.oliveSoft}55, transparent 38%)`,
      paddingTop: 'max(56px, var(--sat))',
      paddingBottom: 140,
    }}>
      <div className="flex justify-between items-center px-5.5 pt-3">
        <div>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta,
          }}>{dateStr} · By room</div>
          <div className="mt-0.5" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 22, color: PCT.ink,
          }}>{greeting}</div>
        </div>
        <div className="flex gap-2">
          <CircleBtn onClick={() => navigate('/settings')} ariaLabel="Settings">
            <GearGlyph color={PCT.terracottaDeep} size={16} />
          </CircleBtn>
          <CircleBtn filled onClick={() => navigate('/add')} ariaLabel="Add plant">
            <PlusGlyph color={PCT.cream} size={16} />
          </CircleBtn>
        </div>
      </div>

      <div
        className="flex items-center gap-3.5"
        style={{
          margin: '18px 22px 26px',
          padding: '16px 20px',
          background: PCT.terracotta,
          color: PCT.cream,
          borderRadius: 22,
          boxShadow: '0 14px 30px rgba(165,78,38,0.28)',
        }}
      >
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 56, lineHeight: 0.82, letterSpacing: '-0.04em',
        }}>{thirsty.length}</div>
        <div className="flex-1" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 17, lineHeight: 1.15,
        }}>
          plants throwing a tantrum<br />
          across <span style={{ color: PCT.terracottaSoft }}>{grouped.length} rooms</span>
        </div>
      </div>

      {grouped.map(({ room, plants }) => (
        <div key={room.id} className="mb-4.5">
          <div
            className="flex items-baseline gap-3"
            style={{
              margin: '0 28px 4px',
              paddingBottom: 8,
              borderBottom: `1px solid ${PCT.ink}18`,
            }}
          >
            <h2 style={{
              margin: 0,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 28, lineHeight: 1.0, fontWeight: 400,
              color: PCT.ink, letterSpacing: '-0.025em',
            }}>{room.name}</h2>
            <span className="inline-flex items-center gap-1.5" style={{
              padding: '3px 9px',
              background: PCLightTag[room.light].bg,
              color: PCLightTag[room.light].color,
              borderRadius: 999,
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: PCLightTag[room.light].color,
                opacity: room.light === 'low' ? 0.4 : room.light === 'medium' ? 0.7 : 1,
              }} />
              {PCLightTag[room.light].label}
            </span>
            <div className="flex-1" />
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: 1.4, color: PCT.inkFaint,
            }}>{plants.length}</span>
          </div>
          {plants.map(p => (
            <AlmanacRow key={p.id} plant={p} onClick={() => navigate(`/plant/${p.id}`)} />
          ))}
        </div>
      ))}

      {unsited.length > 0 && (
        <div className="mb-4.5">
          <div style={{
            margin: '0 28px 4px', paddingBottom: 8,
            borderBottom: `1px solid ${PCT.ink}18`,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 22, fontStyle: 'italic', color: PCT.inkSoft,
          }}>Unsited</div>
          {unsited.map(p => <AlmanacRow key={p.id} plant={p} onClick={() => navigate(`/plant/${p.id}`)} />)}
        </div>
      )}

      <FloatingNfcPill />
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyHome({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="min-h-screen relative" style={{
      background: PCT.cream,
      backgroundImage: `
        radial-gradient(circle at 10% 6%, ${PCT.terracottaSoft}88, transparent 38%),
        radial-gradient(circle at 100% 95%, ${PCT.oliveSoft}88, transparent 40%)
      `,
      paddingTop: 'max(56px, var(--sat))',
      paddingBottom: 110,
    }}>
      <div className="px-5.5 py-3">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="mt-0.5" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 22, color: PCT.ink,
        }}>Hello, friend.</div>
      </div>

      <div className="px-7 text-center" style={{ paddingTop: 60, paddingBottom: 30 }}>
        <div
          className="mx-auto mb-7 flex items-center justify-center"
          style={{
            width: 180, height: 180,
            borderRadius: '50%',
            background: PCT.terracottaSoft,
            boxShadow: `inset 0 0 0 1px ${PCT.terracottaDeep}33`,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <ellipse cx="60" cy="78" rx="34" ry="6" fill={PCT.terracottaDeep} fillOpacity="0.18" />
            <path d="M30 50h60l-6 30c-0.5 4-4 7-8 7H44c-4 0-7.5-3-8-7L30 50z"
              fill={PCT.terracotta} stroke={PCT.terracottaDeep} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M26 48h68" stroke={PCT.terracottaDeep} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M60 48c-2-8-8-12-14-12M60 48c4-10 14-14 22-8M60 48v-6"
              stroke={PCT.olive} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta, marginBottom: 14,
        }}>The household, day one</div>

        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 42, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
          color: PCT.ink,
        }}>
          Your garden begins<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>with one plant</span>
          <span style={{ color: PCT.terracotta }}>.</span>
        </h1>

        <p className="mx-auto" style={{
          maxWidth: 280, marginTop: 20, marginBottom: 36,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>
          Add the first one and we'll learn its rhythm.
          Stick a tag to the pot to water it with a tap.
        </p>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2.5"
          style={{
            padding: '16px 28px',
            background: PCT.terracotta,
            color: PCT.cream,
            borderRadius: 999,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18,
            boxShadow: '0 12px 28px rgba(165,78,38,0.32)',
          }}
        >
          <PlusGlyph color={PCT.cream} size={14} />
          Add my first plant
        </button>
      </div>

      <div
        className="mx-auto"
        style={{
          margin: '40px 22px 0',
          padding: 24,
          background: PCT.paper,
          border: `1px solid ${PCT.ink}10`,
          borderRadius: 24,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <Promise n="01" title="It will learn your plants"
          body="Hydration adjusts by species, season, and how you actually care." />
        <Promise n="02" title="It won't pester you"
          body="One quiet badge in the morning. That's it." />
        <Promise n="03" title="Your data stays here"
          body="On your phone. Backup is a single file you control." />
      </div>
    </div>
  )
}

function Promise({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 28, lineHeight: 1.0,
        color: PCT.terracotta, flexShrink: 0,
      }}>{n}</div>
      <div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 17, lineHeight: 1.2, color: PCT.ink,
        }}>{title}</div>
        <div className="mt-0.5" style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 13, lineHeight: 1.45, color: PCT.inkSoft,
        }}>{body}</div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function urgencyRank(p: AugmentedPlant): number {
  if (p.dueState === 'overdue') return 0
  if (p.dueState === 'soon') return 1
  if (p.dueState === 'ok') return 2
  return 3 // fresh = least urgent
}

function greetingFor(d: Date): string {
  const h = d.getHours()
  if (h < 5)  return 'Still up.'
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  if (h < 21) return 'Good evening.'
  return 'A late hour.'
}

function seasonalCaption(d: Date, region: string): string {
  const m = d.getMonth() + 1
  // Southern hemisphere bias since default region is Melbourne
  let season = 'Late autumn'
  if (m === 12 || m <= 2) season = 'High summer'
  else if (m <= 4) season = 'Early autumn'
  else if (m === 5) season = 'Late autumn'
  else if (m <= 7) season = 'Deep winter'
  else if (m === 8) season = 'Late winter'
  else if (m <= 10) season = 'Spring'
  else season = 'Late spring'
  return `${season} · ${region.split(',')[0]}`
}
