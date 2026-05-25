import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.outflourish',
  appName: 'OutFlourish',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_outflourish',
      iconColor: '#A54E26',
    },
  },
}

export default config
