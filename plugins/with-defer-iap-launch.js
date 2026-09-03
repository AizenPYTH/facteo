const fs = require('fs');
const path = require('path');

/**
 * OpenIAP s’initialisait dans `didFinishLaunching` via
 * `ExpoIapAppDelegateSubscriber` (`OpenIapModule.shared`).
 * Sur un cold start TestFlight, cet accès StoreKit 2 trop tôt peut abort
 * le process avant le premier écran JS.
 *
 * L’achat / restore / Offer Code restent disponibles : `initConnection()`
 * est appelé uniquement quand l’utilisateur ouvre l’écran Premium.
 */
function disableEagerOpenIap(projectRoot) {
  const swiftPath = path.join(
    projectRoot,
    'node_modules/expo-iap/ios/ExpoIapAppDelegateSubscriber.swift',
  );

  if (!fs.existsSync(swiftPath)) {
    return;
  }

  fs.writeFileSync(
    swiftPath,
    `import ExpoModulesCore
#if canImport(UIKit)
import UIKit
#endif

public class ExpoIapAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        return true
    }
}
`,
  );
}

function withDeferIapLaunch(config) {
  const projectRoot = config._internal?.projectRoot ?? process.cwd();
  disableEagerOpenIap(projectRoot);
  return config;
}

module.exports = withDeferIapLaunch;
