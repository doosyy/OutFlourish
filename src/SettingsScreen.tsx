// SettingsScreen — neutral, system voice.
// Collection summary + 6 groups (Reminders / Watering / Rooms / Season /
// Household / Data) + About footer.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share } from '@capacitor/share'
import { useStore, Repository } from './store'
import { PCT } from './tokens'
import { TopBar, Toggle, Pill } from './components/UI'
import { ChevronGlyph, LeafGlyph } from './components/Glyphs'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { plants, rooms, settings, updateSettings, exportData, importData } = useStore()
  const [lastExportAt, setLastExportAt] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { Repository.getLastExportAt().then(setLastExportAt) }, [])

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

  const fmtBackup = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 30) return `${days} days ago`
    return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const seasonNow = (() => {
    const m = new Date().getMonth() + 1
    const southern = settings.season.hemisphere === 'Southern'
    if (m === 12 || m <= 2) return southern ? 'High summer' : 'Deep winter'
    if (m <= 4) return southern ? 'Early autumn' : 'Spring'
    if (m === 5) return southern ? 'Late autumn' : 'Late spring'
    if (m <= 7) return southern ? 'Deep winter' : 'High summer'
    if (m === 8) return southern ? 'Late winter' : 'Late summer'
    if (m <= 10) return southern ? 'Spring' : 'Early autumn'
    return southern ? 'Late spring' : 'Late autumn'
  })()

  return (
    <div className="min-h-screen relative" style={{
      background: PCT.cream, color: PCT.ink, paddingBottom: 110,
    }}>
      <TopBar title="Settings" onBack={() => navigate(-1)} />

      {toast && (
        <div
          className="fixed left-5.5 right-5.5 z-40 animate-toast-in"
          style={{
            bottom: 'max(40px, var(--sab))',
            background: PCT.ink, color: PCT.cream,
            padding: '14px 18px',
            borderRadius: 22,
            boxShadow: '0 18px 36px rgba(58,30,18,0.4)',
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16,
            maxWidth: 480, margin: '0 auto',
          }}
        >
          {toast}
        </div>
      )}

      {/* Collection summary */}
      <div className="px-5.5 pt-1.5 pb-6">
        <div className="flex items-center gap-4" style={{
          padding: '18px 20px',
          background: PCT.paper,
          border: `1px solid ${PCT.ink}10`,
          borderRadius: 22,
        }}>
          <div className="flex items-center justify-center flex-shrink-0" style={{
            width: 56, height: 56, borderRadius: 16,
            background: PCT.terracottaSoft,
          }}>
            <LeafGlyph color={PCT.terracottaDeep} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: PCT.inkFaint,
            }}>Your collection</div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 28, lineHeight: 1.0, color: PCT.ink, marginTop: 2,
            }}>{plants.length} plants · {rooms.length} rooms</div>
            <div className="mt-1" style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 10, letterSpacing: 1.5, color: PCT.inkFaint,
            }}>
              {lastExportAt ? `Last backed up · ${fmtBackup(lastExportAt)}` : 'Never backed up'}
            </div>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <Group title="Reminders">
        <Row label="Daily reminders" hint="A gentle nudge each morning."
          control={<Toggle on={settings.reminders.enabled}
            onChange={v => updateSettings({ reminders: { ...settings.reminders, enabled: v } })} />} />
        <Row label="Reminder time" hint="When the badge appears."
          control={<Pill>{prettyTime(settings.reminders.timeOfDay)}</Pill>} />
        <Row label="Quiet hours" hint="No notifications between."
          control={<Pill>
            {prettyTime(settings.reminders.quietHours.start)} – {prettyTime(settings.reminders.quietHours.end)}
          </Pill>} />
        <Row label="Snooze interval" hint="Postpone a reminder by…"
          control={<Pill>{settings.reminders.snoozeHours} hrs</Pill>} />
      </Group>

      {/* Watering */}
      <Group title="Watering">
        <Row label="Default unit" hint="How water amounts appear across the app."
          control={<Pill>{settings.watering.defaultUnit === 'ml' ? 'Millilitres' : 'Fluid ounces'}</Pill>} />
        <Row label="Drainage reminder" hint="Tip shown in the watering sheet."
          control={<Toggle on={settings.watering.drainageReminder}
            onChange={v => updateSettings({ watering: { ...settings.watering, drainageReminder: v } })} />} />
        <Row label="Seasonal dosing" hint="Dial back ~30% in winter automatically."
          control={<Toggle on={settings.watering.seasonalDosing}
            onChange={v => updateSettings({ watering: { ...settings.watering, seasonalDosing: v } })} />} />
      </Group>

      {/* Rooms */}
      <Group title="Rooms">
        <Row label="Manage rooms" hint={`${rooms.length} room${rooms.length !== 1 ? 's' : ''}. Light tags affect watering intervals.`}
          chevron control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <Row label="Group home by room" hint="Plants stack under their room name."
          control={<Toggle on={settings.rooms.groupHomeByRoom}
            onChange={v => updateSettings({ rooms: { ...settings.rooms, groupHomeByRoom: v } })} />} />
        <Row label="Light-aware care" hint="Reduce frequency in low-light rooms."
          control={<Toggle on={settings.rooms.lightAwareCare}
            onChange={v => updateSettings({ rooms: { ...settings.rooms, lightAwareCare: v } })} />} />
      </Group>

      {/* Season */}
      <Group title="Season">
        <Row label="Hemisphere" hint="Adjusts watering intervals by season."
          control={<Pill>{settings.season.hemisphere}</Pill>} />
        <Row label="Region" hint="Used for season detection."
          control={<Pill>{settings.season.region}</Pill>} />
        <Row label="Current season" hint="Auto-detected from date."
          control={<Pill subtle>{seasonNow}</Pill>} />
      </Group>

      {/* Household */}
      <Group title="Household">
        <Row label="Pet mode" hint="Surface toxicity warnings prominently on plant detail."
          control={<Toggle on={settings.household.petMode}
            onChange={v => updateSettings({ household: { ...settings.household, petMode: v } })} />} />
        <Row label="Child mode" hint="Adds warnings for children-toxic species."
          control={<Toggle on={settings.household.childMode}
            onChange={v => updateSettings({ household: { ...settings.household, childMode: v } })} />} />
        <Row label="Pets in house" hint="Helps tailor warnings."
          control={<Pill>{settings.household.pets || 'None'}</Pill>} />
      </Group>

      {/* Data */}
      <Group title="Data">
        <Row label="Export backup" hint="JSON file with all plants, rooms, history & settings."
          chevron onClick={handleExport}
          control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <Row label="Import backup" hint="Restore on a new device."
          chevron onClick={() => fileRef.current?.click()}
          control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <Row label="Clear all data" hint="Permanently remove every plant."
          tone="danger" chevron
          control={<ChevronGlyph color={PCT.thirsty} size={16} />} />
      </Group>

      {/* About */}
      <Group title="About">
        <Row label="Version" control={<Plain>1.0.0 · Phase 3</Plain>} />
        <Row label="Made in" control={<Plain>Carlton North, Melbourne</Plain>} />
        <Row label="Privacy" chevron onClick={() => navigate('/privacy')}
          control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <Row label="Send feedback" chevron control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
      </Group>

      {/* Footer */}
      <div className="text-center px-5.5" style={{
        paddingTop: 32,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
      }}>
        A quiet little app for a thirsty little household.
      </div>
    </div>
  )
}

// ─── SettingsGroup / Row / Plain ────────────────────────────────────────────
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="px-5.5 pb-2.5" style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
        color: PCT.terracotta,
      }}>{title}</div>
      <div className="mx-5.5 overflow-hidden" style={{
        background: PCT.paper,
        border: `1px solid ${PCT.ink}10`,
        borderRadius: 22,
      }}>
        {children}
      </div>
    </div>
  )
}

interface RowProps {
  label: string
  hint?: string
  control: React.ReactNode
  chevron?: boolean
  tone?: 'danger'
  onClick?: () => void
}
function Row({ label, hint, control, chevron, tone, onClick }: RowProps) {
  const labelColor = tone === 'danger' ? PCT.thirsty : PCT.ink
  const Component = chevron || onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left"
      style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${PCT.ink}10`,
        background: 'transparent',
      }}
    >
      <div className="flex-1 min-w-0">
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 18, lineHeight: 1.15,
          color: labelColor,
        }}>{label}</div>
        {hint && (
          <div className="mt-0.5" style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 13, color: PCT.inkFaint, lineHeight: 1.35,
          }}>{hint}</div>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </Component>
  )
}

function Plain({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'ui-monospace, "SF Mono", monospace',
      fontSize: 11, color: PCT.inkSoft, letterSpacing: 0.5,
    }}>{children}</span>
  )
}

function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10))
  const isAm = h < 12
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${isAm ? 'am' : 'pm'}`
}
