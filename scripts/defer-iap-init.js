/**
 * Makes expo-iap 5.x unable to touch StoreKit / OpenIapModule.shared at process start.
 *
 * Stock expo-iap@5.5.0 does two things before the first JS frame:
 * 1. ExpoIapAppDelegateSubscriber.didFinishLaunching → `_ = OpenIapModule.shared`
 * 2. ExpoIapModule.OnCreate → ExpoIapHelper.setupStore → OpenIapModule.shared listeners
 *
 * Build 61 (iap unlinked) launched. Build 59 (AppDelegate no-op only) still crashed
 * because OnCreate still ran. Build 63 tried to patch both via a config-plugin side
 * effect that silently no-ops and is not a withDangerousMod — EAS compiled stock sources.
 *
 * This script is applied from eas-build-post-install AND from withDangerousMod during
 * prebuild. It throws if the crash paths remain, so a TestFlight binary cannot ship
 * with launch-time StoreKit init.
 */
const fs = require('fs');
const path = require('path');

const DEFERRED_ONCREATE_MARKER = 'INVEQ_DEFERRED_IAP_ONCREATE';
const DEFERRED_SETUP_MARKER = 'INVEQ_DEFERRED_IAP_SETUP';

const NOOP_APP_DELEGATE = `import ExpoModulesCore
#if canImport(UIKit)
import UIKit
#endif

public class ExpoIapAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // INVEQ: do not touch StoreKit here. Connection starts from JS initConnection.
        return true
    }
}
`;

function expoIapRoot(projectRoot) {
  return path.join(projectRoot, 'node_modules/expo-iap');
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new Error('expo-iap: unbalanced braces while patching OnCreate');
}

function extractOnCreateBlock(source) {
  const start = source.indexOf('OnCreate {');
  if (start === -1) {
    throw new Error('expo-iap: OnCreate block not found in ExpoIapModule.swift');
  }
  const openBrace = source.indexOf('{', start);
  const end = findMatchingBrace(source, openBrace);
  return { start, end, block: source.slice(start, end + 1) };
}

function patchAppDelegate(projectRoot) {
  const swiftPath = path.join(expoIapRoot(projectRoot), 'ios/ExpoIapAppDelegateSubscriber.swift');
  if (!fs.existsSync(swiftPath)) {
    throw new Error(`expo-iap: missing ${swiftPath}`);
  }
  fs.writeFileSync(swiftPath, NOOP_APP_DELEGATE);
}

function patchExpoIapModule(projectRoot) {
  const modulePath = path.join(expoIapRoot(projectRoot), 'ios/ExpoIapModule.swift');
  if (!fs.existsSync(modulePath)) {
    throw new Error(`expo-iap: missing ${modulePath}`);
  }

  let source = fs.readFileSync(modulePath, 'utf8');
  const { start, end, block } = extractOnCreateBlock(source);

  if (block.includes('setupStore') || !block.includes(DEFERRED_ONCREATE_MARKER)) {
    const replacement = `OnCreate { [weak self] in
            // ${DEFERRED_ONCREATE_MARKER}
            _ = self
        }`;
    source = `${source.slice(0, start)}${replacement}${source.slice(end + 1)}`;
  }

  if (!source.includes(DEFERRED_SETUP_MARKER)) {
    const waitLine = 'await ExpoIapHelper.waitForStoreCleanup()';
    const waitIndex = source.indexOf(waitLine);
    if (waitIndex === -1) {
      throw new Error(
        'expo-iap: initConnection does not contain waitForStoreCleanup(); cannot defer setupStore',
      );
    }
    source = `${source.slice(0, waitIndex)}// ${DEFERRED_SETUP_MARKER}
            await MainActor.run {
                if self.listenerGeneration == nil {
                    self.listenerGeneration = ExpoIapHelper.setupStore(module: self)
                }
            }
            ${source.slice(waitIndex)}`;
  }

  fs.writeFileSync(modulePath, source);
}

function patchAutolinkingConfig(projectRoot) {
  const configPath = path.join(expoIapRoot(projectRoot), 'expo-module.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`expo-iap: missing ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.ios = config.ios ?? {};
  config.ios.appDelegateSubscribers = [];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function applyDeferredIapInit(projectRoot) {
  const root = expoIapRoot(projectRoot);
  if (!fs.existsSync(root)) {
    throw new Error(`expo-iap is not installed at ${root}`);
  }
  patchAppDelegate(projectRoot);
  patchExpoIapModule(projectRoot);
  patchAutolinkingConfig(projectRoot);
}

function assertDeferredIapInit(projectRoot) {
  const appDelegate = fs.readFileSync(
    path.join(expoIapRoot(projectRoot), 'ios/ExpoIapAppDelegateSubscriber.swift'),
    'utf8',
  );
  const moduleSource = fs.readFileSync(
    path.join(expoIapRoot(projectRoot), 'ios/ExpoIapModule.swift'),
    'utf8',
  );
  const autolink = JSON.parse(
    fs.readFileSync(path.join(expoIapRoot(projectRoot), 'expo-module.config.json'), 'utf8'),
  );
  const { block: onCreate } = extractOnCreateBlock(moduleSource);

  if (/\bOpenIapModule\b/.test(appDelegate) || /^\s*import OpenIAP\s*$/m.test(appDelegate)) {
    throw new Error(
      'INVEQ IAP launch guard: ExpoIapAppDelegateSubscriber still references OpenIAP at launch',
    );
  }
  if (onCreate.includes('setupStore') || onCreate.includes('OpenIapModule')) {
    throw new Error(
      'INVEQ IAP launch guard: ExpoIapModule.OnCreate still initializes StoreKit (setupStore / OpenIapModule)',
    );
  }
  if (!onCreate.includes(DEFERRED_ONCREATE_MARKER)) {
    throw new Error('INVEQ IAP launch guard: OnCreate was not replaced with the deferred marker');
  }
  if (!moduleSource.includes(DEFERRED_SETUP_MARKER)) {
    throw new Error('INVEQ IAP launch guard: initConnection is missing deferred setupStore');
  }
  if (!moduleSource.includes('ExpoIapHelper.setupStore(module: self)')) {
    throw new Error(
      'INVEQ IAP launch guard: setupStore was not moved into initConnection; IAP would never start',
    );
  }
  const subscribers = autolink.ios?.appDelegateSubscribers ?? [];
  if (subscribers.includes('ExpoIapAppDelegateSubscriber')) {
    throw new Error(
      'INVEQ IAP launch guard: ExpoIapAppDelegateSubscriber is still registered in expo-module.config.json',
    );
  }
}

function runCli() {
  const projectRoot = process.cwd();
  applyDeferredIapInit(projectRoot);
  assertDeferredIapInit(projectRoot);
  console.log(
    '[INVEQ] expo-iap launch StoreKit deferred: AppDelegate subscriber unregistered, OnCreate no-op, setupStore only in initConnection',
  );
}

module.exports = {
  applyDeferredIapInit,
  assertDeferredIapInit,
  DEFERRED_ONCREATE_MARKER,
  DEFERRED_SETUP_MARKER,
};

if (require.main === module) {
  runCli();
}
