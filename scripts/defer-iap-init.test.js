const fs = require('fs');
const os = require('os');
const path = require('path');

const { applyDeferredIapInit, assertDeferredIapInit } = require('./defer-iap-init');

const FIXTURE = path.join(__dirname, 'fixtures/expo-iap-5.5.0');

function copyFixture(targetRoot) {
  fs.cpSync(FIXTURE, path.join(targetRoot, 'node_modules/expo-iap'), { recursive: true });
}

function read(projectRoot, relativePath) {
  return fs.readFileSync(path.join(projectRoot, 'node_modules/expo-iap', relativePath), 'utf8');
}

function onCreateContainsSetupStore(source) {
  const start = source.indexOf('OnCreate {');
  return source.slice(start, start + 500).includes('setupStore');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inveq-defer-iap-'));
copyFixture(tmp);

assert(
  read(tmp, 'ios/ExpoIapAppDelegateSubscriber.swift').includes('_ = OpenIapModule.shared'),
  'fixture AppDelegate must contain the 5.5.0 launch crash',
);
assert(
  onCreateContainsSetupStore(read(tmp, 'ios/ExpoIapModule.swift')),
  'fixture OnCreate must contain the 5.5.0 setupStore crash',
);
assert(
  JSON.parse(read(tmp, 'expo-module.config.json')).ios.appDelegateSubscribers.includes(
    'ExpoIapAppDelegateSubscriber',
  ),
  'fixture must register ExpoIapAppDelegateSubscriber',
);

applyDeferredIapInit(tmp);
assertDeferredIapInit(tmp);

const patchedAppDelegate = read(tmp, 'ios/ExpoIapAppDelegateSubscriber.swift');
const patchedModule = read(tmp, 'ios/ExpoIapModule.swift');
const patchedConfig = JSON.parse(read(tmp, 'expo-module.config.json'));

assert(
  !patchedAppDelegate.includes('OpenIapModule.shared'),
  'patched AppDelegate must not touch OpenIapModule.shared',
);
assert(!onCreateContainsSetupStore(patchedModule), 'OnCreate must not call setupStore');
assert(
  patchedModule.includes('INVEQ_DEFERRED_IAP_SETUP'),
  'initConnection must own setupStore after the patch',
);
assert(
  Array.isArray(patchedConfig.ios.appDelegateSubscribers) &&
    patchedConfig.ios.appDelegateSubscribers.length === 0,
  'AppDelegate subscriber must be unregistered so stock Swift cannot run at launch',
);

applyDeferredIapInit(tmp);
assertDeferredIapInit(tmp);

const reenabledPath = path.join(tmp, 'node_modules/expo-iap/expo-module.config.json');
const reenabled = JSON.parse(fs.readFileSync(reenabledPath, 'utf8'));
reenabled.ios.appDelegateSubscribers = ['ExpoIapAppDelegateSubscriber'];
fs.writeFileSync(reenabledPath, `${JSON.stringify(reenabled, null, 2)}\n`);
applyDeferredIapInit(tmp);
assertDeferredIapInit(tmp);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('defer-iap-init.test.js: ok');
