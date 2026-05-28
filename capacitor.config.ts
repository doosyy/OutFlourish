import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.outflourish',
  appName: 'OutFlourish',
  webDir: 'dist',
  // Cream WKWebView background. Without this the WebView shows its default
  // black underneath the safe-area inset, which becomes visible after the
  // iOS NFC scan sheet dismisses and triggers a layout reflow.
  // MUST exactly match PCT.cream (oklch(0.965 0.012 80) === #f8f3eb); a
  // mismatch shows as a faint colour band in the status-bar / home-indicator
  // safe areas where the native background peeks through.
  backgroundColor: '#f8f3eb',
  ios: {
    // 'never' lets web content extend behind the status bar so our cream
    // body fills the whole screen. We push content down with var(--sat) at
    // the per-screen level (HomeScreen, PlantDetail, etc).
    contentInset: 'never',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_outflourish',
      iconColor: '#A54E26',
    },
  },
}

export default config
