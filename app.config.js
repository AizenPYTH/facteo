/**
 * Variante optionnelle pour un futur "INVEQ Dev".
 * En local on utilise Expo Go (npm start → --go), pas ce scheme.
 *
 * EAS preview/production → APP_VARIANT=production (scheme inveq).
 */
const appJson = require('./app.json');

const variant = process.env.APP_VARIANT ?? 'production';
const IS_DEV = variant === 'development';

const base = appJson.expo;
const plugins = [...(base.plugins ?? [])];

if (
  !plugins.some(
    (plugin) => plugin === 'expo-iap' || (Array.isArray(plugin) && plugin[0] === 'expo-iap'),
  )
) {
  plugins.push('expo-iap');
}

module.exports = {
  expo: {
    ...base,
    name: IS_DEV ? 'INVEQ Dev' : base.name,
    scheme: IS_DEV ? 'inveq-dev' : base.scheme,
    plugins,
    ios: {
      ...base.ios,
      bundleIdentifier: IS_DEV ? 'com.inveq.app.dev' : base.ios.bundleIdentifier,
    },
    android: {
      ...base.android,
      package: IS_DEV ? 'com.inveq.app.dev' : base.android.package,
    },
  },
};
