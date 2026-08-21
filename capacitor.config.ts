import type { CapacitorConfig } from "@capacitor/cli";

// SmartEco native wrapper.
// The app is a server-rendered TanStack Start app (AI classification runs on the
// server), so the native shell loads the deployed site instead of a static bundle.
const config: CapacitorConfig = {
  appId: "app.lovable.smarteco",
  appName: "SmartEco",
  webDir: "public",
  server: {
    // Point this at your published/custom domain before submitting to the stores.
    url: "https://sort-smart-mobile.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#0b1120",
      showSpinner: false,
      launchAutoHide: true,
    },
  },
};

export default config;
