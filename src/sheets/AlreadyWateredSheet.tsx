// AlreadyWateredSheet — confirmation overlay when an NFC tap fires within 12h
// of the last drink. "{Name} had a drink Y hours ago" + Never mind / Log anyway.

import { useStore, getHydrationScale, type Plant } from '../store'
import { PCT } from '../tokens'
import PlantPhotoMeter from '../components/PlantPhotoMeter'
import { BottomSheet } from '../components/UI'

interface Props {
  plant: Plant
  hoursAgo: number
  onConfirm: () => void
  onCancel: () => void
}

export default function AlreadyWateredSheet({ plant, hoursAgo, onConfirm, onCancel }: Props) {
  const { rooms, settings } = useStore()
  const roomLight = rooms.find(r => r.name === plant.room)?.light
  const hydration = getHydrationScale(plant, {
    hemisphere: settings.season.hemisphere,
    lightAware: settings.rooms.lightAwareCare,
    roomLight,
  })

  const hoursPretty = hoursAgo < 1
    ? 'less than an hour ago'
    : hoursAgo === 1
    ? '1 hour ago'
    : `${Math.round(hoursAgo)} hours ago`

  return (
    <BottomSheet onDismiss={onCancel}>
      {/* Plant identity */}
      <div className="flex items-center gap-3.5 mb-5.5">
        <PlantPhotoMeter
          photo={plant.photo}
          alt={plant.species ?? plant.name}
          hydration={hydration}
          size={68}
        />
        <div>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta, marginBottom: 2,
          }}>Tag scanned</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28, lineHeight: 1.0, color: PCT.ink,
          }}>{plant.name}</div>
          {plant.species && (
            <div className="mt-0.5" style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 14, color: PCT.inkSoft,
            }}>{plant.species}</div>
          )}
        </div>
      </div>

      {/* Editorial copy */}
      <div className="mb-3" style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 32, lineHeight: 1.05, fontWeight: 400, color: PCT.ink,
        letterSpacing: '-0.025em',
      }}>
        {plant.name} had a drink<br />
        <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>{hoursPretty}</span>
        <span style={{ color: PCT.terracotta }}>.</span>
      </div>
      <p style={{
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 15, lineHeight: 1.5, color: PCT.inkSoft, margin: '0 0 24px',
      }}>
        Log another watering anyway? Most plants prefer a deeper, less frequent drink.
      </p>

      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 text-center"
          style={{
            padding: 15,
            background: PCT.paper,
            border: `1px solid ${PCT.ink}14`,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17, color: PCT.inkSoft,
          }}
        >
          Never mind
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 text-center"
          style={{
            padding: 15,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
          }}
        >
          Log anyway
        </button>
      </div>
    </BottomSheet>
  )
}
