# OutFlourish — Claude Reference

> A quiet little app for a thirsty little household.

Local-first iOS plant-care app. Tap an NFC tag on the pot to water; the meter rises; the app stays out of your way. Editorial-magazine aesthetic, designed for Melbourne seasonality, made in Carlton North.

**Repo:** https://github.com/doosyy/OutFlourish (private)
**Local path:** `/Users/christopherdoos/ClaudeCode/plant-care/`
**Dev URL:** http://localhost:5175 (via `.claude/launch.json` → `plant-care`)
**Origin:** Design hand-off bundle from claude.ai/design extracted at `/tmp/outflourish-design/plant-care-app/`. Original docs of record: `HANDOFF.md`, `SPECIES.md`, `data/species.json` inside that bundle.

---

## 1 · Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Native bridge | CapacitorJS 6.2.1 | iOS-only target |
| Build | Vite 5 | `base: './'` required for WKWebView |
| Framework | React 18 + TypeScript 5.6 | |
| Routing | `react-router-dom` v7 — `createHashRouter` | Hash routing because Capacitor serves `file://` |
| State | Zustand 5 | Named import: `import { create } from 'zustand'` |
| Styling | Tailwind CSS v3 + custom theme tokens | OKLCH palette, DM Serif + Newsreader |
| Data | `@capacitor/preferences` (single `Repository` boundary in `src/store.ts`) | localStorage fallback in browser |
| Native APIs | `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/share`, `@capacitor/haptics`, `@capacitor/camera`, `@capacitor/filesystem`, `@capawesome/capacitor-badge@6.0.0` | Pin badge to 6.0.0; latest 8.x requires Capacitor 8 |
| NFC | `@exxili/capacitor-nfc@0.0.13` (MIT, free) | Static import; iOS read+write via `NFC.startScan()` / `NFC.writeNDEF()` / `NFC.onRead()` / `NFC.onError()`; throws on web — caller catches and shows ErrorSheet |
| Fonts | DM Serif Display + Newsreader | Loaded via Google Fonts `<link>` in `index.html` |

**`package.json` `"type": "module"`** → all config files use ESM `export default` syntax.

### Useful scripts
```bash
npm run dev              # vite dev server on :5175
npm run build            # tsc -b && vite build
npm run preview          # vite preview
npm run cap:sync         # npx cap sync
npm run cap:ios          # build + cap sync ios + open Xcode
npm run fetch:photos     # download species photos to public/species/
npx tsc --noEmit         # type-check without emitting
```

---

## 2 · Project structure

```
plant-care/
├── CLAUDE.md                  # ← this file
├── .claude/launch.json        # dev server config for Claude Code preview
├── .gitignore                 # excludes node_modules, dist, .env, ios build artifacts
├── index.html                 # font preconnect + apple-mobile-web-app meta tags
├── capacitor.config.ts        # appId app.outflourish, appName OutFlourish
├── assets/                    # source 1024×1024 icon + 2732×2732 splash for capacitor-assets
├── ios/                       # native iOS Xcode project (cap add ios), pods committed, build artifacts gitignored
├── vite.config.ts             # base: './'
├── tailwind.config.js         # PCT palette as Tailwind tokens, custom keyframes
├── postcss.config.js
├── scripts/
│   └── fetch-species-photos.mjs    # downloads Unsplash photos at build time
├── public/
│   ├── favicon.svg
│   └── species/                    # 6 bundled species photos (~423KB total)
│       ├── monstera-deliciosa.jpg
│       ├── fiddle-leaf-fig.jpg
│       ├── peace-lily.jpg
│       ├── snake-plant-laurentii.jpg
│       ├── golden-pothos.jpg
│       └── hoya-kerrii.jpg
└── src/
    ├── main.tsx               # React mount
    ├── index.css              # Tailwind + body bg + glass utilities + focus ring
    ├── tokens.ts              # PCT colour constants (OKLCH strings) for inline SVG/style
    ├── store.ts               # ALL business logic — entities, repository, derived helpers
    ├── speciesDb.ts           # 150-species library + search helpers
    ├── App.tsx                # Router, NFC session, deep links, onboarding gate, sheets/toast
    ├── HomeScreen.tsx         # Hybrid layout + HomeByRoom + EmptyHome
    ├── PlantDetail.tsx        # Hero photo, overlapping meter, sparkline, accordion, diary, edit
    ├── AddPlantScreen.tsx     # Search → form flow with NFC banner
    ├── SettingsScreen.tsx     # 8 groups + collection summary + picker sheets
    ├── ManageRoomsScreen.tsx  # /rooms — list/add/edit/delete rooms with light level
    ├── Onboarding.tsx         # 4-step welcome + LaunchScreen
    ├── PermissionPrompt.tsx   # 4 variants: nfc/notifications/camera/photos
    ├── NfcMoment.tsx          # 6.5s signature animation
    ├── PrivacyPolicy.tsx      # 7 numbered sections at /privacy
    ├── photos.ts              # capturePlantPhoto helper — Camera + Filesystem wrapper
    ├── components/
    │   ├── Brand.tsx          # WateringCan, Wordmark, AppIconMark
    │   ├── Glyphs.tsx         # line-drawn icon set (no emoji)
    │   ├── PlantPhotoMeter.tsx    # ★ centerpiece — circular photo + wave overlay
    │   ├── MoistureMeter.tsx  # photo-less variant + MoistureBar
    │   ├── HydrationSparkline.tsx # 30-day chart with watering dots
    │   ├── PhotoPicker.tsx    # tappable thumbnail → chooser sheet → PermissionPrompt → capture
    │   └── UI.tsx             # TopBar, AccordionRow, Tag, Pill, Toggle, BottomSheet, FormField, TerrazzoTexture, CircleBtn, GlassCircle
    └── sheets/
        ├── index.ts
        ├── WateringSheet.tsx       # ml stepper + small/medium/deep presets (also opens via long-press on Plant Detail water button)
        ├── WaterAllSheet.tsx       # batch watering with checkboxes + ml totals
        ├── AlreadyWateredSheet.tsx # confirm log within 12h
        ├── ErrorSheet.tsx          # 4 variants — global via store.errorSheet
        ├── PhotoSourceSheet.tsx    # Take/Choose/Use species chooser
        └── Toast.tsx               # auto-dismiss + Undo button
```

---

## 3 · Design tokens

### Colour — OKLCH (in `src/tokens.ts` and `tailwind.config.js`)

| Token | Value | Used for |
|---|---|---|
| `cream` | `oklch(0.965 0.012 80)` | Page background |
| `paper` | `oklch(0.93 0.018 75)` | Cards |
| `paperDeep` | `oklch(0.88 0.022 70)` | Strong cards, off toggle |
| `terracotta` | `oklch(0.62 0.115 42)` | Primary action |
| `terracottaDeep` | `oklch(0.46 0.105 38)` | Italic accent in headlines |
| `terracottaSoft` | `oklch(0.86 0.045 50)` | Backgrounds for terracotta-tinted UI |
| `olive` | `oklch(0.52 0.058 115)` | Healthy state, hydration |
| `oliveDeep` | `oklch(0.34 0.045 118)` | Hero gradient floor |
| `oliveSoft` | `oklch(0.88 0.030 110)` | Drainage tip, ambient gradients |
| `ink` | `oklch(0.215 0.018 60)` | Primary text, dark pills |
| `inkSoft` | `oklch(0.42 0.018 60)` | Body copy, secondary text |
| `inkFaint` | `oklch(0.58 0.014 70)` | Hints, timestamps, faint dividers |
| `thirsty` | `oklch(0.55 0.16 32)` | Overdue/danger |
| `soon` | `oklch(0.70 0.135 70)` | Due-soon/warn |
| `happy` | `oklch(0.55 0.075 145)` | Settled state |

**Light-tag colours** (in `tokens.ts`, `PCLightTag`):
- `low` → `oklch(0.55 0.018 60)` on `oklch(0.91 0.012 60)` (neutral)
- `medium` → olive on `oklch(0.92 0.025 110)`
- `bright` → `oklch(0.58 0.115 65)` on `oklch(0.94 0.030 70)` (warm amber)

**Accent-for-hydration:** `< 0.25 → thirsty`, `< 0.50 → soon`, else `olive`. Exposed as `accentFor(h)` in `tokens.ts`.

### Typography

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | DM Serif Display | 400 + italic 400 | Plant names, headlines, big numbers |
| Body | Newsreader | 400/500/600 | Paragraphs, descriptions, button labels |
| Kicker | `ui-monospace, "SF Mono"` | 400 | Eyebrows: "OVERDUE · 2 DAYS", section labels, timestamps |

Sizes: display 52–96px hero · display 28–42px section · italic body 13–17px · eyebrow 9–11px tracked `0.16em`–`0.30em` uppercase.

Default body font set on `<body>` in `src/index.css`.

### Spacing — non-Tailwind extensions
4 / 8 / 12 / **18** / **22** / 28 / **36** / 48 px. The 18/22/36 values exposed as Tailwind utilities via custom spacing keys:
- `4.5` → 18px
- `5.5` → 22px
- `7` → 28px (overridden — Tailwind default is 28 already; kept explicit)
- `9` → 36px
- `12` → 48px

### Radii
`pill` 12px · `card-s` 16px · `btn` 18px · `card` 22px · `card-l` 28px · `sheet` 36px · `rounded-full` 999px.

### Shadows
| Token | Value |
|---|---|
| `shadow-subtle` | `0 1px 3px rgba(58,30,18,0.06), 0 8px 24px rgba(58,30,18,0.06)` |
| `shadow-cta` | `0 12px 28px rgba(165,78,38,0.32)` |
| `shadow-cta-sm` | `0 8px 18px rgba(165,78,38,0.30)` |
| `shadow-sheet` | `0 -20px 60px rgba(0,0,0,0.32)` |
| `shadow-photo` | `0 12px 28px rgba(58,30,18,0.18)` |
| `shadow-pill-ink` | `0 12px 32px rgba(58,30,18,0.32)` |
| `shadow-terra-card` | `0 18px 40px rgba(165,78,38,0.32), inset 0 0 0 1px rgba(255,255,255,0.12)` |

### Safe area
`--sat` / `--sab` exposed from `env(safe-area-inset-*)` in `:root`. All screens use `padding-top: max(56px, var(--sat))`.

---

## 4 · Animations

All defined as Tailwind `animation` utilities in `tailwind.config.js`. NfcMoment defines its own keyframes inline since the 6.5s cycle has many synchronized phases.

| Utility | Duration | Easing | Where |
|---|---|---|---|
| `animate-wave-front` | 5s | linear infinite | PlantPhotoMeter front wave |
| `animate-wave-back` | 7.5s | linear infinite | PlantPhotoMeter back wave |
| `animate-meter-rise` | 1.1s | `cubic-bezier(.22,.7,.18,1)` | MoistureMeter on mount |
| `animate-overdue-badge` | 2.2s | ease-in-out infinite | Plant Detail overdue badge |
| `animate-today-dot-r` | 1.8s | linear infinite | Sparkline current-day pulse |
| `animate-toast-in` | 0.35s | `cubic-bezier(.2,.7,.2,1) both` | Toast slide-up + sheet backdrop |
| `animate-toast-progress` | 5s | linear forwards | Toast auto-dismiss bar |
| `animate-sheet-up` | 0.35s | `cubic-bezier(0.32,0.72,0,1)` | BottomSheet rise |
| `animate-nfc-pulse` | 1.6s | ease-in-out infinite | Onboarding NFC waves |
| `animate-perm-ring` | 2s | ease-out infinite | Permission NFC pulse rings |
| `animate-launch-dot` | 1.4s | ease-in-out infinite | Launch screen bouncing dots |
| `animate-caret` | 1s | `steps(2) infinite` | Search input caret |
| `animate-breathe` | 4.5s | ease-in-out infinite | Plant Detail overdue meter halo |

NfcMoment cycle (6.5s total):
- 0.0–1.4s **Listening** — silhouette + ripple rings + "Hold steady"
- 1.4–2.6s **Reveal** — silhouette fades to plant photo, name reveals
- 2.6–4.4s **Watering** — droplets fall, meter ring fills, wave rises → triggers `logWater()` at 2.6s
- 4.4–6.5s **Confirmed** — check badge + "Watered just now" → auto-routes to plant detail

---

## 5 · Data model

### `Plant` (`src/store.ts`)
```ts
interface Plant {
  id: string                   // 'plant_1700001234'
  name: string                 // 'Hugo' (the nickname)
  species?: string             // 'Monstera Deliciosa' display name
  speciesId?: string           // FK → SpeciesProfile.id
  photo: string                // /species/{id}.jpg OR user upload OR ''
  baseIntervalDays: number     // typically inherits from species
  recommendedMl: number        // per drink in growing season
  winterMl: number             // dialed-back winter amount
  room?: string                // FK → Room.name (free-text fallback if no room)
  mood?: string                // user-editable anthropomorphic line
  history: WaterLog[]
  createdAt: number
  nfcTagId?: string
}

interface WaterLog {
  id: string
  timestamp: number
  type: 'water' | 'fertilize' | 'repot'
  amountMl?: number            // only for type === 'water'
  note?: string
}
```

### `Room` — first-class entity
```ts
interface Room {
  id: string                   // 'living-room' (kebab-case)
  name: string                 // 'Living Room' (display, also FK from Plant.room)
  light: 'low' | 'medium' | 'bright'
  notes?: string
}
```
Seeded on first run with a single `Living Room` (medium light).

### `AppSettings`
```ts
interface AppSettings {
  onboardingComplete: boolean
  homeView: 'by-urgency' | 'by-room'
  reminders: { enabled; timeOfDay 'HH:mm'; quietHours {start,end}; snoozeHours }
  watering:  { defaultUnit 'ml'|'oz'; drainageReminder; seasonalDosing }
  rooms:     { groupHomeByRoom; lightAwareCare }
  season:    { hemisphere 'Northern'|'Southern'; region }
  household: { petMode; childMode; pets }
}
```

### `SpeciesProfile` (`src/speciesDb.ts`)
```ts
interface SpeciesProfile {
  id: string                   // kebab-case, immutable once published
  name: string                 // common name (italic in UI)
  scientificName: string       // Latin binomial
  aliases: string[]            // case-insensitive substring search
  photo: string                // /species/{id}.jpg
  baseIntervalDays: number     // 3–28
  recommendedMl: number        // round to nearest 10
  winterMl: number             // ~60–70% of recommendedMl
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  humidity: 'Low' | 'Medium' | 'High'
  light: 'low' | 'medium' | 'bright'
  toxic: boolean
  toxicTo?: 'pets' | 'children' | 'both'  // required when toxic === true
  careGuide: { light; water; food; season; trouble }
  defaultMood?: string
}
```

**v1 ships 6 species** (Monstera Deliciosa, Fiddle Leaf Fig, Peace Lily, Snake Plant Laurentii, Golden Pothos, Hoya Kerrii). The remaining 144 are deferred per Phase 1 decision §8.1.

### Storage keys (Preferences)
- `plants_v1` — JSON array of Plant
- `rooms_v1` — JSON array of Room
- `settings_v1` — AppSettings
- `lastExportAt` — unix ms timestamp string

Repository pattern (`src/store.ts → Repository`) is the iCloud-swap boundary. To add iCloud sync later, only the Repository methods need swapping.

---

## 6 · Derived calculations

All in `src/store.ts`. Port verbatim — UI assumes them.

| Function | Behaviour |
|---|---|
| `getLastWatered(plant)` | Most recent `type==='water'` timestamp, or null |
| `getSeasonMultiplier(date, hemisphere)` | Summer 0.7 / Autumn-Spring 1.0 / Winter 2.0 |
| `applyLightAdjustment(intervalDays, light)` | low ×1.20, medium ×1.00, bright ×0.90 |
| `getEffectiveInterval(plant, opts)` | `baseIntervalDays × season × light` |
| `getNextWateredDue(plant, opts)` | `lastWatered + effectiveInterval` |
| `getHydrationScale(plant, opts)` | `(nextDue − now) / (nextDue − lastWatered)` clamped 0–1. 0 if never watered. |
| `getMoistureLabel(h)` | 6 thresholds: Bone dry → Almost dry → Drying out → Just right → Comfortably moist → Freshly watered |
| `getDueState(plant, opts)` | `'overdue' \| 'soon' \| 'ok' \| 'fresh'` (fresh = <8h since last water) |
| `getDueLabel(plant, opts)` | Editorial strings: "2 days overdue", "Today, 8:14am", "Due in 4 hours", "Due tomorrow", "Due in 8 days" |
| `getLastWateredLabel(plant)` | "just now" / "3 hours ago" / "12 days ago" / "24 Mar" |
| `getTotalWaterMl(plant)` | Sum of all `amountMl` across history |
| `getWaterCount(plant)` | Count of `type==='water'` entries |

All due/hydration funcs accept `DueOptions = { now?, hemisphere?, roomLight?, lightAware? }`. Pass `roomLight` from `roomLightFor(plant)` on the store, and `hemisphere`/`lightAware` from settings.

---

## 7 · Implementation contracts

### NFC (`@exxili/capacitor-nfc`)
- **Trigger:** user taps the floating "Hold to a plant tag" pill on Home → `NFC.startScan()` opens iOS Core NFC modal. iOS requires explicit user gesture per session — no auto-scan.
- **Paired tag, >12h since last drink** → NfcMoment animation; auto-logs watering at 2.6s mark; routes to plant detail on completion.
- **Paired tag, <12h since last drink** → AlreadyWateredSheet (Confirm / Cancel).
- **Unknown/blank tag** → ErrorSheet `kind='tag-unknown'` → primary CTA navigates to /add with `pendingNfcWrite=true` banner.
- **Save plant with pendingNfcWrite** → `NFC.writeNDEF()` writes a Text record with `plant_<id>`.
- **Tag write failure** → ErrorSheet `kind='tag-write-failed'`.
- **No NFC device / web / simulator** → `NFC.startScan()` throws → caller catches and shows ErrorSheet `kind='nfc-unavailable'`.

**Apple constraint:** the "Near Field Communication Tag Reading" capability requires a paid Apple Developer Program account. Personal Team (free Apple ID) gets "No Matches" when searching capabilities. NFC code compiles and ships without the capability — it just throws at runtime. The Exxili plugin handles graceful fallback via its web shim.

**Payload format:** NDEF Well-Known Text record. First byte = status (bits 0-5 = language-code length), then language code (`en` = 2 bytes), then UTF-8 text. `parsePlantIdFromNdefPayload()` reads it back. We pass `rawMode: true` to `writeNDEF` so we build the framing ourselves.

**API summary** (live in `src/App.tsx`, `src/HomeScreen.tsx`, `src/AddPlantScreen.tsx`):
```ts
import { NFC } from '@exxili/capacitor-nfc'
await NFC.isSupported()                      // { supported: boolean }
await NFC.startScan({ mode: 'auto' })        // opens iOS modal
NFC.onRead(data => { ... })                  // subscription; returns unsubscribe fn
NFC.onError(err => { ... })                  // subscription
await NFC.writeNDEF({ records, rawMode })    // writes (requires session)
```

### Notifications (`@capacitor/local-notifications`)
- Morning badge at `settings.reminders.timeOfDay` (default 07:30).
- Quiet hours respected (default 21:00–07:00).
- Snooze interval `settings.reminders.snoozeHours` (default 3).
- Notification IDs must be positive integers (use index+1).
- Cancel before re-scheduling — passes `pending.notifications` array to `cancel()` (not just IDs).
- Notification tap → navigates to `/plant/:id` via `LocalNotifications.addListener('localNotificationActionPerformed', ...)`.

### Badging (`@capawesome/capacitor-badge@6.0.0`)
- Count = plants with `getNextWateredDue() < now + 12h`.
- Call `Badge.requestPermissions()` on first `load()`.
- Swallow all badge errors (non-fatal).

### Storage (`@capacitor/preferences`)
- Single keys (`plants_v1`, `rooms_v1`, `settings_v1`).
- Backup/restore via `@capacitor/share` (JSON file).
- Browser fallback uses `CapacitorStorage.{key}` in localStorage automatically.

### Haptics (`@capacitor/haptics`)
- Logging water → `ImpactStyle.Medium`.
- (Designed) NFC reveal → `ImpactStyle.Light` *(not yet wired)*.
- (Designed) Delete confirm → `ImpactStyle.Heavy` *(not yet wired)*.

### Permissions order (onboarding flow)
1. NFC (asked after onboarding step 2, before "Add my first plant") *(pre-prompt component built; not yet wired)*
2. Notifications (asked after the first plant is added) *(pre-prompt component built; auto-requested in `scheduleNotifications` for now)*
3. Camera (asked when user taps "Take a photo" in Add Plant) *(plugin installed; UI not yet wired)*
4. Photos (asked when user taps "Choose photo") *(plugin installed; UI not yet wired)*

---

## 8 · Voice & copy rules

| Surface | Voice | Example |
|---|---|---|
| Home + Plant Detail + species | Editorial-magazine, dry, anthropomorphic | "Two of your plants are staging a polite revolt." |
| Settings / Privacy / errors | Neutral, helpful, no jokes | "This NFC sticker isn't paired with any plant in your garden." |
| NFC moment | Theatrical | "Hold steady. The plant is judging your aim." |
| Push notifications | Brief, factual, single sentence | "Hugo is 2 days overdue and Cordelia would like attention before lunch." |

**Hard rules:**
- **No emoji anywhere as UI chrome.** Emoji only as content (the species library can use them later if needed). Use line-drawn glyphs from `src/components/Glyphs.tsx` instead.
- **Numbers as digits** (`240 ml`, never *two hundred forty*). Always `ml` (lowercase).
- **No em-dashes (—) in user-facing copy.** Use periods, commas, colons, or parentheses instead. Em-dashes in code comments are fine but should not appear in any visible string. Exclamation points are also not allowed.
- **Plants in third person** — `it`, not `your plant`.
- Mood quotes live on each Plant (user-editable) and `SpeciesProfile.defaultMood` (template).

---

## 9 · Routes

| Path | Screen | Notes |
|---|---|---|
| `/` | HomeScreen | Hybrid or by-room based on settings |
| `/plant/:id` | PlantDetail | Most code-dense screen |
| `/add` | AddPlantScreen | Search → form, supports NFC banner |
| `/settings` | SettingsScreen | 8 groups |
| `/rooms` | ManageRoomsScreen | Add/edit/delete rooms with light level |
| `/privacy` | PrivacyPolicy | Linked from Settings → About |

Bottom-sheet overlays (`AlreadyWateredSheet`, `WateringSheet`, `WaterAllSheet`, `ErrorSheet`, `PhotoSourceSheet`, `Toast`, `NfcMoment`, `Onboarding`, `PermissionPrompt`) render at the App or screen level, not as routes — they overlay whatever route is active. Use Capacitor `App.addListener('appUrlOpen')` for deep-link state, not separate routes.

---

## 10 · The PlantPhotoMeter

The signature visual element. `src/components/PlantPhotoMeter.tsx`.

A circular plant photo whose bottom is filled by an animated wave rising to `hydration × height`. Wave colour shifts: `<25% thirsty` / `<50% soon` / else `olive`. Two parallax wave layers (front 5s linear, back 7.5s linear-reverse), 6-stop gradient max 0.84 opacity, Gaussian blur softening.

**Sizes used across the app:**
- 40px — iOS widget
- 48px — Home rows
- 52px — Almanac rows
- 56px — Watering sheet identity
- 68px — Already-watered sheet
- 124px — Featured plant on home
- 148px — Plant Detail hero (overlaps the photo with -84px margin)
- 180px — NFC moment (during reveal phase)

`MoistureMeter` (`src/components/MoistureMeter.tsx`) is the photo-less variant — used in component docs, system showcase. `MoistureBar` is the thin horizontal strip variant.

When the meter is in an overdue state (Plant Detail), it gets a 3px terracotta border, 8px glow halo, and an `animate-breathe` halo pulse. Top-right "Overdue" badge animates with `animate-overdue-badge`.

---

## 11 · Edge cases

- **Long plant names** — ✓ Phase 4 enforced. Home AlmanacRow uses `truncate`; Home featured headline scales down 34→28 and clamps to 2 lines; Plant Detail H1 scales 52→44→38 at length thresholds 14/22 chars. Eyebrow lines truncate with ellipsis.
- **Long species names** — italic line wraps to 2 lines max. *(Currently truncates via `text-overflow: ellipsis` on AlmanacRow.)*
- **0 plants total** → `EmptyHome` renders (Home Screen built-in).
- **0 plants in any room** → `EmptyRoomState` *(designed; not yet implemented)*.
- **No NFC capable device** → `ErrorSheet kind='nfc-unavailable'` *(built; not yet wired)*.
- **Plant overdue >7 days** → additional copy "Hugo may need more than water. Check the trouble guide." *(suggested; not yet implemented)*.
- **User declines all permissions** — app still works; should surface gentle re-asks once per week in Settings *(not yet implemented)*.

---

## 12 · App Store submission checklist

| Item | Status |
|---|---|
| App icon 1024×1024 + all iOS sizes | ✓ Generated via `npx capacitor-assets generate --ios` from `assets/icon.png` (extracted from Gemini design mockup) |
| Splash screen (light + dark) | ✓ Generated from `assets/splash.png` (cream bg + centred icon) |
| Launch screen storyboard | iOS default `LaunchScreen.storyboard` still in place; bouncing-dot variant in `src/Onboarding.tsx → LaunchScreen` not yet wired natively |
| Info.plist usage strings | ✓ Camera, Photos, PhotosAdd, NFC reader |
| Entitlements (`App.entitlements`) | ✓ `com.apple.developer.nfc.readersession.formats = [NDEF, TAG]` + `aps-environment = development` |
| Privacy manifest (`PrivacyInfo.xcprivacy`) | ✓ No tracking, no data collection, UserDefaults + FileTimestamp required-reason APIs declared |
| Bundle identity | ✓ `appId: app.outflourish`, `appName: OutFlourish` |
| Bundle version / build | `1.0.0` / `1` in pbxproj — bump before each TestFlight build |
| Apple Developer Program | **Pending** — required for NFC capability + Push capability + TestFlight |
| NFC capability in Xcode | **Pending** — adds itself once paid Team is selected and capability + button is clicked |
| Push Notifications capability | **Pending** — same. Needed by `@capacitor/local-notifications` for proper delivery routing |
| 5 marketing screenshots (1290×2796) | Designed in original `marketing.jsx`; needs render+export |
| App Store metadata (title, subtitle, description, keywords) | TBD — see `HANDOFF.md` §11 |
| Privacy policy URL | Content in `src/PrivacyPolicy.tsx`; needs hosting (e.g. `doosyy.github.io/outflourish/privacy`) |
| Privacy nutrition label | All "Not Collected" |
| Age rating | 4+ |

---

## 13 · Remaining deferred items

Tracked for future work. None block the current build.

1. **EmptyRoomState** — **DONE**. Rendered inline under each empty room header in HomeByRoom: paper card with dashed border, olive leaf glyph, quiet copy ("{Room} is quiet. No plants live here yet.") and an "Add one" pill that routes to /add.
2. **Editable Hemisphere/region pickers in Settings** — **DONE**. SegmentSheet for Hemisphere, TextInputSheet for Region. All Settings pickers wired (reminderTime, quietHours, snooze, unit, hemisphere, region, pets).
3. **Editable reminder time / quiet hours pickers** — **DONE** (same picker wiring as #2; TimePickerSheet and QuietHoursSheet).
4. **Species library expansion** — **DONE · 150/150**. Five batches shipped covering foliage, aroids, succulents, cacti, flowering, statement, palms, ferns, carnivorous, specialty aroids (Anthurium Clarinervium, Philodendron Gloriosum/Melanochrysum, Alocasia Stingray/Dragon Scale, Monstera Albo/Thai Constellation), Tillandsias, Hoyas, Pothos varieties, holiday cacti, Echeverias, Aeonium, Sago Palm. All entries have empty photo strings (gradient fallback) and full 5-field care guides. Photos to be supplied later.
5. **Notification appearance design** — iOS uses default banner; rich notification not yet designed.
6. **Photo cleanup on swap** — **DONE**. Plant now carries `photoPath?: string`. `PhotoPicker.onChange` reports the new Filesystem path; `EditPlantForm` deletes the previous file via `removeStoredPhoto()` before swapping; `deletePlant` cleans up on plant removal. Reverting to species photo passes `undefined` so no orphaned data is left behind.
7. **NFC preview side-effect** — **DONE**. `NfcMoment` accepts a `previewMode` boolean; when true, the `logWater()` side-effect is skipped. Settings preview now passes `previewMode`.
8. **iCloud sync (CKShare)** — designer flagged as v1.1.
9. **Apple Watch companion** — not designed; v2.
10. **iPad layout** — not designed.
11. **Live Activity / Dynamic Island** — not designed; would be lovely.
12. **Localisation** — copy is UK/AU English only.

### Completed in Phase 4 (no longer deferred)
- App icon + splash via `@capacitor/assets generate` ✓
- PermissionPrompt wiring for camera/photos ✓ (`src/components/PhotoPicker.tsx`)
- Custom-amount watering: long-press Water button opens WateringSheet ✓
- Water-all multi-select sheet ✓ (`src/sheets/WaterAllSheet.tsx`)
- Error sheets routing — `tag-unknown` / `tag-write-failed` / `nfc-unavailable` ✓ (global via `store.errorSheet`)
- Manage Rooms screen ✓ (`src/ManageRoomsScreen.tsx` at `/rooms`)
- Long plant name truncation across Home and Plant Detail ✓
- Onboarding region picker overlap fix ✓
- NFC integration (read + write) via free Exxili plugin ✓
- **NFC amount picker on scan** ✓ — `AmountOnScanSheet` (`src/sheets/AmountOnScanSheet.tsx`) appears on paired-tag reads when `settings.watering.confirmAmountOnScan` is on (default). 3 preset chips (Light=winterMl, Recommended=recommendedMl, Heavy=recommendedMl×1.4) plus an inline custom stepper. Selected amount is passed through `NfcMoment` via a new `amountMl?: number` prop.
- **Pair NFC tag from plant page** ✓ — `NfcAccordionRow` in `src/PlantDetail.tsx` (mounted inside the care guide accordion). Two states: unpaired → "Pair a sticker" button that calls `NFC.writeNDEF` with the plant's id; paired → "Paired · {date}" with explicit "Unpair" confirm flow. `Plant` gains `nfcPairedAt?: number`. Pairing in AddPlantScreen now also sets `nfcTagId` + `nfcPairedAt` after a successful write (previously it wrote but didn't persist).
- **Blank tag chooser** ✓ — `BlankTagSheet` (`src/sheets/BlankTagSheet.tsx`) appears when a blank tag is held to the phone, replacing the previous `tag-unknown` error sheet for this case. Two-mode UX: chooser ("Pair to existing" vs "Add a new plant") → plant picker list. Tapping a plant fires `NFC.writeNDEF` inline; on success the plant gets paired and the app navigates to it.

### Wireframe review pass (10 fixes, commits d92547e + 711fc7c)
- Plant Detail floating pill no longer overlaps scroll content (paddingBottom now `max(160px, calc(var(--sab) + 140px))`)
- Plant Detail status pill no longer reads redundantly — was "Overdue · 4 days overdue", now just "4 days overdue" with the coloured dot
- `ChevronGlyph` accepts `direction` prop (left/right/up/down). Forward-nav rows in Settings use `direction="right"`; back buttons keep default left
- Home featured eyebrow + AlmanacRow secondary line both truncate with ellipsis (no more "ROOM" wrapping alone)
- Species result rows show a uniform single-line summary (`BEGINNER · MEDIUM HUMIDITY · TOXIC`) instead of inconsistent wrapping tags
- "Pet mode" hint shortened to fit one line
- Manage Rooms gets a quiet italic footer below "+ Add a room" instead of empty cream
- Sparkline today-dot uses `overflow: visible` so the pulse doesn't clip at the right edge
- Home featured plant grid switched from `items-center` to `items-start` — no more cream dead-space below the photo when text column runs longer

---

## 14 · Locked decisions (from Phase 1 Q&A)

| Question | Decision |
|---|---|
| Species library for v1 | 6 designer species only |
| Theme mode | Light only (no dark mode) |
| Plant photos | Bundle 720px JPGs in `public/species/` |
| User-uploaded photos | ✓ Wired Phase 4 via `src/photos.ts` + `src/components/PhotoPicker.tsx`. Uses `@capacitor/camera` + `@capacitor/filesystem`. Persists to `Directory.Data/plants/`. |
| Default rooms | Seed single "Living Room" (medium light) |
| Onboarding | Show once. `settings_v1.onboardingComplete=true` after step 3. Reset only via Clear all data. |
| NFC moment | Full-screen takeover, 6.5s, auto-dismiss, logs at 'watering' phase |
| Water-all | ✓ Wired Phase 4 — `src/sheets/WaterAllSheet.tsx`. Checkboxes (all pre-checked), per-plant photo + ml, total summed, single Log button. |
| iOS widget | Defer to v1.1 |
| App Store assets | User handles outside code phases |
| Region default | Asked in onboarding step 3 (4 steps total, not 3) |

---

## 15 · Insights from the build

### Capacitor / Vite quirks
- `@capacitor/preferences` falls back to localStorage automatically in browser, under `CapacitorStorage.{key}`. Inspectable via DevTools Application tab.
- Vite needs `base: './'` for Capacitor's `file://` WKWebView serving.
- `package.json` `"type": "module"` requires all config files (`vite.config.ts`, `postcss.config.js`, `tailwind.config.js`) to use ESM `export default`.
- HMR can get stuck after deleting modules — solve by stopping/restarting the dev server (`preview_stop` + `preview_start`).

### TypeScript ergonomics
- The store exposes both `useStore` (new) and `usePlantStore` (legacy alias) and `Repository`/`PlantRepository`. This is intentional for backward compatibility during migration — the alias should be removed once Phase 4 verifies nothing else references the old names.
- Plant migration in `Repository.loadPlants()` (`migratePlant()` function) handles the v1 → current schema upgrade silently. Old plants with `emoji` and no `photo` get defaulted to empty photo (gradient fallback).

### NFC plugin pattern (Exxili — free, MIT)
- We use `@exxili/capacitor-nfc` instead of the paid Capawesome plugin. Static import — no try/catch wrapper needed at the import level. The plugin's own web shim throws on `startScan` etc. in the browser, so callers wrap individual calls in try/catch and route the failure to `ErrorSheet kind='nfc-unavailable'`.
- App.tsx subscribes to `NFC.onRead(cb)` and `NFC.onError(cb)` on mount — these are passive listeners and don't open the iOS modal. The modal only opens when something calls `NFC.startScan()`, which has to be a user gesture (currently the floating "Hold to a plant tag" pill).
- iOS Core NFC sessions are short-lived (~60s) and end when a tag is read or the user dismisses the modal. We do not try to keep a persistent session — each scan is a fresh `startScan()`.
- Writing: build the NDEF Text record framing manually (status byte + lang code + UTF-8 text), pass with `rawMode: true`. The plugin's auto-framing for type `'T'` doubles up the language code prefix.
- **Capability is a paywall**: even with the free plugin, the Xcode "NFC Tag Reading" capability requires a paid Apple Developer Program account. The code compiles and runs fine without it; NFC just throws at runtime, which we already handle.

### Wave physics in PlantPhotoMeter
- `buildWavePath(yBase, size, amp)` builds a path 3× the meter width with 9 peaks. Translating by `-100%` then loops seamlessly with linear timing.
- Two layers with different speeds + different amplitudes create parallax depth.
- Layer animation is via SVG `<g>` `style.animation`, not CSS keyframes on the SVG itself — required because each meter needs a unique animation name (`uid` based on `Math.random()` + `animateKey` prop).
- Wave gradient peaks at 0.84 alpha so the underlying photo always shows through.

### Onboarding gate
- Onboarding renders only when `isLoaded && !settings.onboardingComplete`.
- The `isLoaded` flag guards against showing onboarding briefly during the initial Preferences load.

### "Why the project folder is `plant-care/`"
The local directory is `plant-care/` from the original code-only phase before the design assigned the OutFlourish name. The repo is named OutFlourish; the folder name is not a high-priority rename. The `appId` in `capacitor.config.ts` was migrated to `app.outflourish` in Phase 4. The `package.json` `name` (`plant-care`) is harmless but could be renamed later.

### Camera + Photos integration (Phase 4)
- `src/photos.ts` is the single boundary. `capturePlantPhoto(plantId, source)` returns `{ src, path? }` or null on cancel/denial.
- iOS path: base64 from `@capacitor/camera` → `Filesystem.writeFile` to `Directory.Data/plants/<id>-<ts>.jpg` → `Capacitor.convertFileSrc(uri)` → assignable to `<img src>`.
- Web fallback: hidden `<input type="file">` returns an object URL. Doesn't persist; dev-only.
- `src/components/PhotoPicker.tsx` orchestrates: tappable thumbnail → `PhotoSourceSheet` → `PermissionPrompt` → call into `photos.ts` → fire `onChange(newSrc)` to parent.
- Used in both `AddPlantScreen` (during creation) and `PlantDetail`'s edit form (for swaps later).
- Bug to know about: when user swaps a photo, the old file isn't deleted. Add `photoPath` to `Plant` to enable cleanup; current state is a small storage leak.

### How to test NFC end-to-end
1. Paid Apple Developer Team selected in Xcode → Signing & Capabilities.
2. **+ Capability → "Near Field Communication Tag Reading"** (no longer "No Matches" once paid Team is active). Tick NDEF + TAG.
3. **+ Capability → "Push Notifications"** (also gated by paid Team).
4. Run on a real iPhone (not simulator — Core NFC is hardware-only).
5. Get NTAG213 stickers from Amazon (~$10 for 20). NTAG213 has 144 bytes — plenty for `plant_<timestamp>`.
6. Add a plant in the app, save it (no pairing yet).
7. Tap "Hold to a plant tag" on Home → modal opens → hold a fresh sticker to top of phone.
8. Modal closes, ErrorSheet kind=`tag-unknown` shows. Tap primary → /add → save a plant → triggers `NFC.writeNDEF`.
9. From now on, tapping that sticker opens the NfcMoment animation against that plant.

Tag write troubleshooting:
- NTAG213 is fastest; NTAG215 also works (504 bytes). NTAG216 fine. Older Mifare Classic is not iOS-supported.
- Tag must be unwritten (factory state) or rewritable (most NTAG2xx are).
- Hold steady — Core NFC writes typically take 1-2s.
- Failure throws to caller → ErrorSheet kind=`tag-write-failed`.

### Things to grep for when prepping the App Store build
- `src/App.tsx` deep link URL scheme — currently parses `outflourish://` only. Add `plantcare://` back if you ever shipped a TestFlight under the old bundle ID.
- Settings about block (`"1.0.0 · Phase 4"` → bump to real version before each TestFlight upload).
- `package.json` name (`plant-care`) — cosmetic, doesn't affect the App Store listing.

---

## 16 · Where to read the original design

- **HTML preview:** `/tmp/outflourish-design/plant-care-app/project/Plant Care.html` (and `Plant Care-print.html`)
- **Designer source files:** `/tmp/outflourish-design/plant-care-app/project/src/*.jsx` (24 files — all the .jsx components the designer built)
- **HANDOFF.md** — the developer hand-off doc, 329 lines, the source of truth for behaviour contracts
- **SPECIES.md** — instructions + voice guide for adding species
- **data/species.json** — JSON contract for SpeciesProfile

The bundle was extracted from a `gzip(tar(...))` payload returned by `https://api.anthropic.com/v1/design/h/TDa_15z4tnzb9SOD5cnu_Q?open_file=Plant+Care.html` during Phase 1.

---

## 17 · Quick reference — common patterns

### Reading a plant's hydration in a component
```ts
import { useStore, getHydrationScale, getMoistureLabel } from './store'

const { plants, rooms, settings } = useStore()
const plant = plants[0]
const roomLight = rooms.find(r => r.name === plant.room)?.light
const opts = {
  hemisphere: settings.season.hemisphere,
  lightAware: settings.rooms.lightAwareCare,
  roomLight,
}
const hydration = getHydrationScale(plant, opts)
const label = getMoistureLabel(hydration)
```

### Inline OKLCH in JSX
```tsx
import { PCT, accentFor } from './tokens'

<div style={{ background: PCT.cream, color: PCT.ink }}>
  <span style={{ color: accentFor(0.3) }}>...</span>
</div>
```

### Tailwind for the same
```tsx
<div className="bg-cream text-ink">
  <span className="text-thirsty">...</span>
</div>
```

(Use Tailwind classes for static colours, inline `PCT.*` for dynamic/computed colours.)

### Showing a bottom sheet
```tsx
import { BottomSheet } from './components/UI'

<BottomSheet onDismiss={close}>
  {/* sheet content */}
</BottomSheet>
```

### Adding a new species
1. Open `src/speciesDb.ts`, append a `SpeciesProfile` to `SPECIES_DB`.
2. Add the photo Unsplash ID to `scripts/fetch-species-photos.mjs` `PHOTOS` map.
3. Run `npm run fetch:photos` — downloads to `public/species/{id}.jpg`.
4. Commit. Plant Detail, Add Plant search, Almanac rows, NFC moment all render automatically.

### Logging a watering with a custom amount
```ts
const { logWater } = useStore()
await logWater(plantId, 'water', { amountMl: 200, note: 'after repot' })
// → automatically sets lastWaterAction → Toast appears
// → after 5s, toast dismisses
// → undo button calls undoLastWater()
```

### Triggering the WateringSheet UI (custom amount picker)
Plant Detail's primary water button uses `onPointerDown`/`onPointerUp` to detect a 500ms long-press. Tap = quick log. Long-press = open WateringSheet pre-filled with `winterMl` (if seasonal dosing on AND winter) or `recommendedMl` otherwise. The `longPressTriggered` ref blocks the click handler from also firing.

### Triggering a global ErrorSheet from anywhere
```ts
useStore.getState().setErrorSheet('nfc-unavailable')
// → ErrorSheet renders at the App level
// → onPrimary closes it (and navigates for tag-unknown/tag-write-failed)
```

### Capturing a user photo (Camera or Photos)
```ts
import { capturePlantPhoto } from './photos'
const result = await capturePlantPhoto(plant.id, 'camera')  // or 'photos'
// → null if user cancelled or permission denied
// → { src: 'capacitor://...', path: 'plants/<id>-<ts>.jpg' } on success
if (result) updatePlant(plant.id, { photo: result.src })
```

### Triggering an NFC scan from a user gesture
```ts
import { NFC } from '@exxili/capacitor-nfc'
try {
  const { supported } = await NFC.isSupported()
  if (!supported) { useStore.getState().setErrorSheet('nfc-unavailable'); return }
  await NFC.startScan()  // opens iOS modal — `NFC.onRead` listener in App.tsx handles the result
} catch {
  useStore.getState().setErrorSheet('nfc-unavailable')
}
```

### Writing plant_<id> to a blank NFC tag
```ts
import { NFC } from '@exxili/capacitor-nfc'
const langCode = 'en'
const status = langCode.length & 0x3f
const langBytes = new TextEncoder().encode(langCode)
const textBytes = new TextEncoder().encode(plant.id)
const payload = [status, ...langBytes, ...textBytes]
await NFC.writeNDEF({ records: [{ type: 'T', payload }], rawMode: true })
// rawMode = true → don't double-frame the Text record header
```
