'use strict';

const fs = require('fs');
const path = require('path');

const MARKER_DELEGATE = 'INVEQ_DEFERRED_IAP_DELEGATE';
const MARKER_ONCREATE = 'INVEQ_DEFERRED_IAP_ONCREATE';
const MARKER_SETUP = 'INVEQ_DEFERRED_IAP_SETUP';

const STOCK_ONCREATE = `        OnCreate { [weak self] in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.listenerGeneration = ExpoIapHelper.setupStore(module: self)
            }
        }`;

const PATCHED_ONCREATE = `        OnCreate { [weak self] in
            // ${MARKER_ONCREATE}
            _ = self
        }`;

const STOCK_INIT_PREFIX = `        AsyncFunction("initConnection") { (config: [String: Any]?) async throws -> Bool in
            // Note: iOS doesn't support alternative billing config parameter
            // Config is ignored on iOS platform
            await ExpoIapHelper.waitForStoreCleanup()`;

const PATCHED_INIT_PREFIX = `        AsyncFunction("initConnection") { (config: [String: Any]?) async throws -> Bool in
            // Note: iOS doesn't support alternative billing config parameter
            // Config is ignored on iOS platform
            // ${MARKER_SETUP}
            await MainActor.run {
                if self.listenerGeneration == nil {
                    self.listenerGeneration = ExpoIapHelper.setupStore(module: self)
                }
            }
            await ExpoIapHelper.waitForStoreCleanup()`;

const PATCHED_APP_DELEGATE = `import ExpoModulesCore
#if canImport(UIKit)
import UIKit
#endif

public class ExpoIapAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // ${MARKER_DELEGATE}
        return true
    }
}
`;

function fail(message) {
  throw new Error(`[with-defer-iap-init] ${message}`);
}

function iapPaths(projectRoot) {
  return {
    appDelegate: path.join(
      projectRoot,
      'node_modules/expo-iap/ios/ExpoIapAppDelegateSubscriber.swift',
    ),
    module: path.join(projectRoot, 'node_modules/expo-iap/ios/ExpoIapModule.swift'),
    moduleConfig: path.join(projectRoot, 'node_modules/expo-iap/expo-module.config.json'),
  };
}

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} introuvable: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function writeThenRead(filePath, contents) {
  fs.writeFileSync(filePath, contents, 'utf8');
  return fs.readFileSync(filePath, 'utf8');
}

function extractOnCreate(source) {
  const match = source.match(/OnCreate \{[\s\S]*?\n        \}/);
  if (!match) {
    fail('Bloc OnCreate introuvable dans ExpoIapModule.swift');
  }
  return match[0];
}

function extractInitConnection(source) {
  const match = source.match(
    /AsyncFunction\("initConnection"\)[\s\S]*?return isConnected\s*\n        \}/,
  );
  if (!match) {
    fail('Bloc initConnection introuvable dans ExpoIapModule.swift');
  }
  return match[0];
}

function assertAppDelegatePatched(source, filePath) {
  if (!source.includes('class ExpoIapAppDelegateSubscriber')) {
    fail(`ExpoIapAppDelegateSubscriber absent de ${filePath}`);
  }
  if (!source.includes(MARKER_DELEGATE)) {
    fail(`Marqueur ${MARKER_DELEGATE} absent après écriture de ${filePath}`);
  }
  if (source.includes('OpenIapModule') || source.includes('import OpenIAP')) {
    fail(`OpenIAP est encore référencé dans ${filePath} après le patch`);
  }
}

function assertModulePatched(source, filePath) {
  const onCreate = extractOnCreate(source);
  if (onCreate.includes('setupStore')) {
    fail(`OnCreate appelle encore setupStore dans ${filePath}`);
  }
  if (!onCreate.includes(MARKER_ONCREATE)) {
    fail(`Marqueur ${MARKER_ONCREATE} absent du OnCreate dans ${filePath}`);
  }

  const initConnection = extractInitConnection(source);
  if (!initConnection.includes(MARKER_SETUP)) {
    fail(`Marqueur ${MARKER_SETUP} absent de initConnection dans ${filePath}`);
  }
  if (!initConnection.includes('ExpoIapHelper.setupStore(module: self)')) {
    fail(`setupStore n'a pas été déplacé dans initConnection (${filePath})`);
  }
}

function assertModuleConfigPatched(raw, filePath) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`JSON invalide dans ${filePath}: ${error.message}`);
  }

  const subscribers = parsed?.ios?.appDelegateSubscribers ?? [];
  if (subscribers.includes('ExpoIapAppDelegateSubscriber')) {
    fail(
      `expo-module.config.json liste encore ExpoIapAppDelegateSubscriber (${filePath})`,
    );
  }
  const modules = parsed?.ios?.modules ?? [];
  if (!modules.includes('ExpoIapModule')) {
    fail(`ExpoIapModule a disparu de ${filePath}`);
  }
}

function applyAppDelegate(filePath, apply) {
  const source = readRequired(filePath, 'ExpoIapAppDelegateSubscriber.swift');
  if (!source.includes('class ExpoIapAppDelegateSubscriber')) {
    fail(`Le fichier ${filePath} n'est pas ExpoIapAppDelegateSubscriber.swift`);
  }

  if (apply) {
    const after = writeThenRead(filePath, PATCHED_APP_DELEGATE);
    assertAppDelegatePatched(after, filePath);
    return;
  }

  assertAppDelegatePatched(source, filePath);
}

function applyModule(filePath, apply) {
  let source = readRequired(filePath, 'ExpoIapModule.swift');

  if (apply) {
    const onCreate = extractOnCreate(source);
    if (!onCreate.includes(MARKER_ONCREATE)) {
      if (!source.includes(STOCK_ONCREATE)) {
        fail(
          `OnCreate stock expo-iap 5.5.0 introuvable dans ${filePath}. Contenu actuel:\n${onCreate}`,
        );
      }
      source = source.replace(STOCK_ONCREATE, PATCHED_ONCREATE);
    }

    const initConnection = extractInitConnection(source);
    if (!initConnection.includes(MARKER_SETUP)) {
      if (!source.includes(STOCK_INIT_PREFIX)) {
        fail(`Préfixe initConnection stock introuvable dans ${filePath}`);
      }
      source = source.replace(STOCK_INIT_PREFIX, PATCHED_INIT_PREFIX);
    }

    source = writeThenRead(filePath, source);
  }

  assertModulePatched(source, filePath);
}

function applyModuleConfig(filePath, apply) {
  const raw = readRequired(filePath, 'expo-module.config.json');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`JSON invalide dans ${filePath}: ${error.message}`);
  }

  if (apply) {
    if (!parsed.ios || typeof parsed.ios !== 'object') {
      fail(`Clé ios absente de ${filePath}`);
    }
    const subscribers = Array.isArray(parsed.ios.appDelegateSubscribers)
      ? parsed.ios.appDelegateSubscribers
      : [];
    parsed.ios.appDelegateSubscribers = subscribers.filter(
      (name) => name !== 'ExpoIapAppDelegateSubscriber',
    );
    const after = writeThenRead(filePath, `${JSON.stringify(parsed, null, 2)}\n`);
    assertModuleConfigPatched(after, filePath);
    return;
  }

  assertModuleConfigPatched(raw, filePath);
}

function applyAndVerify(projectRoot, { apply }) {
  if (!projectRoot) {
    fail('projectRoot manquant');
  }

  const files = iapPaths(projectRoot);
  applyAppDelegate(files.appDelegate, apply);
  applyModule(files.module, apply);
  applyModuleConfig(files.moduleConfig, apply);

  const appDelegate = fs.readFileSync(files.appDelegate, 'utf8');
  const moduleSource = fs.readFileSync(files.module, 'utf8');
  const moduleConfig = fs.readFileSync(files.moduleConfig, 'utf8');
  assertAppDelegatePatched(appDelegate, files.appDelegate);
  assertModulePatched(moduleSource, files.module);
  assertModuleConfigPatched(moduleConfig, files.moduleConfig);
}

module.exports = {
  MARKER_DELEGATE,
  MARKER_ONCREATE,
  MARKER_SETUP,
  applyAndVerify,
  iapPaths,
};

if (require.main === module) {
  const projectRoot = path.resolve(process.argv[2] || process.cwd());
  applyAndVerify(projectRoot, { apply: true });
  process.stdout.write(
    `[with-defer-iap-init] Patch expo-iap vérifié sur disque dans ${projectRoot}\n`,
  );
}
