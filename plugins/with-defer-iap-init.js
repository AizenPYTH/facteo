const { withDangerousMod, withFinalizedMod } = require('expo/config-plugins');

const { applyDeferredIapInit, assertDeferredIapInit } = require('../scripts/defer-iap-init');

function patchDuringPrebuild(projectRoot, phase) {
  applyDeferredIapInit(projectRoot);
  assertDeferredIapInit(projectRoot);
  console.log(
    `[INVEQ] ${phase}: expo-iap cannot initialize StoreKit before initConnection()`,
  );
}

/**
 * Must run AFTER the "expo-iap" plugin function: that plugin's syncAutolinking
 * re-enables ExpoIapAppDelegateSubscriber in expo-module.config.json every time
 * Expo evaluates the config (including `expo export` / fingerprint).
 *
 * Dangerous mods run first during prebuild; finalized mods run last. We patch in
 * both so a later mod cannot put launch-time StoreKit back, and the build fails
 * if the crash paths are still present when Xcode/CocoaPods start.
 */
function withDeferIapInit(config) {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      patchDuringPrebuild(modConfig.modRequest.projectRoot, 'withDangerousMod');
      return modConfig;
    },
  ]);

  return withFinalizedMod(config, [
    'ios',
    async (modConfig) => {
      patchDuringPrebuild(modConfig.modRequest.projectRoot, 'withFinalizedMod');
      return modConfig;
    },
  ]);
}

module.exports = withDeferIapInit;
