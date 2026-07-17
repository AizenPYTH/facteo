/**
 * Variante optionnelle pour un futur "FACTEO Dev".
 * En local on utilise Expo Go (npm start → --go), pas ce scheme.
 *
 * EAS preview/production → APP_VARIANT=production (scheme facteo).
 */
const appJson = require('./app.json');

const variant = process.env.APP_VARIANT ?? 'production';
const IS_DEV = variant === 'development';

const base = appJson.expo;

module.exports = {
  expo: {
    ...base,
    name: IS_DEV ? 'FACTEO Dev' : base.name,
    scheme: IS_DEV ? 'facteo-dev' : base.scheme,
    ios: {
      ...base.ios,
      bundleIdentifier: IS_DEV ? 'com.facteo.app.dev' : base.ios.bundleIdentifier,
    },
    android: {
      ...base.android,
      package: IS_DEV ? 'com.facteo.app.dev' : base.android.package,
    },
  },
};
