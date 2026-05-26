import { useEffect, useState, lazy, Suspense } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { NFC } from '@exxili/capacitor-nfc'
import { useStore, type Plant } from './store'
import { PCT } from './tokens'
import HomeScreen from './HomeScreen'
import PlantDetail from './PlantDetail'
import NfcMoment from './NfcMoment'
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
  // Blank-tag chooser — when a tag has no plant id payload
  const [blankTagOpen, setBlankTagOpen] = useState(false)

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
        handleNfcScan(plantId)
      } else {
        // Tag had no plant_id payload — open the blank-tag chooser
        setBlankTagOpen(true)
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Decide whether a paired-tag scan opens the NFC moment animation OR the
  // already-watered overlay. processNFCScan handles the <12h logic.
  function handleNfcScan(plantId: string) {
    const state = useStore.getState()
    const plant = state.plants.find(p => p.id === plantId)
    if (!plant) {
      setErrorSheet('tag-unknown')
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
          <Onboarding onFinish={async ({ hemisphere, region }) => {
            await completeOnboarding({ hemisphere, region })
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
          onPairExisting={async (plant) => {
            await updatePlant(plant.id, { nfcTagId: plant.id, nfcPairedAt: Date.now() })
            setBlankTagOpen(false)
            router.navigate(`/plant/${plant.id}`)
          }}
          onCreateNew={() => {
            setBlankTagOpen(false)
            setPendingNfcWrite(true)
            router.navigate('/add')
          }}
          onCancel={() => setBlankTagOpen(false)}
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
            setErrorSheet(null)
            // 'tag-unknown' secondary = "Pair existing" — TODO future picker
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

