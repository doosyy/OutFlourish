// Phase 2 placeholder — Phase 3 will rewrite this as the Home Hybrid layout
// (terracotta summary widget + editorial list with mood quotes + floating NFC pill).

import { useNavigate } from 'react-router-dom'
import {
  useStore,
  getDueLabel,
  getDueState,
  getMoistureLabel,
  getHydrationScale,
} from './store'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { plants, rooms, settings, isLoaded } = useStore()
  const now = Date.now()
  const opts = {
    now,
    hemisphere: settings.season.hemisphere,
    lightAware: settings.rooms.lightAwareCare,
  }

  const lightFor = (roomName?: string) => rooms.find(r => r.name === roomName)?.light

  return (
    <div className="min-h-screen px-6 pb-32" style={{ paddingTop: 'max(56px, var(--sat))' }}>
      <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-terracotta mb-1">
        {new Date(now).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <h1 className="font-display italic text-3xl text-ink tracking-tighter mb-6">Phase 2 stub · Home</h1>

      {!isLoaded && <p className="font-body text-ink-faint">Loading…</p>}

      {isLoaded && plants.length === 0 && (
        <div className="mt-12 text-center">
          <p className="font-display italic text-2xl text-ink-soft mb-2">No plants yet.</p>
          <button
            onClick={() => navigate('/add')}
            className="mt-6 px-7 py-4 bg-terracotta text-cream rounded-full font-display italic text-lg shadow-cta"
          >
            Add your first plant
          </button>
        </div>
      )}

      <ul className="space-y-3 mt-4">
        {plants.map(p => {
          const roomLight = lightFor(p.room)
          const hydration = getHydrationScale(p, { ...opts, roomLight })
          const dueState = getDueState(p, { ...opts, roomLight })
          const dueLabel = getDueLabel(p, { ...opts, roomLight })
          return (
            <li key={p.id}>
              <button
                onClick={() => navigate(`/plant/${p.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-paper border border-ink/10 rounded-card text-left"
              >
                <div
                  className="w-14 h-14 rounded-full bg-cover bg-center flex-shrink-0"
                  style={{
                    backgroundImage: p.photo ? `url(${p.photo})` : undefined,
                    background: !p.photo
                      ? 'linear-gradient(135deg,oklch(0.88 0.030 110),oklch(0.86 0.045 50))'
                      : undefined,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl text-ink leading-none">{p.name}</div>
                  {p.species && (
                    <div className="font-display italic text-sm text-ink-soft mt-1 truncate">{p.species}</div>
                  )}
                  <div className="font-mono text-[10px] tracking-wider text-ink-faint mt-1">
                    {p.room ?? 'No room'} · {Math.round(hydration * 100)}% · {getMoistureLabel(hydration)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-mono text-[9px] tracking-widest uppercase ${
                      dueState === 'overdue' ? 'text-thirsty'
                        : dueState === 'soon' ? 'text-soon'
                        : 'text-olive'
                    }`}
                  >
                    {dueState === 'fresh' ? 'Fresh' : dueState}
                  </div>
                  <div className="font-display italic text-xs text-ink mt-1">{dueLabel}</div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="fixed bottom-0 inset-x-0 px-6 pt-6 pb-[max(24px,var(--sab))] flex justify-center gap-3 bg-gradient-to-t from-cream to-transparent">
        <button
          onClick={() => navigate('/settings')}
          className="px-5 py-3 bg-paper border border-ink/10 rounded-full font-display italic text-sm"
        >
          Settings
        </button>
        <button
          onClick={() => navigate('/add')}
          className="px-5 py-3 bg-terracotta text-cream rounded-full font-display italic text-sm shadow-cta-sm"
        >
          + Add plant
        </button>
      </div>
    </div>
  )
}
