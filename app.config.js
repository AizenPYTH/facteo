/**
 * Variante optionnelle pour un futur "Factume Dev".
 * En local on utilise Expo Go (npm start → --go), pas ce scheme.
 *
 * EAS preview/production → APP_VARIANT=production (scheme factume).
 */
const appJson = require('./app.json');

const variant = process.env.APP_VARIANT ?? 'production';
const IS_DEV = variant === 'development';

const base = appJson.expo;

module.exports = {
  expo: {
    ...base,
    name: IS_DEV ? 'Factume Dev' : base.name,
    scheme: IS_DEV ? 'factume-dev' : base.scheme,
    ios: {
      ...base.ios,
      bundleIdentifier: IS_DEV ? 'com.factume.app.dev' : base.ios.bundleIdentifier,
    },
    android: {
      ...base.android,
      package: IS_DEV ? 'com.factume.app.dev' : base.android.package,
    },
  },
};
