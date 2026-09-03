const fs = require('fs');
const path = require('path');

/**
 * expo-iap 5.x appelle `ExpoIapHelper.setupStore` dans `OnCreate`,
 * ce qui touche `OpenIapModule.shared` au process start et abort TestFlight
 * avant le premier écran JS (builds 57/59).
 *
 * On no-op le subscriber de lancement et on déplace `setupStore` dans
 * `initConnection()`, appelé uniquement à l’ouverture de l’écran Premium.
 */

function patchAppDelegate(projectRoot) {
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

function patchExpoIapModule(projectRoot) {
  const modulePath = path.join(projectRoot, 'node_modules/expo-iap/ios/ExpoIapModule.swift');
  if (!fs.existsSync(modulePath)) {
    return;
  }

  let source = fs.readFileSync(modulePath, 'utf8');

  source = source.replace(
    /OnCreate \{ \[weak self\] in\s+Task \{ @MainActor \[weak self\] in\s+guard let self else \{ return \}\s+self\.listenerGeneration = ExpoIapHelper\.setupStore\(module: self\)\s+\}\s+\}/,
    `OnCreate { [weak self] in
            // INVEQ: StoreKit is initialized from initConnection, not process start.
            _ = self
        }`,
  );

  if (!source.includes('INVEQ_DEFERRED_IAP_SETUP')) {
    source = source.replace(
      `AsyncFunction("initConnection") { (config: [String: Any]?) async throws -> Bool in
            // Note: iOS doesn't support alternative billing config parameter
            // Config is ignored on iOS platform
            await ExpoIapHelper.waitForStoreCleanup()`,
      `AsyncFunction("initConnection") { (config: [String: Any]?) async throws -> Bool in
            // Note: iOS doesn't support alternative billing config parameter
            // Config is ignored on iOS platform
            // INVEQ_DEFERRED_IAP_SETUP
            await MainActor.run {
                if self.listenerGeneration == nil {
                    self.listenerGeneration = ExpoIapHelper.setupStore(module: self)
                }
            }
            await ExpoIapHelper.waitForStoreCleanup()`,
    );
  }

  fs.writeFileSync(modulePath, source);
}

function withDeferIapInit(config) {
  const projectRoot = config._internal?.projectRoot ?? process.cwd();
  patchAppDelegate(projectRoot);
  patchExpoIapModule(projectRoot);
  return config;
}

module.exports = withDeferIapInit;
