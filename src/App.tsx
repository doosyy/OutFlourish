import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useStore } from './store'
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
  const { load, processNFCScan, setPendingNfcWrite, pendingConfirm, confirmPendingWater, cancelPendingWater } =
    useStore()

  useEffect(() => {
    load()
  }, [load])

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

      {/* Already-watered confirmation — placeholder until Phase 3 builds the AlreadyWateredSheet */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm animate-toast-in"
          style={{ paddingBottom: 'var(--sab)' }}
        >
          <div className="w-full max-w-lg bg-cream rounded-t-sheet p-7 shadow-sheet animate-sheet-up">
            <div className="w-12 h-1 bg-ink/20 rounded-full mx-auto mb-5" />
            <h2 className="font-display text-3xl text-ink mb-3 tracking-tighter">Already watered recently</h2>
            <p className="font-body text-ink-soft mb-6 leading-relaxed">
              This plant had a drink{' '}
              <span className="text-terracotta-deep italic font-display">{pendingConfirm.hoursAgo} hours ago</span>.
              {' '}Log another watering anyway?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelPendingWater}
                className="flex-1 py-4 rounded-btn bg-paper text-ink-soft font-display italic text-lg"
              >
                Never mind
              </button>
              <button
                onClick={confirmPendingWater}
                className="flex-1 py-4 rounded-btn bg-terracotta text-cream font-display italic text-lg shadow-cta-sm"
              >
                Log anyway
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
