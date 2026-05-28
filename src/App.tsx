import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { NFC } from '@exxili/capacitor-nfc'
import { useStore, type Plant } from './store'
import { PCT } from './tokens'
import HomeScreen from './HomeScreen'
import PlantDetail from './PlantDetail'
import NfcMoment from './NfcMoment'
import PairTagOverlay from './PairTagOverlay'
import { AlreadyWateredSheet, Toast, ErrorSheet, AmountOnScanSheet, BlankTagSheet } from './sheets'

// Lazy-loaded: rare-path routes carved out of the initial bundle.
// Each chunk only downloads on first navigation to that route.
const AddPlantScreen = lazy(() => import('./AddPlantScreen'))
const SettingsScreen = lazy(() => import('./SettingsScreen'))
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'))
const ManageRoomsScreen = lazy(() => import('./ManageRoomsScreen'))
const Onboarding = lazy(() => import('./Onboarding'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: PCT.cream }}>
      <div style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 16, color: PCT.inkFaint,
      }}>One moment…</div>
    </div>
  )
}

const lazyRoute = (node: React.ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
)

function parsePlantIdFromNdefPayload(payload: number[]): string | null {
  if (!payload || payload.length < 3) return null
  // NDEF Well Known Text record: first byte = status, bits 0-5 = language code length
  const langCodeLen = payload[0] & 0x3f
  const textBytes = payload.slice(1 + langCodeLen)
  const text = new TextDecoder('utf-8').decode(new Uint8Array(textBytes))
  return /^plant_\d+$/.test(text) ? text : null
}

const router = createHashRouter([
  { path: '/', element: <HomeScreen /> },
  { path: '/plant/:id', element: <PlantDetail /> },
  { path: '/add', element: lazyRoute(<AddPlantScreen />) },
  { path: '/settings', element: lazyRoute(<SettingsScreen />) },
  { path: '/privacy', element: lazyRoute(<PrivacyPolicy />) },
  { path: '/rooms', element: lazyRoute(<ManageRoomsScreen />) },
])

export default function App() {
  const {
    load, plants, settings, isLoaded, completeOnboarding,
    processNFCScan, setPendingNfcWrite, updatePlant,
    pendingConfirm, confirmPendingWater, cancelPendingWater,
    lastWaterAction, undoLastWater, clearLastWaterAction,
    errorSheet, setErrorSheet,
  } = useStore()

  // Full-screen NFC moment animation (when user successfully scans paired tag)
  const [nfcMomentPlant, setNfcMomentPlant] = useState<Plant | null>(null)
  const [nfcMomentAmount, setNfcMomentAmount] = useState<number | undefined>(undefined)
  // Amount picker — when settings.watering.confirmAmountOnScan is on
  const [amountSheetPlant, setAmountSheetPlant] = useState<Plant | null>(null)
  // Blank-tag chooser — when a tag has no plant id payload, or an unknown one
  const [blankTagOpen, setBlankTagOpen] = useState(false)
  // Why the chooser opened: 'blank' = no payload; 'unknown' = stale plant_id.
  const [blankTagKind, setBlankTagKind] = useState<'blank' | 'unknown'>('blank')
  // PairTagOverlay state — opened by the BlankTagSheet plant picker
  const [pairOverlayPlant, setPairOverlayPlant] = useState<Plant | null>(null)
  // NFC scan dedup: a single physical scan can fire several onRead events.
  // These guard the blank-tag chooser against an empty message that arrives
  // alongside (or just before) the real plant_id message.
  const blankTagTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKnownScanAt = useRef(0)

  useEffect(() => {
    load()
  }, [load])

  // Deep link: outflourish://water?id=plant_123  (also accepts plantcare://)
  useEffect(() => {
    const handle = CapApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url)
        if (parsed.hostname === 'water') {
          const id = parsed.searchParams.get('id')
          if (id) handleNfcScan(id)
        }
      } catch { /* malformed URL */ }
    })
    return () => { handle.then(h => h.remove()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Local notification tap → navigate to plant detail
  useEffect(() => {
    const handle = LocalNotifications.addListener('localNotificationActionPerformed', action => {
      const plantId = (action.notification.extra as { plantId?: string })?.plantId
      if (plantId) router.navigate(`/plant/${plantId}`)
    })
    return () => { handle.then(h => h.remove()) }
  }, [])

  // NFC: subscribe to read events for the lifetime of the app.
  // We do NOT auto-start a scan session — iOS requires explicit user gesture
  // (a tap on the floating "Hold to a plant tag" pill triggers startScan).
  useEffect(() => {
    const unsubRead = NFC.onRead(data => {
      const msgs = data.numberArray().messages
      let plantId: string | null = null
      for (const msg of msgs) {
        for (const record of msg.records) {
          plantId = parsePlantIdFromNdefPayload(record.payload)
          if (plantId) break
        }
        if (plantId) break
      }
      if (plantId) {
        // Known tag → straight to watering. A single scan can arrive as
        // MULTIPLE onRead events (an empty capability/NDEF message before the
        // real plant_id message). The empty one parses to null and would open
        // the blank-tag chooser, so a known read must cancel any pending or
        // already-open blank-tag UI and record the time so a stray late empty
        // read does not re-open it.
        lastKnownScanAt.current = Date.now()
        if (blankTagTimer.current) {
          clearTimeout(blankTagTimer.current)
          blankTagTimer.current = null
        }
        setBlankTagOpen(false)
        handleNfcScan(plantId)
      } else {
        // No plant_id in this message. It may just precede the real one in a
        // multi-message read, so defer the blank-tag chooser briefly; a known
        // read in the window cancels it. Also skip if a known tag was handled
        // moments ago (stray trailing empty read from the same scan).
        if (Date.now() - lastKnownScanAt.current < 1500) return
        if (blankTagTimer.current) clearTimeout(blankTagTimer.current)
        blankTagTimer.current = setTimeout(() => {
          blankTagTimer.current = null
          if (Date.now() - lastKnownScanAt.current < 1500) return
          setBlankTagKind('blank')
          setBlankTagOpen(true)
        }, 450)
      }
      // Same reflow nudge as onError below.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 120)
    })
    const unsubError = NFC.onError(err => {
      console.warn('[NFC] error:', err.error)
      // Force a layout reflow: iOS sometimes leaves the WKWebView with a
      // stale safe-area state after the NFC scan sheet dismisses, exposing
      // the WKWebView background. Dispatching resize prompts the browser
      // to recompute dvh / env() values.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 120)
    })
    return () => {
      unsubRead()
      unsubError()
      if (blankTagTimer.current) clearTimeout(blankTagTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Decide whether a paired-tag scan opens the NFC moment animation OR the
  // already-watered overlay. processNFCScan handles the <12h logic.
  function handleNfcScan(plantId: string) {
    const state = useStore.getState()
    const plant = state.plants.find(p => p.id === plantId)
    if (!plant) {
      // Tag has a plant_id that no longer matches any plant (e.g. paired before
      // an app reset). Skip the error sheet and go straight to the chooser so
      // the tag can be re-paired or used for a new plant.
      setBlankTagKind('unknown')
      setBlankTagOpen(true)
      return
    }
    const lastWatered = plant.history
      .filter(e => e.type === 'water')
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
    if (lastWatered && Date.now() - lastWatered < 12 * 3_600_000) {
      processNFCScan(plantId)
      return
    }
    // Optional amount confirmation step before the moment plays
    if (state.settings.watering.confirmAmountOnScan) {
      setAmountSheetPlant(plant)
    } else {
      // Silent path — moment animation logs the default recommendedMl
      setNfcMomentAmount(undefined)
      setNfcMomentPlant(plant)
    }
  }

  const confirmPlant = pendingConfirm
    ? plants.find(p => p.id === pendingConfirm.plantId)
    : null

  return (
    <>
      <RouterProvider router={router} />

      {/* Onboarding — first launch only */}
      {isLoaded && !settings.onboardingComplete && (
        <Suspense fallback={<RouteFallback />}>
          <Onboarding onFinish={async ({ hemisphere, region, intent }) => {
            await completeOnboarding({ hemisphere, region })
            // Reset can be triggered from any screen (e.g. Settings), so the
            // router may still be on that route under the overlay. Navigate
            // explicitly: the final CTA opens Add Plant, Skip goes home.
            router.navigate(intent === 'add' ? '/add' : '/')
          }} />
        </Suspense>
      )}

      {/* Already-watered confirmation */}
      {pendingConfirm && confirmPlant && (
        <AlreadyWateredSheet
          plant={confirmPlant}
          hoursAgo={pendingConfirm.hoursAgo}
          onConfirm={confirmPendingWater}
          onCancel={cancelPendingWater}
        />
      )}

      {/* Per-scan amount picker (only when settings.watering.confirmAmountOnScan is on) */}
      {amountSheetPlant && (
        <AmountOnScanSheet
          plant={amountSheetPlant}
          onContinue={(ml) => {
            const p = amountSheetPlant
            setAmountSheetPlant(null)
            setNfcMomentAmount(ml)
            setNfcMomentPlant(p)
          }}
          onCancel={() => setAmountSheetPlant(null)}
        />
      )}

      {/* NFC moment — full-screen reveal + watering animation */}
      {nfcMomentPlant && (
        <NfcMoment
          plant={nfcMomentPlant}
          amountMl={nfcMomentAmount}
          onComplete={() => {
            const id = nfcMomentPlant.id
            setNfcMomentPlant(null)
            setNfcMomentAmount(undefined)
            router.navigate(`/plant/${id}`)
          }}
        />
      )}

      {/* Blank tag chooser — pair to existing or add new */}
      {blankTagOpen && (
        <BlankTagSheet
          plants={plants}
          kind={blankTagKind}
          onPairExisting={(plant) => {
            // Close the bottom sheet, then open the top-anchored
            // PairTagOverlay which actually fires the NFC write.
            setBlankTagOpen(false)
            setPairOverlayPlant(plant)
          }}
          onCreateNew={() => {
            setBlankTagOpen(false)
            setPendingNfcWrite(true)
            router.navigate('/add')
          }}
          onCancel={() => setBlankTagOpen(false)}
        />
      )}

      {/* Pair tag overlay — top-anchored instructions while NFC writes */}
      {pairOverlayPlant && (
        <PairTagOverlay
          plant={pairOverlayPlant}
          onComplete={async (success) => {
            const plant = pairOverlayPlant
            setPairOverlayPlant(null)
            if (!plant) return
            if (success) {
              await updatePlant(plant.id, { nfcTagId: plant.id, nfcPairedAt: Date.now() })
              router.navigate(`/plant/${plant.id}`)
            } else {
              setErrorSheet('tag-write-failed')
            }
          }}
        />
      )}

      {/* Error sheet — NFC + upload failures */}
      {errorSheet && (
        <ErrorSheet
          kind={errorSheet}
          onDismiss={() => setErrorSheet(null)}
          onPrimary={() => {
            const kind = errorSheet
            setErrorSheet(null)
            if (kind === 'tag-unknown' || kind === 'tag-write-failed') {
              setPendingNfcWrite(true)
              router.navigate('/add')
            }
            // 'nfc-unavailable' just dismisses
            // 'upload-failed' caller passes its own handler — this fallback dismisses
          }}
          onSecondary={() => {
            const kind = errorSheet
            setErrorSheet(null)
            // 'tag-unknown' secondary = "Pair existing" → open the plant picker,
            // which rewrites this tag with the chosen plant's id.
            if (kind === 'tag-unknown') { setBlankTagKind('unknown'); setBlankTagOpen(true) }
            // 'tag-write-failed' secondary = "Skip pairing" — just dismiss
            // 'upload-failed' secondary = "Use stock" — just dismiss
          }}
        />
      )}

      {/* Watering-logged toast with undo */}
      {lastWaterAction && (
        <Toast
          kicker={`Logged · ${new Date(lastWaterAction.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`}
          message={`${lastWaterAction.plantName} got ${lastWaterAction.amountMl} ml.`}
          onUndo={async () => { await undoLastWater() }}
          onDismiss={clearLastWaterAction}
        />
      )}
    </>
  )
}

