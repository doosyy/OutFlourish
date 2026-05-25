// PhotoSourceSheet — three-row chooser for plant portraits.
// Tapping a row closes the sheet and calls the chosen handler.

import { PCT } from '../tokens'
import { BottomSheet } from '../components/UI'
import { CameraGlyph, PhotosGlyph, LeafGlyph } from '../components/Glyphs'

export type PhotoChoice = 'camera' | 'photos' | 'species'

interface Props {
  /** Show the "Use species photo" row — only when a species default exists. */
  hasSpeciesPhoto: boolean
  onChoose: (choice: PhotoChoice) => void
  onDismiss: () => void
}

export default function PhotoSourceSheet({ hasSpeciesPhoto, onChoose, onDismiss }: Props) {
  return (
    <BottomSheet onDismiss={onDismiss}>
      <div className="text-center mb-5.5">
        <div className="mb-1.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· Photo ·</div>
        <h2 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 28, lineHeight: 1.0, color: PCT.ink,
        }}>How would you like to picture it?</h2>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <Row
          icon={<CameraGlyph color={PCT.terracottaDeep} size={24} />}
          label="Take a photo"
          hint="A proper portrait with the camera."
          onClick={() => onChoose('camera')}
        />
        <Row
          icon={<PhotosGlyph color={PCT.terracottaDeep} size={24} />}
          label="Choose from library"
          hint="Pick a photo you already have."
          onClick={() => onChoose('photos')}
        />
        {hasSpeciesPhoto && (
          <Row
            icon={<LeafGlyph color={PCT.oliveDeep} size={20} />}
            label="Use the species photo"
            hint="A stock photo for the species."
            onClick={() => onChoose('species')}
          />
        )}
      </div>

      <button
        onClick={onDismiss}
        className="w-full text-center"
        style={{
          padding: 15,
          background: 'transparent',
          border: `1px solid ${PCT.ink}22`,
          borderRadius: 18,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 17, color: PCT.inkSoft,
        }}
      >
        Never mind
      </button>
    </BottomSheet>
  )
}

function Row({ icon, label, hint, onClick }: {
  icon: React.ReactNode
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 text-left w-full"
      style={{
        padding: '14px 16px',
        background: PCT.paper,
        border: `1px solid ${PCT.ink}10`,
        borderRadius: 18,
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 44, height: 44, borderRadius: 14,
          background: PCT.terracottaSoft,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 18, lineHeight: 1.0, color: PCT.ink,
        }}>{label}</div>
        <div className="mt-1" style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 13, lineHeight: 1.35, color: PCT.inkSoft,
        }}>{hint}</div>
      </div>
    </button>
  )
}
