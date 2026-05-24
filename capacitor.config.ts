import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.plantcare.app',
  appName: 'PlantCare',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4ade80',
    },
  },
}

export default config
