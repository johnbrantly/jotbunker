import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  autolinking: {
    exclude: process.env.EAS_BUILD_PROFILE !== 'development'
      ? ['expo-dev-client']
      : [],
  },
  name: 'JotBunker',
  slug: 'jotbunker',
  version: '1.0.7',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  scheme: 'jotbunker',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0a',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.jotbunker.mobile',
    infoPlist: {
      NSFaceIDUsageDescription: 'JotBunker uses Face ID to protect your Locked Lists.',
      NSCameraUsageDescription: 'JotBunker uses the camera to scan QR codes for network pairing.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0a',
    },
    edgeToEdgeEnabled: true,
    package: 'com.jotbunker.myapp',
    // Cleartext traffic is enabled via the ./plugins/allow-cleartext plugin
    // below. Setting `usesCleartextTraffic: true` here does nothing —
    // @expo/prebuild-config doesn't map this ExpoConfig field to the manifest.
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.CAMERA',
    ],
  },
  plugins: [
    'expo-router',
    'expo-audio',
    './plugins/fix-expo-asset',
    './plugins/allow-cleartext',
    ['expo-local-authentication', {
      faceIDPermission: 'JotBunker uses Face ID to protect your Locked Lists.',
    }],
    ['expo-camera', {
      cameraPermission: 'JotBunker uses the camera to scan QR codes for network pairing.',
    }],
    // expo-font plugin: ANDROID ONLY. iOS is intentionally not configured here
    // because iOS has been shipping successfully via the useFonts() hook in
    // app/_layout.tsx for months. Don't swap iOS's font-loading mechanism in
    // the same commit that fixes Android. Revisit only after Android is green
    // and iOS has a separate, intentional migration.
    ['expo-font', {
      android: {
        fonts: [
          {
            fontFamily: 'DMSans-Light',
            fontDefinitions: [{ path: './assets/fonts/DMSans_300Light.ttf', weight: 300 }],
          },
          {
            fontFamily: 'DMSans-Regular',
            fontDefinitions: [{ path: './assets/fonts/DMSans_400Regular.ttf', weight: 400 }],
          },
          {
            fontFamily: 'DMSans-Medium',
            fontDefinitions: [{ path: './assets/fonts/DMSans_500Medium.ttf', weight: 500 }],
          },
          {
            fontFamily: 'DMSans-Bold',
            fontDefinitions: [{ path: './assets/fonts/DMSans_700Bold.ttf', weight: 700 }],
          },
          {
            fontFamily: 'DMSans-Black',
            fontDefinitions: [{ path: './assets/fonts/DMSans_900Black.ttf', weight: 900 }],
          },
          {
            fontFamily: 'DMMono-Light',
            fontDefinitions: [{ path: './assets/fonts/DMMono_300Light.ttf', weight: 300 }],
          },
          {
            fontFamily: 'DMMono-Regular',
            fontDefinitions: [{ path: './assets/fonts/DMMono_400Regular.ttf', weight: 400 }],
          },
          {
            fontFamily: 'DMMono-Medium',
            fontDefinitions: [{ path: './assets/fonts/DMMono_500Medium.ttf', weight: 500 }],
          },
          // Ionicons uses the SIMPLE STRING variant, not the object variant above.
          // Why: <Ionicons> (from @expo/vector-icons) guards its render with
          //   state = { fontIsLoaded: Font.isLoaded('ionicons') }
          //   if (!this.state.fontIsLoaded) return <Text />;   // empty, zero hitbox
          // (see node_modules/@expo/vector-icons/build/createIconSet.js:56, 78-80).
          // On Android, Font.isLoaded() ends up in FontLoaderModule.kt's
          // queryCustomNativeFonts() which ONLY scans assets/fonts/, NOT res/font/.
          // Object-variant entries (DMSans/DMMono above) land in res/font/ and are
          // registered via ReactFontManager.addCustomFont(); that works for plain
          // <Text style={{fontFamily}}> but does NOT surface in Font.isLoaded(),
          // so the guard above would fail and the icon would never render.
          // Simple string variant copies to app/src/main/assets/fonts/ where RN
          // auto-loads AND expo-font reports as loaded. Filename (minus ext) is
          // the registered family name, so the file is lowercase 'ionicons.ttf'
          // to match createIconSet's 'ionicons' query.
          './assets/fonts/ionicons.ttf',
        ],
      },
    }],
  ],
  extra: {
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  owner: process.env.EAS_OWNER,
})
