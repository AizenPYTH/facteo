/**
 * Empêche CocoaPods / Gradle de lier expo-iap et expo-camera.
 * Ces modules s’initialisent au process start (OnCreate / OpenIAP.shared)
 * et font abortir TestFlight avant le premier écran JS.
 * L’App Store publié (main) ne les contient pas.
 */
module.exports = {
  dependencies: {
    'expo-iap': {
      platforms: { ios: null, android: null },
    },
    'expo-camera': {
      platforms: { ios: null, android: null },
    },
  },
};
