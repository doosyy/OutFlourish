import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share } from '@capacitor/share'
import { usePlantStore, PlantRepository } from './store'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { plants, exportData, importData } = usePlantStore()
  const [lastExportAt, setLastExportAt] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    PlantRepository.getLastExportAt().then(setLastExportAt)
  }, [])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleExport = async () => {
    try {
      const json = await exportData()
      setLastExportAt(Date.now())
      const canShare = (await Share.canShare()).value
      if (canShare) {
        await Share.share({
          title: 'PlantCare Backup',
          text: json,
          dialogTitle: 'Export plant data',
        })
        showToast('Backup exported!', true)
      } else {
        // Browser fallback: download as file
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `plantcare-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        showToast('Backup downloaded!', true)
      }
    } catch (err) {
      showToast('Export failed', false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async evt => {
      try {
        const json = evt.target?.result as string
        await importData(json)
        showToast(`Import complete — ${plants.length} plants restored!`, true)
      } catch {
        showToast('Import failed — invalid backup file', false)
      }
      // Reset file input
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div
      className="min-h-screen bg-stone-950 px-4 pb-8"
      style={{ paddingTop: 'max(16px, var(--sat))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 text-xl active:scale-90 transition-transform"
          aria-label="Back"
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-stone-50">Settings</h1>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all
          ${toast.ok ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Data summary */}
      <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800 mb-5">
        <p className="text-stone-400 text-sm font-medium mb-1">Your Collection</p>
        <p className="text-stone-50 text-2xl font-bold">{plants.length} plant{plants.length !== 1 ? 's' : ''}</p>
        {lastExportAt ? (
          <p className="text-stone-500 text-xs mt-1">Last backed up: {formatDate(lastExportAt)}</p>
        ) : (
          <p className="text-stone-600 text-xs mt-1">Never backed up</p>
        )}
      </div>

      {/* Backup section */}
      <div className="mb-5">
        <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Data Backup</h2>
        <p className="text-stone-500 text-sm mb-4">
          Export all your plants and watering history as a JSON file.
          Import to restore your collection on a new device.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={plants.length === 0}
            className="w-full py-4 bg-stone-800 rounded-2xl text-stone-200 font-semibold text-base
                       active:scale-[0.97] transition-transform disabled:opacity-40
                       flex items-center justify-center gap-3"
          >
            <span className="text-xl">📤</span>
            Export Backup
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-4 bg-stone-800 rounded-2xl text-stone-200 font-semibold text-base
                       active:scale-[0.97] transition-transform
                       flex items-center justify-center gap-3"
          >
            <span className="text-xl">📥</span>
            Import Backup
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* About */}
      <div className="border-t border-stone-800 pt-5">
        <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">About</h2>
        <div className="space-y-2 text-stone-500 text-sm">
          <p>🌿 PlantCare v1.0.0</p>
          <p>📍 Season calculations optimised for Melbourne, Australia</p>
          <p>🌱 {import.meta.env.DEV ? 'Development build' : 'Production build'}</p>
        </div>
      </div>
    </div>
  )
}
