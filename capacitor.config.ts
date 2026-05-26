import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.outflourish',
  appName: 'OutFlourish',
  webDir: 'dist',
  // Cream WKWebView background. Without this the WebView shows its default
  // black underneath the safe-area inset, which becomes visible after the
  // iOS NFC scan sheet dismisses and triggers a layout reflow.
  backgroundColor: '#fbf9f6',
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
