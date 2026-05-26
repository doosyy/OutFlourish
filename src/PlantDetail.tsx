// PlantDetail. Full editorial layout per the design canvas.
// Hero photo → cream sheet overlap → giant PlantPhotoMeter → editorial vitals
// → primary water CTA → secondary actions → care guide accordion → diary
// timeline → quiet edit/compost footer → "Back to the garden" pill.

import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useStore,
  getLastWatered,
  getDueLabel,
  getDueState,
  getHydrationScale,
  getMoistureLabel,
  getLastWateredLabel,
  getTotalWaterMl,
  getWaterCount,
  getSeasonMultiplier,
  type Plant,
  type WaterLog,
} from './store'
import { PCT, accentFor } from './tokens'
import { getSpeciesById } from './speciesDb'
import PlantPhotoMeter from './components/PlantPhotoMeter'
import HydrationSparkline from './components/HydrationSparkline'
import { AccordionRow, GlassCircle, FormField } from './components/UI'
import PhotoPicker from './components/PhotoPicker'
import { removeStoredPhoto } from './photos'
import { WateringSheet } from './sheets'
import {
  ChevronGlyph, EditGlyph, DotsGlyph, DropGlyph, FoodGlyph, RepotGlyph,
  SunGlyph, SeasonGlyph, TroubleGlyph,
} from './components/Glyphs'

const LOG_ICON: Record<WaterLog['type'], React.ComponentType<{ color: string; size: number }>> = {
  water: DropGlyph,
  fertilize: FoodGlyph,
  repot: RepotGlyph,
}

const LOG_LABEL: Record<WaterLog['type'], string> = {
  water: 'Watered',
  fertilize: 'Fertilised',
  repot: 'Repotted',
}

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plants, rooms, settings, logWater, deletePlant } = useStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showCompost, setShowCompost] = useState(false)
  const [showWateringSheet, setShowWateringSheet] = useState(false)

  // Long-press detection on Water button
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const startLongPress = () => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setShowWateringSheet(true)
    }, 500)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const plant = plants.find(p => p.id === id)
  if (!plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: PCT.cream }}>
        <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 22, color: PCT.inkSoft, fontStyle: 'italic' }}>
          Plant not found.
        </p>
        <button onClick={() => navigate('/')} style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 16, color: PCT.terracottaDeep,
          textDecoration: 'underline',
        }}>
          Back to the garden →
        </button>
      </div>
    )
  }

  const roomLight = rooms.find(r => r.name === plant.room)?.light
  const opts = {
    hemisphere: settings.season.hemisphere,
    lightAware: settings.rooms.lightAwareCare,
    roomLight,
  }
  const hydration = getHydrationScale(plant, opts)
  const accent = accentFor(hydration)
  const dueLabel = getDueLabel(plant, opts)
  const dueState = getDueState(plant, opts)
  const species = plant.speciesId ? getSpeciesById(plant.speciesId) : undefined
  const existingRooms = rooms.map(r => r.name)

  return (
    <div className="min-h-screen relative" style={{
      background: PCT.cream,
      color: PCT.ink,
      paddingBottom: 'max(160px, calc(var(--sab) + 140px))',
    }}>
      {/* ── HERO PHOTO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        height: 340,
        background: `linear-gradient(135deg, ${PCT.oliveDeep}, ${PCT.terracottaDeep})`,
      }}>
        {plant.photo && (
          <img
            src={plant.photo}
            alt={plant.species ?? plant.name}
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* top legibility gradient */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
          height: 140,
          background: 'linear-gradient(180deg, rgba(35,18,10,0.55), transparent)',
        }} />
        {/* Header row */}
        <div
          className="absolute left-4.5 right-4.5 flex items-center justify-between"
          style={{ top: 'max(56px, var(--sat))' }}
        >
          <GlassCircle onClick={() => navigate(-1)} ariaLabel="Back">
            <ChevronGlyph color={PCT.cream} size={18} />
          </GlassCircle>
          <div
            className="inline-flex items-center gap-2"
            style={{
              padding: '7px 14px 7px 10px',
              background: 'rgba(255,251,243,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 4px 14px rgba(0,0,0,0.18)',
              color: accent,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 13,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent }} />
            {dueLabel}
          </div>
          <div className="flex gap-2">
            <GlassCircle onClick={() => setShowEdit(v => !v)} ariaLabel="Edit">
              <EditGlyph color={PCT.cream} size={16} />
            </GlassCircle>
            <GlassCircle ariaLabel="More">
              <DotsGlyph color={PCT.cream} size={18} />
            </GlassCircle>
          </div>
        </div>
      </div>

      {/* ── OVERLAPPING CREAM SHEET ────────────────────────────────────── */}
      <div className="relative" style={{
        marginTop: -36,
        background: PCT.cream,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: '24px 22px 8px',
        boxShadow: '0 -10px 30px rgba(58,30,18,0.08)',
      }}>
        {/* Giant moisture meter, overlapping into the photo */}
        <div className="flex justify-center relative" style={{ marginTop: -84, marginBottom: 12, zIndex: 2 }}>
          <div
            className={dueState === 'overdue' ? 'animate-breathe' : undefined}
            style={{
              background: PCT.cream,
              borderRadius: '50%',
              padding: 6,
              boxShadow: dueState === 'overdue'
                ? `0 12px 28px rgba(58,30,18,0.18), 0 0 0 3px ${PCT.thirsty}, 0 0 0 8px ${PCT.thirsty}22`
                : dueState === 'soon'
                ? `0 12px 28px rgba(58,30,18,0.18), 0 0 0 2px ${PCT.soon}, 0 0 0 6px ${PCT.soon}1c`
                : '0 12px 28px rgba(58,30,18,0.18)',
              position: 'relative',
            }}
          >
            <PlantPhotoMeter
              photo={plant.photo}
              alt={plant.species ?? plant.name}
              hydration={hydration}
              size={148}
              ring={false}
            />
            {dueState === 'overdue' && (
              <div
                className="absolute inline-flex items-center gap-1.5 animate-overdue-badge"
                style={{
                  top: -10, right: -10,
                  padding: '5px 12px 5px 10px',
                  background: PCT.thirsty, color: PCT.cream,
                  borderRadius: 999,
                  boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PCT.cream }} />
                Overdue
              </div>
            )}
          </div>
        </div>

        {/* Hydration label */}
        <div className="text-center mb-4.5">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
            color: accent, marginBottom: 4,
          }}>Soil moisture</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 22, color: PCT.ink,
          }}>
            {getMoistureLabel(hydration)} · {Math.round(hydration * 100)}%
          </div>
        </div>

        {/* Name + species */}
        <div className="text-center mb-1.5">
          <h1 style={{
            margin: 0,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: plant.name.length > 22 ? 38 : plant.name.length > 14 ? 44 : 52,
            lineHeight: 0.95, fontWeight: 400,
            letterSpacing: '-0.025em', color: PCT.ink,
            wordBreak: 'break-word',
          }}>{plant.name}</h1>
          {plant.species && (
            <div className="mt-1.5" style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 18, color: PCT.terracottaDeep,
            }}>{plant.species}</div>
          )}
          <div className="mt-1" style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.inkFaint,
          }}>
            {plant.room ?? 'Unsited'}
            {species?.toxic && (
              <>
                <span style={{ margin: '0 8px', color: PCT.terracottaSoft }}>·</span>
                <span style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 12,
                  textTransform: 'none', letterSpacing: 'normal',
                  color: PCT.thirsty,
                }}>
                  toxic to {species.toxicTo === 'both' ? 'pets & children' : species.toxicTo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mood quote */}
        {plant.mood && (
          <div className="mx-auto text-center" style={{
            margin: '14px auto 24px',
            maxWidth: 280,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, lineHeight: 1.4,
            color: PCT.inkFaint, letterSpacing: 0.1,
          }}>
            <span style={{ color: PCT.terracotta, marginRight: 3 }}>“</span>
            {plant.mood}
            <span style={{ color: PCT.terracotta, marginLeft: 3 }}>”</span>
          </div>
        )}

        {/* Sparkline */}
        <div className="mb-5.5">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta, marginBottom: 8,
          }}>The last 30 days</div>
          <HydrationSparkline plant={plant} width={358} height={94} accent={accent}
            intervalDays={plant.baseIntervalDays} />
        </div>

        {/* Vitals 2x2 */}
        <div className="grid grid-cols-2 gap-2 mb-4.5">
          {(() => {
            const last = getLastWatered(plant)
            if (last === null) return <VitalCard label="Last watered" value="Never" />
            const raw = getLastWateredLabel(plant)
            const hasAgo = raw.endsWith(' ago')
            return <VitalCard label="Last watered"
              value={hasAgo ? raw.replace(' ago', '') : raw}
              subtle={hasAgo ? 'ago' : undefined} />
          })()}
          <VitalCard label="Next due"
            value={dueLabel.replace('Due in ', '').replace('Due ', '')}
            accent={accent} />
          <VitalCard label="Per drink" value={String(plant.recommendedMl)} subtle="ml" />
          <VitalCard label="All time"
            value={(getTotalWaterMl(plant) / 1000).toFixed(1)}
            subtle="L given" />
        </div>

        {/* Edit form (inline collapsible) */}
        {showEdit && (
          <EditPlantForm
            plant={plant}
            existingRooms={existingRooms}
            onClose={() => setShowEdit(false)}
            onDelete={() => navigate('/', { replace: true })}
          />
        )}

        {/* Primary CTA. Tap = log recommended; long-press = open WateringSheet */}
        <button
          onClick={() => {
            if (longPressTriggered.current) return
            logWater(plant.id, 'water')
          }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={e => e.preventDefault()}
          className="w-full flex items-center justify-center gap-3 select-none"
          style={{
            padding: '18px 22px',
            background: PCT.terracotta,
            color: PCT.cream,
            borderRadius: 22,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 22, fontStyle: 'italic',
            boxShadow: '0 12px 28px rgba(165,78,38,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            touchAction: 'manipulation',
          }}
        >
          <DropGlyph color={PCT.cream} size={18} />
          Water {plant.name} · {plant.recommendedMl} ml
        </button>
        <div className="text-center mt-2" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: PCT.inkFaint,
        }}>· hold to choose a different amount ·</div>

        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <SecondaryAction
            icon={<FoodGlyph color={PCT.olive} size={16} />}
            label="Fertilise"
            onClick={() => logWater(plant.id, 'fertilize')}
          />
          <SecondaryAction
            icon={<RepotGlyph color={PCT.terracottaDeep} size={16} />}
            label="Repot"
            onClick={() => logWater(plant.id, 'repot')}
          />
        </div>

        {/* Care guide */}
        {species && (
          <div className="mt-9">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
              color: PCT.terracotta, marginBottom: 6,
            }}>The care guide</div>
            <div className="mb-2" style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 28, lineHeight: 1.0, color: PCT.ink,
            }}>How to keep {plant.name} happy</div>

            <AccordionRow defaultOpen icon={<SunGlyph color={PCT.terracotta} size={18} />}
              title="Light" body={species.careGuide.light} />
            <AccordionRow icon={<DropGlyph color={PCT.terracotta} size={18} />}
              title="Water" body={species.careGuide.water} />
            <AccordionRow icon={<FoodGlyph color={PCT.terracotta} size={18} />}
              title="Food" body={species.careGuide.food} />
            <AccordionRow icon={<SeasonGlyph color={PCT.terracotta} size={18} />}
              title="Season" body={species.careGuide.season} />
            <AccordionRow icon={<TroubleGlyph color={PCT.terracotta} size={18} />}
              title="Troubles" body={species.careGuide.trouble} />
            <div style={{ height: 1, background: `${PCT.ink}18` }} />
          </div>
        )}
        {!species && (
          <div className="mt-7 py-3" style={{ borderTop: `1px solid ${PCT.ink}18` }}>
            <p style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 14, color: PCT.inkFaint,
            }}>
              No care guide. Custom plant.{' '}
              <button onClick={() => navigate('/add')} style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: 'italic',
                color: PCT.terracottaDeep, textDecoration: 'underline',
              }}>
                Search species database →
              </button>
            </p>
          </div>
        )}

        {/* Diary */}
        <div className="mt-9">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
            color: PCT.terracotta, marginBottom: 6,
          }}>The diary</div>
          <div className="mb-3.5" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28, lineHeight: 1.0, color: PCT.ink,
          }}>Every drink, fed, & repot</div>
          <DiaryTimeline plant={plant} />
        </div>

        {/* Quiet footer */}
        <div className="flex justify-center gap-6 mt-9" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 14,
        }}>
          <button
            onClick={() => setShowEdit(true)}
            style={{ color: PCT.inkSoft, padding: '4px 6px' }}
          >
            Edit {plant.name}
          </button>
          <span style={{ color: PCT.inkFaint }}>·</span>
          <button
            onClick={() => setShowCompost(true)}
            style={{ color: PCT.thirsty, padding: '4px 6px' }}
          >
            Send to compost
          </button>
        </div>

        {/* Compost confirm overlay */}
        {showCompost && (
          <CompostConfirm
            plant={plant}
            onConfirm={async () => {
              await deletePlant(plant.id)
              navigate('/', { replace: true })
            }}
            onCancel={() => setShowCompost(false)}
          />
        )}
      </div>

      {/* Floating "Back to the garden" pill */}
      <BackToGardenPill onClick={() => navigate('/')} />

      {/* Custom-amount watering sheet (long-press CTA) */}
      {showWateringSheet && (
        <WateringSheet
          plant={plant}
          initialMl={
            settings.watering.seasonalDosing &&
            getSeasonMultiplier(new Date(), settings.season.hemisphere) >= 2
              ? plant.winterMl
              : plant.recommendedMl
          }
          onClose={() => setShowWateringSheet(false)}
        />
      )}
    </div>
  )
}

// ─── VitalCard ───────────────────────────────────────────────────────────────
function VitalCard({ label, value, subtle, accent }: {
  label: string; value: string; subtle?: string; accent?: string
}) {
  return (
    <div style={{
      padding: '12px 12px 14px',
      background: PCT.paper,
      border: `1px solid ${PCT.ink}12`,
      borderRadius: 16,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
        color: PCT.inkFaint, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 22, lineHeight: 1.0,
        color: accent ?? PCT.ink,
      }}>{value}</div>
      {subtle && (
        <div className="mt-1" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 11.5, color: PCT.inkFaint,
        }}>{subtle}</div>
      )}
    </div>
  )
}

// ─── SecondaryAction ────────────────────────────────────────────────────────
function SecondaryAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2.5"
      style={{
        padding: 14,
        background: PCT.paper,
        border: `1px solid ${PCT.ink}14`,
        borderRadius: 18,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 16,
        color: PCT.ink,
      }}
    >
      {icon}{label}
    </button>
  )
}

// ─── DiaryTimeline + DiaryRow ───────────────────────────────────────────────
function DiaryTimeline({ plant }: { plant: Plant }) {
  const now = Date.now()
  const events = [...plant.history]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 12)
    .map(e => ({
      ...e,
      daysAgo: Math.floor((now - e.timestamp) / 86_400_000),
    }))

  if (events.length === 0) {
    return (
      <p style={{
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 14, color: PCT.inkFaint,
      }}>
        Nothing logged yet. The first drink starts the diary.
      </p>
    )
  }

  return (
    <div>
      {events.map((e, i) => (
        <DiaryRow key={e.id} event={e} last={i === events.length - 1} />
      ))}
      {plant.history.length > 12 && (
        <p className="mt-3" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: 1.5, color: PCT.inkFaint,
        }}>+ {plant.history.length - 12} earlier entries</p>
      )}
      <p className="mt-3" style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 13, color: PCT.inkFaint,
      }}>
        {getWaterCount(plant)} drinks · {(getTotalWaterMl(plant) / 1000).toFixed(1)} L all-time.
      </p>
    </div>
  )
}

function DiaryRow({ event, last }: { event: WaterLog & { daysAgo: number }; last: boolean }) {
  const Icon = LOG_ICON[event.type]
  const label = LOG_LABEL[event.type]
  const date = new Date(event.timestamp)
  const relative =
    event.daysAgo === 0 ? 'Today'
    : event.daysAgo === 1 ? 'Yesterday'
    : event.daysAgo < 14 ? `${event.daysAgo} days ago`
    : date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

  return (
    <div className="flex gap-3" style={{ paddingBottom: last ? 0 : 10 }}>
      <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: 22 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 22, height: 22, borderRadius: '50%',
            background: PCT.cream,
            border: `1px solid ${PCT.ink}18`,
          }}
        >
          <Icon color={PCT.terracotta} size={14} />
        </div>
        {!last && (
          <div className="flex-1" style={{
            width: 1, background: `${PCT.ink}1a`, minHeight: 22, marginTop: 2,
          }} />
        )}
      </div>
      <div className="flex-1" style={{ paddingBottom: last ? 0 : 14 }}>
        <div className="flex justify-between items-baseline">
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 17, color: PCT.ink,
          }}>
            {label}{event.amountMl ? ` · ${event.amountMl} ml` : ''}
          </span>
          <span style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: 1.5, color: PCT.inkFaint,
          }}>{relative}</span>
        </div>
        {event.note && (
          <div className="mt-0.5" style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 13, color: PCT.inkSoft,
          }}>{event.note}</div>
        )}
      </div>
    </div>
  )
}

// ─── BackToGardenPill ───────────────────────────────────────────────────────
function BackToGardenPill({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed left-5.5 right-5.5 flex justify-center z-10" style={{ bottom: 'max(28px, var(--sab))' }}>
      <button
        onClick={onClick}
        className="flex items-center gap-2.5"
        style={{
          background: PCT.ink,
          color: PCT.cream,
          padding: '12px 22px',
          borderRadius: 999,
          boxShadow: '0 12px 32px rgba(58,30,18,0.32)',
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 16,
        }}
      >
        <ChevronGlyph color={PCT.cream} size={16} />
        Back to the garden
      </button>
    </div>
  )
}

// ─── CompostConfirm ─────────────────────────────────────────────────────────
function CompostConfirm({ plant, onConfirm, onCancel }: {
  plant: Plant; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(35,18,10,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full animate-sheet-up"
        style={{
          background: PCT.cream,
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          padding: '28px 22px',
          paddingBottom: 'max(28px, var(--sab))',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.32)',
          maxWidth: 480,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
            color: PCT.thirsty, marginBottom: 10,
          }}>Are you sure</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28, lineHeight: 1.05, color: PCT.ink, marginBottom: 8,
          }}>
            Send {plant.name} to compost?
          </div>
          <p style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 14, color: PCT.inkSoft, lineHeight: 1.5,
          }}>
            This removes {plant.name} and its entire diary from your garden. It cannot be undone.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1"
            style={{
              padding: '16px',
              background: 'transparent',
              border: `1px solid ${PCT.ink}22`,
              borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              color: PCT.inkSoft,
            }}
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="flex-1"
            style={{
              padding: '16px',
              background: PCT.thirsty,
              color: PCT.cream,
              borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              boxShadow: '0 8px 18px rgba(180,60,30,0.28)',
            }}
          >
            Yes, compost it
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EditPlantForm ──────────────────────────────────────────────────────────
function EditPlantForm({ plant, existingRooms, onClose, onDelete }: {
  plant: Plant; existingRooms: string[]; onClose: () => void; onDelete: () => void
}) {
  const { updatePlant, deletePlant } = useStore()
  const [name, setName] = useState(plant.name)
  const [species, setSpecies] = useState(plant.species ?? '')
  const [room, setRoom] = useState(plant.room ?? '')
  const [mood, setMood] = useState(plant.mood ?? '')
  const [interval, setInterval] = useState(plant.baseIntervalDays)
  const [photo, setPhoto] = useState(plant.photo)
  const [photoPath, setPhotoPath] = useState<string | undefined>(plant.photoPath)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handlePhotoChange = async (newPhoto: string, newPath?: string) => {
    // If the previous photo was a user-captured one, delete it from Filesystem before swapping.
    if (photoPath && photoPath !== newPath) {
      await removeStoredPhoto(photoPath)
    }
    setPhoto(newPhoto)
    setPhotoPath(newPath)
  }

  // Species photo to revert to (falls back to existing photo if no species linked)
  const speciesPhoto = plant.speciesId
    ? getSpeciesById(plant.speciesId)?.photo ?? plant.photo
    : plant.photo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updatePlant(plant.id, {
      name: name.trim(),
      species: species.trim() || undefined,
      room: room.trim() || undefined,
      mood: mood.trim() || undefined,
      baseIntervalDays: interval,
      photo,
      photoPath,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deletePlant(plant.id)
    onDelete()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4" style={{
      background: PCT.paper,
      border: `1px solid ${PCT.ink}14`,
      borderRadius: 28,
      padding: 22,
    }}>
      <div className="mb-3" style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: PCT.terracotta,
      }}>Editing this plant</div>

      <div className="flex items-center gap-3.5 mb-4">
        <PhotoPicker
          currentPhoto={photo}
          speciesPhoto={speciesPhoto}
          plantId={plant.id}
          onChange={handlePhotoChange}
        />
        <div style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 13, color: PCT.inkSoft, lineHeight: 1.4,
        }}>
          Tap to take or pick a new portrait.
        </div>
      </div>

      <FormField label="Nickname" value={name} onChange={setName} placeholder="What do you call them?" />
      <FormField label="Species" value={species} onChange={setSpecies} placeholder="Latin or common name" />
      <FormField label="Room" value={room} onChange={setRoom}
        suggestions={existingRooms} placeholder="Where do they live?" />
      <FormField label="Mood" value={mood} onChange={setMood}
        placeholder="A small editorial flourish" subhint="Optional" />

      <div className="mb-4.5">
        <div className="mb-1.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>Watering interval</div>
        <div className="flex items-center gap-3" style={{
          padding: '14px 18px',
          background: PCT.cream,
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
            <button type="button" onClick={() => setInterval(v => Math.max(1, v - 1))}
              style={{ width: 26, height: 26, fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 18, color: PCT.terracottaDeep }}>−</button>
            <span style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 24, color: PCT.terracotta, minWidth: 28, textAlign: 'center',
            }}>{interval}</span>
            <button type="button" onClick={() => setInterval(v => Math.min(90, v + 1))}
              style={{ width: 26, height: 26, fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 18, color: PCT.terracottaDeep }}>+</button>
          </div>
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 15, color: PCT.inkSoft,
          }}>days</span>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1"
          style={{
            padding: '15px',
            background: 'transparent',
            border: `1px solid ${PCT.ink}22`,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            color: PCT.inkSoft,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1"
          style={{
            padding: '15px',
            background: PCT.terracotta,
            color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
          }}
        >
          Save changes
        </button>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="w-full mt-3"
        style={{
          padding: '12px',
          background: confirmDelete ? PCT.thirsty : 'transparent',
          border: confirmDelete ? 'none' : `1px solid ${PCT.thirsty}55`,
          color: confirmDelete ? PCT.cream : PCT.thirsty,
          borderRadius: 14,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 14,
        }}
      >
        {confirmDelete ? 'Confirm. Send to compost' : 'Send to compost'}
      </button>
    </form>
  )
}
