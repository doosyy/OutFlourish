// PhotoPicker — encapsulates the photo-capture flow used by AddPlantScreen and
// PlantDetail edit form. Renders a tappable thumbnail; tapping opens the
// PhotoSourceSheet; choosing Camera/Photos shows the PermissionPrompt first,
// then calls into ./photos.ts to capture or pick and persist the image.

import { useState } from 'react'
import { PCT } from '../tokens'
import { PhotoSourceSheet, type PhotoChoice } from '../sheets'
import PermissionPrompt, { type PermissionKind } from '../PermissionPrompt'
import { capturePlantPhoto, type PhotoSource } from '../photos'

interface Props {
  /** Currently displayed photo URL. */
  currentPhoto: string
  /** Stock species photo to revert to. Empty string if no species. */
  speciesPhoto: string
  /** Plant ID for naming stored files. */
  plantId: string
  onChange: (newPhoto: string) => void
}

export default function PhotoPicker({ currentPhoto, speciesPhoto, plantId, onChange }: Props) {
  const [showChooser, setShowChooser] = useState(false)
  const [pendingPermission, setPendingPermission] = useState<PermissionKind | null>(null)
  const [busy, setBusy] = useState(false)

  const isUserPhoto = currentPhoto !== speciesPhoto && currentPhoto !== ''

  const handleChoice = (choice: PhotoChoice) => {
    setShowChooser(false)
    if (choice === 'species') {
      onChange(speciesPhoto)
      return
    }
    // 'camera' or 'photos' → show pre-prompt first
    setPendingPermission(choice === 'camera' ? 'camera' : 'photos')
  }

  const handleEnable = async () => {
    const source: PhotoSource = pendingPermission === 'camera' ? 'camera' : 'photos'
    setPendingPermission(null)
    setBusy(true)
    try {
      const result = await capturePlantPhoto(plantId, source)
      if (result) onChange(result.src)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowChooser(true)}
        disabled={busy}
        className="relative flex-shrink-0 group"
        style={{
          width: 64, height: 64, borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${PCT.ink}14`,
          cursor: 'pointer',
        }}
        aria-label="Change photo"
      >
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
        }} />
        {currentPhoto && (
          <img
            src={currentPhoto}
            alt="Plant portrait"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
        {/* Edit affordance overlay */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center"
          style={{
            padding: '3px 0',
            background: 'rgba(58,30,18,0.62)',
            color: PCT.cream,
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}
        >
          {busy ? '…' : isUserPhoto ? 'yours' : 'tap'}
        </div>
      </button>

      {showChooser && (
        <PhotoSourceSheet
          hasSpeciesPhoto={!!speciesPhoto && currentPhoto !== speciesPhoto}
          onChoose={handleChoice}
          onDismiss={() => setShowChooser(false)}
        />
      )}

      {pendingPermission && (
        <PermissionPrompt
          kind={pendingPermission}
          onEnable={handleEnable}
          onDecline={() => setPendingPermission(null)}
          onBack={() => setPendingPermission(null)}
        />
      )}
    </>
  )
}
