// Privacy policy screen — neutral, system voice. Linked from Settings → About.

import { useNavigate } from 'react-router-dom'
import { PCT } from './tokens'
import { TopBar } from './components/UI'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen" style={{
      background: PCT.cream,
      color: PCT.ink,
      paddingBottom: 56,
    }}>
      <TopBar title="Privacy" onBack={() => navigate(-1)} />

      <div className="px-7 pt-1.5">
        <div className="mb-2.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· last updated 24 may 2026 ·</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 40, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
        }}>
          Your data<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>stays here.</span>
        </h1>
        <p className="mt-4" style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>
          OutFlourish is a local-first app. Everything lives on your phone —
          we don't have servers, we don't run analytics, and we will never sell anything to anyone.
        </p>
      </div>

      <Section n="01" title="What we store"
        body="Your plants, their photos, their watering history, and which NFC tag is paired with which. All of this is held in iOS-managed storage (@capacitor/preferences), which Apple encrypts and excludes from device-to-device transfer unless you explicitly back up to iCloud." />
      <Section n="02" title="What we collect"
        body="Nothing. No analytics, no crash logs unless you opt in through iOS Settings → Privacy → Analytics. No advertising identifiers. No third-party SDKs." />
      <Section n="03" title="What we share"
        body="Nothing. There is no network call OutFlourish makes that contains your plant data. If you export a backup, you decide where it goes — AirDrop, iCloud Drive, a USB cable. The choice is yours every time." />
      <Section n="04" title="NFC tags"
        body="The stickers on your pots store only a short identifier (e.g. plant_142). They have no battery, no radio, no memory beyond that. Anyone who scans your tag sees a number, not a name." />
      <Section n="05" title="Permissions"
        body="Camera and photo permissions are used solely to set a plant's portrait. Notification permission is used solely to nudge you when a plant is due. NFC permission is used solely to recognise paired tags." />
      <Section n="06" title="Children"
        body="The app contains no advertising, no in-app purchases, and no online communication features. It is safe for any age. We do not knowingly collect data from anyone." />
      <Section n="07" title="Contact"
        body="hello@outflourish.app — for genuine questions about your data. We'll answer within a week." />

      <div className="text-center pt-6 px-7" style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
      }}>
        Made quietly in Carlton North.
      </div>
    </div>
  )
}

function Section({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="px-7 pt-7">
      <div className="flex gap-3.5 mb-1.5">
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 22, color: PCT.terracotta, lineHeight: 1.0,
        }}>{n}</div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22, color: PCT.ink, lineHeight: 1.0,
        }}>{title}</div>
      </div>
      <div style={{
        paddingLeft: 38,
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 14.5, lineHeight: 1.55, color: PCT.inkSoft,
      }}>{body}</div>
    </div>
  )
}
