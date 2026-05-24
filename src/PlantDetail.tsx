// Phase 2 placeholder — Phase 3 rewrites with full editorial layout
// (hero photo, overlapping PlantPhotoMeter, sparkline, care guide accordion, diary).

import { useParams, useNavigate } from 'react-router-dom'
import {
  useStore,
  getDueLabel,
  getDueState,
  getLastWateredLabel,
  getHydrationScale,
  getMoistureLabel,
  getTotalWaterMl,
  getWaterCount,
} from './store'
import { getSpeciesById } from './speciesDb'

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plants, rooms, settings, logWater, deletePlant } = useStore()
  const plant = plants.find(p => p.id === id)

  if (!plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-display italic text-xl text-ink-soft">Plant not found.</p>
        <button onClick={() => navigate('/')} className="font-display italic text-terracotta-deep underline">
          Go home
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
  const dueLabel = getDueLabel(plant, opts)
  const dueState = getDueState(plant, opts)
  const species = plant.speciesId ? getSpeciesById(plant.speciesId) : undefined

  return (
    <div className="min-h-screen px-6 pb-12" style={{ paddingTop: 'max(56px, var(--sat))' }}>
      <button onClick={() => navigate(-1)} className="font-display italic text-ink-soft mb-4">← Back</button>

      <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta mb-2">
        Phase 2 stub · Plant Detail
      </div>
      <h1 className="font-display text-5xl text-ink tracking-tightest mb-1">{plant.name}</h1>
      {plant.species && (
        <p className="font-display italic text-lg text-terracotta-deep mb-1">{plant.species}</p>
      )}
      <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-6">
        {plant.room ?? 'No room'}
        {species?.toxic && (
          <> · <span className="font-display italic text-xs text-thirsty normal-case tracking-normal">
            toxic to {species.toxicTo === 'both' ? 'pets & children' : species.toxicTo}
          </span></>
        )}
      </p>

      <div
        className="w-40 h-40 mx-auto rounded-full bg-cover bg-center mb-6 shadow-photo"
        style={{ backgroundImage: plant.photo ? `url(${plant.photo})` : undefined }}
      />

      <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta text-center mb-1">
        Soil moisture
      </div>
      <p className="font-display italic text-xl text-ink text-center mb-6">
        {getMoistureLabel(hydration)} · {Math.round(hydration * 100)}%
      </p>

      {plant.mood && (
        <p className="font-display italic text-sm text-ink-faint text-center max-w-xs mx-auto mb-8">
          "{plant.mood}"
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        <Vital label="Last watered" value={getLastWateredLabel(plant)} />
        <Vital label="Next due" value={dueLabel} accent={dueState === 'overdue' ? 'text-thirsty' : dueState === 'soon' ? 'text-soon' : 'text-olive'} />
        <Vital label="Per drink" value={`${plant.recommendedMl}`} subtle="ml" />
      </div>

      <button
        onClick={() => logWater(plant.id, 'water')}
        className="w-full py-5 bg-terracotta text-cream rounded-card font-display italic text-xl shadow-cta mb-3"
      >
        Water {plant.name} · {plant.recommendedMl} ml
      </button>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button onClick={() => logWater(plant.id, 'fertilize')}
          className="py-3 bg-paper border border-ink/10 rounded-btn font-display italic">
          Fertilise
        </button>
        <button onClick={() => logWater(plant.id, 'repot')}
          className="py-3 bg-paper border border-ink/10 rounded-btn font-display italic">
          Repot
        </button>
      </div>

      {species && (
        <details className="mt-8 mb-8">
          <summary className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta cursor-pointer">
            Care guide
          </summary>
          <div className="mt-3 space-y-3 font-body text-sm text-ink-soft">
            <p><span className="font-display text-base text-ink">Light · </span>{species.careGuide.light}</p>
            <p><span className="font-display text-base text-ink">Water · </span>{species.careGuide.water}</p>
            <p><span className="font-display text-base text-ink">Food · </span>{species.careGuide.food}</p>
            <p><span className="font-display text-base text-ink">Season · </span>{species.careGuide.season}</p>
            <p><span className="font-display text-base text-ink">Troubles · </span>{species.careGuide.trouble}</p>
          </div>
        </details>
      )}

      <div className="mt-8">
        <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta mb-2">The diary</div>
        <p className="font-body text-sm text-ink-soft mb-2">
          {getWaterCount(plant)} drinks · {(getTotalWaterMl(plant) / 1000).toFixed(1)} L given
        </p>
        <ul className="space-y-1 text-sm">
          {plant.history.slice(0, 10).map(e => (
            <li key={e.id} className="flex justify-between font-display text-ink">
              <span className="capitalize">{e.type}{e.amountMl ? ` · ${e.amountMl} ml` : ''}</span>
              <span className="font-mono text-xs text-ink-faint">
                {new Date(e.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => { if (confirm('Send to compost?')) { deletePlant(plant.id); navigate('/') } }}
        className="mt-12 mx-auto block font-display italic text-thirsty text-sm"
      >
        Send to compost
      </button>
    </div>
  )
}

function Vital({ label, value, subtle, accent }: { label: string; value: string; subtle?: string; accent?: string }) {
  return (
    <div className="p-3 bg-paper border border-ink/10 rounded-card-s text-center">
      <div className="font-mono text-[9px] tracking-widest uppercase text-ink-faint mb-1">{label}</div>
      <div className={`font-display text-base ${accent ?? 'text-ink'}`}>{value}</div>
      {subtle && <div className="font-display italic text-[11px] text-ink-faint mt-1">{subtle}</div>}
    </div>
  )
}
