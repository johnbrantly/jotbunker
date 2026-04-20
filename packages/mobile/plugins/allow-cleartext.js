/**
 * Expo config plugin: allow cleartext traffic on Android.
 *
 * Without this, the <application> element in AndroidManifest.xml has no
 * android:usesCleartextTraffic attribute, and the Android default for
 * release builds (targetSdk >= 28) is cleartext-blocked. That means the
 * phone app's ws://<desktop-ip>:8080 WebSocket to the desktop is rejected
 * by the OS before it leaves the device — while Chrome on the same phone
 * still permits http:// requests because it ignores app-level config.
 *
 * Setting this attribute via app.config.ts's `android.usesCleartextTraffic`
 * field is a no-op: @expo/prebuild-config doesn't map that field to the
 * manifest. We have to write the attribute ourselves via withAndroidManifest.
 *
 * Scoped as broadly as possible because the LAN IP the user connects to is
 * user-configurable at pair time and can be any RFC 1918 address.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function allowCleartext(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (application && application.$) {
      application.$['android:usesCleartextTraffic'] = 'true';
    }
    return cfg;
  });
};
