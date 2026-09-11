'use strict';

const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withFinalizedMod,
  withPodfile,
} = require('@expo/config-plugins');
const { applyAndVerify } = require('./defer-iap-init-core');

const POD_APPLY_MARKER = 'INVEQ_APPLY_EXPO_IAP_PATCH';
const POD_ASSERT_MARKER = 'INVEQ_ASSERT_EXPO_IAP_PATCH';

/**
 * Must stay true in committed code. Set to false only to prove that
 * `expo prebuild` fails when the patch is not actually applied.
 */
const APPLY_EXPO_IAP_PATCH = true;

const POD_PRE_AUTOLINK = `
  # ${POD_APPLY_MARKER}
  inveq_iap_root = File.expand_path('..', __dir__)
  inveq_iap_script = File.join(inveq_iap_root, 'plugins', 'defer-iap-init-core.js')
  unless system('node', inveq_iap_script, inveq_iap_root)
    raise '[with-defer-iap-init] Le patch expo-iap a échoué avant use_expo_modules!'
  end
`;

const POD_POST_INSTALL = `
    # ${POD_ASSERT_MARKER}
    inveq_iap_root = File.expand_path('..', __dir__)
    inveq_iap_script = File.join(inveq_iap_root, 'plugins', 'defer-iap-init-core.js')
    unless system('node', inveq_iap_script, inveq_iap_root)
      raise '[with-defer-iap-init] Le patch expo-iap est absent après pod install'
    end
`;

function fail(message) {
  throw new Error(`[with-defer-iap-init] ${message}`);
}

function patchFromMod(config, apply) {
  const projectRoot = config.modRequest?.projectRoot;
  if (!projectRoot) {
    fail('modRequest.projectRoot manquant — le plugin doit s’exécuter pendant prebuild');
  }
  applyAndVerify(projectRoot, { apply });
  return config;
}

function injectPodfileHooks(contents) {
  if (!contents.includes('use_expo_modules!')) {
    fail('Podfile sans use_expo_modules! — impossible d’injecter le patch avant l’autolinking');
  }
  if (!contents.includes('post_install do |installer|')) {
    fail('Podfile sans post_install — impossible d’asserter le patch pendant pod install');
  }

  let next = contents;
  if (!next.includes(POD_APPLY_MARKER)) {
    next = next.replace(
      '  use_expo_modules!',
      `${POD_PRE_AUTOLINK}\n  use_expo_modules!`,
    );
  }
  if (!next.includes(POD_APPLY_MARKER)) {
    fail('Injection du patch avant use_expo_modules! a échoué');
  }

  if (!next.includes(POD_ASSERT_MARKER)) {
    next = next.replace(
      '  post_install do |installer|',
      `  post_install do |installer|${POD_POST_INSTALL}`,
    );
  }
  if (!next.includes(POD_ASSERT_MARKER)) {
    fail('Injection de l’assert post_install a échoué');
  }

  return next;
}

function withDeferIapInit(config) {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => patchFromMod(modConfig, APPLY_EXPO_IAP_PATCH),
  ]);

  config = withPodfile(config, (modConfig) => {
    modConfig.modResults.contents = injectPodfileHooks(modConfig.modResults.contents);
    return modConfig;
  });

  config = withFinalizedMod(config, [
    'ios',
    async (modConfig) => {
      patchFromMod(modConfig, APPLY_EXPO_IAP_PATCH);

      const podfilePath = path.join(modConfig.modRequest.projectRoot, 'ios', 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        fail(`Podfile généré introuvable: ${podfilePath}`);
      }
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes(POD_APPLY_MARKER) || !podfile.includes(POD_ASSERT_MARKER)) {
        const rewritten = injectPodfileHooks(podfile);
        fs.writeFileSync(podfilePath, rewritten, 'utf8');
        const after = fs.readFileSync(podfilePath, 'utf8');
        if (!after.includes(POD_APPLY_MARKER) || !after.includes(POD_ASSERT_MARKER)) {
          fail('Les hooks Podfile expo-iap sont absents après withFinalizedMod');
        }
      }

      return modConfig;
    },
  ]);

  return config;
}

module.exports = withDeferIapInit;
