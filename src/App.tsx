import { useEffect, useState } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { NFC } from '@exxili/capacitor-nfc'
import { useStore, type Plant } from './store'
import HomeScreen from './HomeScreen'
import PlantDetail from './PlantDetail'
import AddPlantScreen from './AddPlantScreen'
import SettingsScreen from './SettingsScreen'
import PrivacyPolicy from './PrivacyPolicy'
import ManageRoomsScreen from './ManageRoomsScreen'
import Onboarding from './Onboarding'
import NfcMoment from './NfcMoment'
import { AlreadyWateredSheet, Toast, ErrorSheet } from './sheets'

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
  { path: '/add', element: <AddPlantScreen /> },
  { path: '/settings', element: <SettingsScreen /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/rooms', element: <ManageRoomsScreen /> },
])

export default function App() {
  const {
    load, plants, settings, isLoaded, completeOnboarding,
    processNFCScan, setPendingNfcWrite,
    pendingConfirm, confirmPendingWater, cancelPendingWater,
    lastWaterAction, undoLastWater, clearLastWaterAction,
    errorSheet, setErrorSheet,
  } = useStore()

  // Full-screen NFC moment animation (when user successfully scans paired tag)
  const [nfcMomentPlant, setNfcMomentPlant] = useState<Plant | null>(null)

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
        // Tag had no plant_id payload — unknown tag, offer pair flow
        setErrorSheet('tag-unknown')
      }
    })
    const unsubError = NFC.onError(err => {
      console.warn('[NFC] error:', err.error)
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
    const plant = useStore.getState().plants.find(p => p.id === plantId)
    if (!plant) {
      setErrorSheet('tag-unknown')
      return
    }
    const lastWatered = plant.history
      .filter(e => e.type === 'water')
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
    if (lastWatered && Date.now() - lastWatered < 12 * 3_600_000) {
      processNFCScan(plantId)
    } else {
      // Long-form moment — auto-logs during the watering phase
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
        <Onboarding onFinish={async ({ hemisphere, region }) => {
          await completeOnboarding({ hemisphere, region })
        }} />
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

      {/* NFC moment — full-screen reveal + watering animation */}
      {nfcMomentPlant && (
        <NfcMoment
          plant={nfcMomentPlant}
          onComplete={() => {
            setNfcMomentPlant(null)
            router.navigate(`/plant/${nfcMomentPlant.id}`)
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

