// SettingsScreen — neutral, system voice.
// Collection summary + 6 groups (Reminders / Watering / Rooms / Season /
// Household / Data) + About footer.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share } from '@capacitor/share'
import { useStore, Repository } from './store'
import { PCT } from './tokens'
import { TopBar, Toggle, Pill } from './components/UI'
import { ChevronGlyph, LeafGlyph, NFCGlyph } from './components/Glyphs'
import NfcMoment from './NfcMoment'

// ─── Picker sheet state ──────────────────────────────────────────────────────
type PickerKind =
  | 'reminderTime'
  | 'quietStart'
  | 'quietEnd'
  | 'snooze'
  | 'unit'
  | 'hemisphere'
  | 'region'
  | 'pets'
  | 'clearData'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { plants, rooms, settings, updateSettings, exportData, importData } = useStore()
  const [lastExportAt, setLastExportAt] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [nfcPreview, setNfcPreview] = useState(false)
  const [picker, setPicker] = useState<PickerKind | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { Repository.getLastExportAt().then(setLastExportAt) }, [])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const closePicker = () => setPicker(null)

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
        const restoredCount = useStore.getState().plants.length
        flash(`Import complete — ${restoredCount} plants restored.`)
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
            }}>{plants.length} plant{plants.length !== 1 ? 's' : ''} · {rooms.length} room{rooms.length !== 1 ? 's' : ''}</div>
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
        <Row label="Reminder time" hint="When the badge appears." chevron
          onClick={() => setPicker('reminderTime')}
          control={<Pill>{prettyTime(settings.reminders.timeOfDay)}</Pill>} />
        <Row label="Quiet hours" hint="No notifications between." chevron
          onClick={() => setPicker('quietStart')}
          control={<Pill>
            {prettyTime(settings.reminders.quietHours.start)} – {prettyTime(settings.reminders.quietHours.end)}
          </Pill>} />
        <Row label="Snooze interval" hint="Postpone a reminder by…" chevron
          onClick={() => setPicker('snooze')}
          control={<Pill>{settings.reminders.snoozeHours} hrs</Pill>} />
      </Group>

      {/* Watering */}
      <Group title="Watering">
        <Row label="Default unit" hint="How water amounts appear across the app." chevron
          onClick={() => setPicker('unit')}
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
          chevron onClick={() => navigate('/rooms')}
          control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <Row label="Group home by room" hint="Plants stack under their room name."
          control={<Toggle on={settings.rooms.groupHomeByRoom}
            onChange={v => updateSettings({ rooms: { ...settings.rooms, groupHomeByRoom: v } })} />} />
        <Row label="Light-aware care" hint="Reduce frequency in low-light rooms."
          control={<Toggle on={settings.rooms.lightAwareCare}
            onChange={v => updateSettings({ rooms: { ...settings.rooms, lightAwareCare: v } })} />} />
      </Group>

      {/* Season */}
      <Group title="Season">
        <Row label="Hemisphere" hint="Adjusts watering intervals by season." chevron
          onClick={() => setPicker('hemisphere')}
          control={<Pill>{settings.season.hemisphere}</Pill>} />
        <Row label="Region" hint="Used for season detection." chevron
          onClick={() => setPicker('region')}
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
        <Row label="Pets in house" hint="Helps tailor warnings." chevron
          onClick={() => setPicker('pets')}
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
          tone="danger" chevron onClick={() => setPicker('clearData')}
          control={<ChevronGlyph color={PCT.thirsty} size={16} />} />
      </Group>

      {/* About */}
      <Group title="About">
        <Row label="Version" control={<Plain>1.0.0 · Phase 4</Plain>} />
        <Row label="Made in" control={<Plain>Carlton North, Melbourne</Plain>} />
        <Row label="Privacy" chevron onClick={() => navigate('/privacy')}
          control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        <Row label="Send feedback" chevron control={<ChevronGlyph color={PCT.inkFaint} size={16} />} />
        {plants.length > 0 && (
          <Row
            label="Preview NFC moment"
            hint="Play the watering animation against your first plant."
            chevron
            onClick={() => setNfcPreview(true)}
            control={<NFCGlyph color={PCT.terracottaDeep} size={16} />}
          />
        )}
      </Group>

      {/* NFC moment preview overlay (debug) */}
      {nfcPreview && plants[0] && (
        <NfcMoment plant={plants[0]} onComplete={() => setNfcPreview(false)} />
      )}

      {/* Footer */}
      <div className="text-center px-5.5" style={{
        paddingTop: 32,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
      }}>
        A quiet little app for a thirsty little household.
      </div>

      {/* ── Picker sheets ─────────────────────────────────────────────────── */}

      {picker === 'reminderTime' && (
        <TimePickerSheet
          title="Reminder time"
          hint="When the daily reminder badge appears."
          value={settings.reminders.timeOfDay}
          onSave={v => { updateSettings({ reminders: { ...settings.reminders, timeOfDay: v } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'quietStart' && (
        <QuietHoursSheet
          start={settings.reminders.quietHours.start}
          end={settings.reminders.quietHours.end}
          onSave={(start, end) => {
            updateSettings({ reminders: { ...settings.reminders, quietHours: { start, end } } })
            closePicker()
          }}
          onCancel={closePicker}
        />
      )}

      {picker === 'snooze' && (
        <StepperSheet
          title="Snooze interval"
          hint="How long to postpone a reminder."
          value={settings.reminders.snoozeHours}
          min={1} max={24} unit="hrs"
          onSave={v => { updateSettings({ reminders: { ...settings.reminders, snoozeHours: v } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'unit' && (
        <SegmentSheet
          title="Default unit"
          hint="How water amounts are shown across the app."
          options={[
            { value: 'ml', label: 'Millilitres' },
            { value: 'oz', label: 'Fluid ounces' },
          ]}
          value={settings.watering.defaultUnit}
          onSave={v => { updateSettings({ watering: { ...settings.watering, defaultUnit: v as 'ml' | 'oz' } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'hemisphere' && (
        <SegmentSheet
          title="Hemisphere"
          hint="Adjusts the season multiplier for watering intervals."
          options={[
            { value: 'Southern', label: 'Southern' },
            { value: 'Northern', label: 'Northern' },
          ]}
          value={settings.season.hemisphere}
          onSave={v => { updateSettings({ season: { ...settings.season, hemisphere: v as 'Southern' | 'Northern' } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'region' && (
        <TextInputSheet
          title="Region"
          hint="City or region used for season detection."
          placeholder="e.g. Melbourne"
          value={settings.season.region}
          onSave={v => { updateSettings({ season: { ...settings.season, region: v } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'pets' && (
        <TextInputSheet
          title="Pets in the house"
          hint="Helps OutFlourish surface relevant toxicity warnings."
          placeholder="e.g. Cat, dog"
          value={settings.household.pets ?? ''}
          onSave={v => { updateSettings({ household: { ...settings.household, pets: v } }); closePicker() }}
          onCancel={closePicker}
        />
      )}

      {picker === 'clearData' && (
        <ClearDataSheet
          onConfirm={async () => {
            const { clearAll } = useStore.getState()
            await clearAll()
            closePicker()
            flash('All data cleared.')
          }}
          onCancel={closePicker}
        />
      )}
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
  const isInteractive = !!(chevron || onClick)
  const Component = isInteractive ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left"
      style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${PCT.ink}10`,
        background: 'transparent',
        cursor: isInteractive ? 'pointer' : 'default',
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

// ─── Sheet base ──────────────────────────────────────────────────────────────
function SheetBase({ onDismiss, children }: { onDismiss: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(35,18,10,0.50)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onDismiss}
    >
      <div
        className="w-full animate-sheet-up"
        style={{
          background: PCT.cream,
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          padding: '28px 22px',
          paddingBottom: 'max(28px, var(--sab))',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.28)',
          maxWidth: 480,
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function SheetTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <div style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
        color: PCT.terracotta, marginBottom: 6,
      }}>{title}</div>
      {hint && (
        <div style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 14, color: PCT.inkSoft, lineHeight: 1.5,
        }}>{hint}</div>
      )}
    </div>
  )
}

function SaveCancelRow({ onSave, onCancel, saveLabel = 'Save' }: {
  onSave: () => void; onCancel: () => void; saveLabel?: string
}) {
  return (
    <div className="flex gap-2.5 mt-6">
      <button
        onClick={onCancel}
        className="flex-1"
        style={{
          padding: '15px',
          background: 'transparent',
          border: `1px solid ${PCT.ink}22`,
          borderRadius: 18,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 17,
          color: PCT.inkSoft,
        }}
      >Cancel</button>
      <button
        onClick={onSave}
        className="flex-1"
        style={{
          padding: '15px',
          background: PCT.terracotta,
          color: PCT.cream,
          borderRadius: 18,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 17,
          boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
        }}
      >{saveLabel}</button>
    </div>
  )
}

// ─── TimePickerSheet ─────────────────────────────────────────────────────────
function TimePickerSheet({ title, hint, value, onSave, onCancel }: {
  title: string; hint: string; value: string
  onSave: (v: string) => void; onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle title={title} hint={hint} />
      <input
        type="time"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        style={{
          width: '100%',
          padding: '16px 18px',
          background: PCT.paper,
          border: `1px solid ${PCT.ink}18`,
          borderRadius: 16,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22,
          color: PCT.ink,
          outline: 'none',
        }}
      />
      <SaveCancelRow onSave={() => onSave(draft)} onCancel={onCancel} />
    </SheetBase>
  )
}

// ─── QuietHoursSheet ─────────────────────────────────────────────────────────
function QuietHoursSheet({ start, end, onSave, onCancel }: {
  start: string; end: string
  onSave: (start: string, end: string) => void; onCancel: () => void
}) {
  const [draftStart, setDraftStart] = useState(start)
  const [draftEnd, setDraftEnd] = useState(end)
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: PCT.paper,
    border: `1px solid ${PCT.ink}18`,
    borderRadius: 14,
    fontFamily: '"DM Serif Display", Georgia, serif',
    fontSize: 20,
    color: PCT.ink,
    outline: 'none',
  }
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle title="Quiet hours" hint="No notifications will be sent between these times." />
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.inkFaint, marginBottom: 6,
          }}>From</div>
          <input type="time" value={draftStart} onChange={e => setDraftStart(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ color: PCT.inkFaint, fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 20, paddingTop: 22 }}>–</div>
        <div className="flex-1">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.inkFaint, marginBottom: 6,
          }}>Until</div>
          <input type="time" value={draftEnd} onChange={e => setDraftEnd(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <SaveCancelRow onSave={() => onSave(draftStart, draftEnd)} onCancel={onCancel} />
    </SheetBase>
  )
}

// ─── StepperSheet ────────────────────────────────────────────────────────────
function StepperSheet({ title, hint, value, min, max, unit, onSave, onCancel }: {
  title: string; hint: string; value: number; min: number; max: number; unit: string
  onSave: (v: number) => void; onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle title={title} hint={hint} />
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setDraft(v => Math.max(min, v - 1))}
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: PCT.paper, border: `1px solid ${PCT.ink}18`,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28, color: PCT.terracottaDeep,
          }}
        >−</button>
        <div className="text-center" style={{ minWidth: 80 }}>
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 48, lineHeight: 1, color: PCT.ink,
          }}>{draft}</span>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint, marginTop: 4,
          }}>{unit}</div>
        </div>
        <button
          onClick={() => setDraft(v => Math.min(max, v + 1))}
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: PCT.paper, border: `1px solid ${PCT.ink}18`,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28, color: PCT.terracottaDeep,
          }}
        >+</button>
      </div>
      <SaveCancelRow onSave={() => onSave(draft)} onCancel={onCancel} />
    </SheetBase>
  )
}

// ─── SegmentSheet ────────────────────────────────────────────────────────────
function SegmentSheet({ title, hint, options, value, onSave, onCancel }: {
  title: string; hint: string
  options: { value: string; label: string }[]
  value: string
  onSave: (v: string) => void; onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle title={title} hint={hint} />
      <div className="flex gap-2.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => setDraft(opt.value)}
            className="flex-1"
            style={{
              padding: '16px',
              borderRadius: 16,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 18,
              background: draft === opt.value ? PCT.terracotta : PCT.paper,
              color: draft === opt.value ? PCT.cream : PCT.inkSoft,
              border: `1px solid ${draft === opt.value ? PCT.terracotta : PCT.ink + '18'}`,
              boxShadow: draft === opt.value ? '0 6px 16px rgba(165,78,38,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <SaveCancelRow onSave={() => onSave(draft)} onCancel={onCancel} />
    </SheetBase>
  )
}

// ─── TextInputSheet ──────────────────────────────────────────────────────────
function TextInputSheet({ title, hint, placeholder, value, onSave, onCancel }: {
  title: string; hint: string; placeholder: string; value: string
  onSave: (v: string) => void; onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle title={title} hint={hint} />
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{
          width: '100%',
          padding: '16px 18px',
          background: PCT.paper,
          border: `1px solid ${PCT.ink}18`,
          borderRadius: 16,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 18,
          color: PCT.ink,
          outline: 'none',
        }}
      />
      <SaveCancelRow onSave={() => onSave(draft.trim())} onCancel={onCancel} />
    </SheetBase>
  )
}

// ─── ClearDataSheet ──────────────────────────────────────────────────────────
function ClearDataSheet({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <SheetBase onDismiss={onCancel}>
      <SheetTitle
        title="Clear all data"
        hint="This permanently removes every plant, room, and watering history from this device. It cannot be undone."
      />
      {!confirmed ? (
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1"
            style={{
              padding: '15px',
              background: 'transparent',
              border: `1px solid ${PCT.ink}22`,
              borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              color: PCT.inkSoft,
            }}
          >Cancel</button>
          <button
            onClick={() => setConfirmed(true)}
            className="flex-1"
            style={{
              padding: '15px',
              background: 'transparent',
              border: `1px solid ${PCT.thirsty}55`,
              borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              color: PCT.thirsty,
            }}
          >Clear everything</button>
        </div>
      ) : (
        <div>
          <p className="mb-4" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 15, color: PCT.thirsty, textAlign: 'center',
          }}>
            This is irreversible. Every plant goes.
          </p>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className="flex-1" style={{
              padding: '15px', background: 'transparent',
              border: `1px solid ${PCT.ink}22`, borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17, color: PCT.inkSoft,
            }}>Keep it</button>
            <button onClick={onConfirm} className="flex-1" style={{
              padding: '15px', background: PCT.thirsty, color: PCT.cream, borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17,
              boxShadow: '0 8px 18px rgba(180,60,30,0.28)',
            }}>Yes, wipe it</button>
          </div>
        </div>
      )}
    </SheetBase>
  )
}
