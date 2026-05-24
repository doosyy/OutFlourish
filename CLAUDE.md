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
| NFC | `@capawesome-team/capacitor-nfc` (sponsorware) | Dynamic `require()` in try/catch; gracefully degrades on web/simulator |
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
├── capacitor.config.ts        # appId com.plantcare.app, appName PlantCare (TODO: rename)
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
    ├── speciesDb.ts           # 6-species library + search helpers
    ├── App.tsx                # Router, NFC session, deep links, onboarding gate, sheets/toast
    ├── HomeScreen.tsx         # Hybrid layout + HomeByRoom + EmptyHome
    ├── PlantDetail.tsx        # Hero photo, overlapping meter, sparkline, accordion, diary, edit
    ├── AddPlantScreen.tsx     # Search → form flow with NFC banner
    ├── SettingsScreen.tsx     # 6 groups + collection summary
    ├── Onboarding.tsx         # 4-step welcome + LaunchScreen
    ├── PermissionPrompt.tsx   # 4 variants: nfc/notifications/camera/photos
    ├── NfcMoment.tsx          # 6.5s signature animation
    ├── PrivacyPolicy.tsx      # 7 numbered sections at /privacy
    ├── components/
    │   ├── Brand.tsx          # WateringCan, Wordmark, AppIconMark
    │   ├── Glyphs.tsx         # line-drawn icon set (no emoji)
    │   ├── PlantPhotoMeter.tsx    # ★ centerpiece — circular photo + wave overlay
    │   ├── MoistureMeter.tsx  # photo-less variant + MoistureBar
    │   ├── HydrationSparkline.tsx # 30-day chart with watering dots
    │   └── UI.tsx             # TopBar, AccordionRow, Tag, Pill, Toggle, BottomSheet, FormField, TerrazzoTexture, CircleBtn, GlassCircle
    └── sheets/
        ├── index.ts
        ├── WateringSheet.tsx       # ml stepper + small/medium/deep presets
        ├── AlreadyWateredSheet.tsx # confirm log within 12h
        ├── ErrorSheet.tsx          # 4 variants
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

### NFC (`@capawesome-team/capacitor-nfc`)
- **Paired tag, >12h since last drink** → opens NfcMoment animation; logs watering at 2.6s mark; routes to plant detail on completion.
- **Paired tag, <12h since last drink** → opens AlreadyWateredSheet (Confirm / Cancel).
- **Unknown/blank tag** → opens AddPlantScreen with `pendingNfcWrite=true` banner; saving writes `plant_<id>` to the tag.
- **Tag write failure** → ErrorSheet `kind='tag-write-failed'` *(component built; not yet wired)*.
- **No NFC device** → ErrorSheet `kind='nfc-unavailable'` *(component built; not yet wired)*.

NFC plugin is sponsorware. We `require()` it dynamically in `App.tsx` so the build works without it. All `Nfc.*` calls wrapped in try/catch.

Event name is `nfcTagScanned` (not `ndefMessage`). Payload decoder skips `1 + (payload[0] & 0x3f)` bytes for the language code prefix.

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
- **Em-dashes are fine.** Exclamation points are not.
- **Plants in third person** — `it`, not `your plant`.
- Mood quotes live on each Plant (user-editable) and `SpeciesProfile.defaultMood` (template).

---

## 9 · Routes

| Path | Screen | Notes |
|---|---|---|
| `/` | HomeScreen | Hybrid or by-room based on settings |
| `/plant/:id` | PlantDetail | Most code-dense screen |
| `/add` | AddPlantScreen | Search → form, supports NFC banner |
| `/settings` | SettingsScreen | 6 groups |
| `/privacy` | PrivacyPolicy | Linked from Settings → About |

Bottom-sheet overlays (`AlreadyWateredSheet`, `WateringSheet`, `ErrorSheet`, `Toast`, `NfcMoment`, `Onboarding`, `PermissionPrompt`) render at the App level, not as routes — they overlay whatever route is active. Use Capacitor `App.addListener('appUrlOpen')` for deep-link state, not separate routes.

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

- **Long plant names** — truncate with ellipsis after 22 chars on Home rows, 28 chars on Plant Detail. *(Not yet enforced — Phase 4.)*
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
| App icon (1024×1024 PNG, no transparency, no rounded corners) | Designed as `AppIconMark`; needs export via `npx capacitor-assets generate` |
| Launch screen | Designed in `src/Onboarding.tsx → LaunchScreen`; iOS `LaunchScreen.storyboard` not yet built |
| 5 marketing screenshots (1290×2796) | Designed in original `marketing.jsx`; needs render+export |
| App Store metadata | TBD — see `HANDOFF.md` §11 |
| Privacy policy URL | Content in `src/PrivacyPolicy.tsx`; needs hosting (e.g. `doosyy.github.io/outflourish/privacy`) |
| Privacy nutrition label | All "Not Collected" |
| Age rating | 4+ |

---

## 13 · Phase 4 deferred items

Tracked for future work. None block running the app in browser.

1. **App icon + iOS splash via `@capacitor/assets generate`** — needs Xcode pass.
2. **PermissionPrompt wiring** — components built (`src/PermissionPrompt.tsx`) but not inserted into Camera/Photos flow in AddPlantScreen.
3. **WateringSheet integration** — built (`src/sheets/WateringSheet.tsx`) but not yet wired to a "custom amount" affordance on Plant Detail (primary CTA still logs `recommendedMl` directly).
4. **Water-all multi-select sheet** — Home quick action currently shows an `alert()` placeholder.
5. **Error sheets routing** — `tag-unknown`/`tag-write-failed`/`nfc-unavailable`/`upload-failed` variants need integration into the NFC flow.
6. **Species library expansion** — 6 species → 150. SPECIES.md prompt template can batch-generate.
7. **EmptyRoomState** — designed but not implemented.
8. **Manage Rooms screen** — Settings → Manage rooms chevron leads nowhere yet.
9. **Hemisphere/region pickers** — Settings shows hemisphere/region as Pills, not editable yet.
10. **Reminder time pickers** — Settings reminder time/quiet hours pills not editable yet.
11. **Long plant name truncation** — not enforced.
12. **Notification appearance design** — iOS will use default banner.
13. **iCloud sync (CKShare)** — designer flagged as v1.1.
14. **Apple Watch companion** — not designed; v2.
15. **iPad layout** — not designed.
16. **Live Activity / Dynamic Island** — not designed; would be lovely.
17. **Localisation** — copy is UK/AU English only.

---

## 14 · Locked decisions (from Phase 1 Q&A)

| Question | Decision |
|---|---|
| Species library for v1 | 6 designer species only |
| Theme mode | Light only (no dark mode) |
| Plant photos | Bundle 720px JPGs in `public/species/` |
| User-uploaded photos | Add `@capacitor/camera` + `@capacitor/filesystem` (installed; not yet wired into UI) |
| Default rooms | Seed single "Living Room" (medium light) |
| Onboarding | Show once. `settings_v1.onboardingComplete=true` after step 3. Reset only via Clear all data. |
| NFC moment | Full-screen takeover, 6.5s, auto-dismiss, logs at 'watering' phase |
| Water-all | Multi-select sheet with checkboxes + per-plant ml override (placeholder for now) |
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

### NFC sponsorware pattern
- `@capawesome-team/capacitor-nfc` requires paid Insiders access — not on npm public registry.
- Pattern in `src/App.tsx`:
  ```ts
  let Nfc: { ... } | null = null
  try { Nfc = require('@capawesome-team/capacitor-nfc').Nfc } catch { /* not installed */ }
  ```
  All `Nfc.*` calls then guarded with `if (Nfc)`.

### Wave physics in PlantPhotoMeter
- `buildWavePath(yBase, size, amp)` builds a path 3× the meter width with 9 peaks. Translating by `-100%` then loops seamlessly with linear timing.
- Two layers with different speeds + different amplitudes create parallax depth.
- Layer animation is via SVG `<g>` `style.animation`, not CSS keyframes on the SVG itself — required because each meter needs a unique animation name (`uid` based on `Math.random()` + `animateKey` prop).
- Wave gradient peaks at 0.84 alpha so the underlying photo always shows through.

### Onboarding gate
- Onboarding renders only when `isLoaded && !settings.onboardingComplete`.
- The `isLoaded` flag guards against showing onboarding briefly during the initial Preferences load.

### "Why the project folder is `plant-care/`"
The local directory is `plant-care/` from the original code-only phase before the design assigned the OutFlourish name. The repo is named OutFlourish; the folder name is not a high-priority rename. The `appId` in `capacitor.config.ts` (`com.plantcare.app`) and the `package.json` `name` (`plant-care`) should be migrated to OutFlourish during Phase 4 iOS prep.

### Things to grep for when renaming
- `capacitor.config.ts` → `appId`, `appName`
- `package.json` → `name`
- `src/App.tsx` deep link URL scheme (currently parses `outflourish://` and `plantcare://` interchangeably — should narrow to outflourish:// before App Store submission)
- Settings about block (`"1.0.0 · Phase 3"` → real version)

### Phase 4 starting points
- Run `npm run cap:ios` to open Xcode and start iOS device testing.
- `Info.plist` needs `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` added before Camera/Photos plugins can prompt.
- The PlantDetail "Send to compost" button currently just opens the edit form. Should fire delete-with-confirm-modal flow.

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
