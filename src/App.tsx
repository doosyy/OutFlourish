import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { usePlantStore } from './store'
import HomeScreen from './HomeScreen'
import PlantDetail from './PlantDetail'
import AddPlantScreen from './AddPlantScreen'
import SettingsScreen from './SettingsScreen'

// NFC is sponsorware — import dynamically to avoid build errors if not installed
// Replace with: import { Nfc, NfcUtils } from '@capawesome-team/capacitor-nfc'
let Nfc: { addListener: Function; startScanSession: Function; stopScanSession: Function } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Nfc = require('@capawesome-team/capacitor-nfc').Nfc
} catch {
  // NFC plugin not installed — NFC features disabled
}

// Decode NDEF Text record payload (skip language code prefix)
function parsePlantIdFromNdefPayload(payload: number[]): string | null {
  if (!payload || payload.length < 3) return null
  const langCodeLen = payload[0] & 0x3f
  const textBytes = payload.slice(1 + langCodeLen)
  const text = new TextDecoder('utf-8').decode(new Uint8Array(textBytes))
  return /^plant_\d+$/.test(text) ? text : null
}

let nfcSessionActive = false

const router = createHashRouter([
  { path: '/', element: <HomeScreen /> },
  { path: '/plant/:id', element: <PlantDetail /> },
  { path: '/add', element: <AddPlantScreen /> },
  { path: '/settings', element: <SettingsScreen /> },
])

export default function App() {
  const { loadPlants, processNFCScan, setPendingNfcWrite, pendingConfirm, confirmPendingWater, cancelPendingWater } =
    usePlantStore()

  useEffect(() => {
    loadPlants()
  }, [loadPlants])

  // Deep link: plantcare://water?id=plant_123
  useEffect(() => {
    const handle = CapApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url)
        if (parsed.hostname === 'water') {
          const id = parsed.searchParams.get('id')
          if (id) processNFCScan(id)
        }
      } catch { /* malformed URL */ }
    })
    return () => { handle.then(h => h.remove()) }
  }, [processNFCScan])

  // Local notification tap → navigate to plant detail
  useEffect(() => {
    const handle = LocalNotifications.addListener('localNotificationActionPerformed', action => {
      const plantId = (action.notification.extra as { plantId?: string })?.plantId
      if (plantId) router.navigate(`/plant/${plantId}`)
    })
    return () => { handle.then(h => h.remove()) }
  }, [])

  // NFC session
  useEffect(() => {
    if (!Nfc) return
    let listenerHandle: { remove: () => Promise<void> } | null = null

    const setup = async () => {
      try {
        listenerHandle = await Nfc!.addListener('nfcTagScanned', async (event: { nfcTag: { message?: { records?: Array<{ payload: number[] }> } } }) => {
          const records = event.nfcTag.message?.records ?? []
          let handled = false
          for (const record of records) {
            const plantId = parsePlantIdFromNdefPayload(Array.from(record.payload as unknown as ArrayLike<number>))
            if (plantId) {
              processNFCScan(plantId)
              handled = true
              break
            }
          }
          if (!handled) {
            // Unlinked tag → go to add plant flow
            setPendingNfcWrite(true)
            router.navigate('/add')
          }
          // Restart session for next scan
          nfcSessionActive = false
          try {
            await Nfc!.stopScanSession()
          } catch { /* already stopped */ }
          await startNfcSession()
        })
        await startNfcSession()
      } catch { /* NFC not available */ }
    }

    setup()
    return () => {
      listenerHandle?.remove()
      if (Nfc && nfcSessionActive) {
        Nfc.stopScanSession().catch(() => {})
        nfcSessionActive = false
      }
    }
  }, [processNFCScan, setPendingNfcWrite])

  return (
    <>
      <RouterProvider router={router} />

      {/* Confirmation modal — bottom sheet */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          style={{ paddingBottom: 'var(--sab)' }}
        >
          <div className="w-full max-w-lg bg-stone-900 rounded-t-3xl p-6 shadow-2xl border-t border-stone-700">
            <div className="w-12 h-1.5 bg-stone-600 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-stone-50 mb-2">Already watered recently</h2>
            <p className="text-stone-400 mb-6">
              This plant was watered{' '}
              <span className="text-amber-400 font-semibold">{pendingConfirm.hoursAgo}h ago</span>.
              {' '}Log another watering entry anyway?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelPendingWater}
                className="flex-1 py-3 rounded-2xl bg-stone-800 text-stone-300 font-semibold text-base active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={confirmPendingWater}
                className="flex-1 py-3 rounded-2xl bg-green-500 text-white font-semibold text-base active:scale-95 transition-transform"
              >
                Log Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

async function startNfcSession() {
  if (!Nfc || nfcSessionActive) return
  try {
    await Nfc.startScanSession()
    nfcSessionActive = true
  } catch { /* not available */ }
}
