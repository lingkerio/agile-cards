import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agile.acards',
  appName: '敏捷卡片',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    Http: {
      allowInsecureRequests: true,
      allowNTLMAuthentication: true,
      certificatePins: [],
      timeout: 60000
    },
    Device: {
      enabled: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
