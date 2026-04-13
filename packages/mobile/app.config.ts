import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  autolinking: {
    exclude: process.env.EAS_BUILD_PROFILE !== 'development'
      ? ['expo-dev-client']
      : [],
  },
  name: 'Jotbunker',
  slug: 'jotbunker',
  version: '1.0.1',
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
      NSFaceIDUsageDescription: 'Jotbunker uses Face ID to protect your Locked Lists.',
      NSCameraUsageDescription: 'Jotbunker uses the camera to scan QR codes for network pairing.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0a',
    },
    edgeToEdgeEnabled: true,
    package: 'com.jotbunker.mobile',
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
    ['expo-local-authentication', {
      faceIDPermission: 'Jotbunker uses Face ID to protect your Locked Lists.',
    }],
    ['expo-camera', {
      cameraPermission: 'Jotbunker uses the camera to scan QR codes for network pairing.',
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
