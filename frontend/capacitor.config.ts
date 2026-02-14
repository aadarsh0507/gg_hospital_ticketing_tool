import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gghospital.ticketing',
  appName: 'GG Hospital Ticketing',
  webDir: 'dist',
  server: {
    url: 'https://gghospitalsticketingtool.netlify.app',
    cleartext: true, // Allow HTTP (if needed, though Netlify uses HTTPS)
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false, // Status bar doesn't overlay, takes up space - content starts below it
    },
  },
};

export default config;

