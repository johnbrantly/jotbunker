/**
 * Expo config plugin: fixes expo-asset version mismatch on Android.
 *
 * expo-audio@1.1.1 declares "expo-asset": "*" as a peer dep, causing npm to
 * hoist expo-asset@55 (SDK 55). Its Android Kotlin code calls
 * AppContext.getFilePermission() which doesn't exist in SDK 54's
 * expo-modules-core. This plugin redirects the Android gradle project to use
 * the correct expo-asset@12 nested under expo's own node_modules.
 *
 * iOS is unaffected — settings.gradle is Android-only.
 */
const { withSettingsGradle } = require('@expo/config-plugins');

module.exports = function fixExpoAsset(config) {
  return withSettingsGradle(config, (config) => {
    const override = [
      '',
      '// Fix: redirect expo-asset to SDK 54 compatible version (v12)',
      "def correctExpoAsset = new File(rootDir, '../../node_modules/expo/node_modules/expo-asset/android')",
      'if (correctExpoAsset.exists()) {',
      "    project(':expo-asset').projectDir = correctExpoAsset",
      '}',
    ].join('\n');

    // Append at the very end so nothing overrides it after
    config.modResults.contents += override;
    return config;
  });
};
