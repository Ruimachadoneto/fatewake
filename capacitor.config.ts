import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.fatewake.app',
  appName: 'Fatewake',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0B0F1A'
  },
  ios: {
    backgroundColor: '#0B0F1A'
  }
};

export default config;
