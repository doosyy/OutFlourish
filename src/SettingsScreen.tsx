// Phase 2 placeholder — Phase 3 rewrites with the 6 SettingsGroup sections,
// Pills, Toggles, and the editorial collection summary card.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share } from '@capacitor/share'
import { useStore, Repository } from './store'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { plants, rooms, exportData, importData } = useStore()
  const [lastExportAt, setLastExportAt] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Repository.getLastExportAt().then(setLastExportAt)
  }, [])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleExport = async () => {
    try {
      const json = await exportData()
      setLastExportAt(Date.now())
      const canShare = (await Share.canShare()).value
      if (canShare) {
        await Share.share({ title: 'OutFlourish backup', text: json, dialogTitle: 'Export plant data' })
        flash('Backup exported.')
      } else {
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `outflourish-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        flash('Backup downloaded.')
      }
    } catch {
      flash('Export failed.')
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        await importData(evt.target?.result as string)
        flash(`Import complete — ${plants.length} plants restored.`)
      } catch {
        flash('Import failed — invalid backup file.')
      }
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="min-h-screen px-6 pb-12" style={{ paddingTop: 'max(56px, var(--sat))' }}>
      <button onClick={() => navigate(-1)} className="font-display italic text-ink-soft mb-4">← Back</button>
      <h1 className="font-display italic text-3xl text-ink tracking-tighter mb-6">
        Phase 2 stub · Settings
      </h1>

      {toast && (
        <div className="mb-4 px-4 py-3 bg-paper border border-ink/10 rounded-card font-display italic text-sm">
          {toast}
        </div>
      )}

      <div className="p-5 bg-paper border border-ink/10 rounded-card mb-6">
        <div className="font-mono text-[10px] tracking-eyebrowLg uppercase text-ink-faint">Your collection</div>
        <div className="font-display text-3xl text-ink mt-1">{plants.length} plants · {rooms.length} rooms</div>
        <div className="font-mono text-[10px] tracking-wider text-ink-faint mt-2">
          {lastExportAt ? `Last backed up · ${fmtDate(lastExportAt)}` : 'Never backed up'}
        </div>
      </div>

      <div className="space-y-3 mb-12">
        <button onClick={handleExport}
          disabled={plants.length === 0}
          className="w-full py-4 bg-paper border border-ink/10 rounded-card font-display italic text-lg disabled:opacity-40">
          Export backup
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-4 bg-paper border border-ink/10 rounded-card font-display italic text-lg">
          Import backup
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      <p className="text-center font-display italic text-sm text-ink-faint">
        A quiet little app for a thirsty little household.
      </p>
    </div>
  )
}
