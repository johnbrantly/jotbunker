import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useSegments } from 'expo-router';
import { colors } from '@jotbunker/shared';
import { useLockedListsStore } from '../stores/lockedListsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSyncSetup } from '../sync/useSyncSetup';
import AuthGate from '../components/AuthGate';
import SetupWizard from '../components/SetupWizard';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
    'DMSans-Medium': require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
    'DMSans-Bold': require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
    'DMSans-Black': require('@expo-google-fonts/dm-sans/900Black/DMSans_900Black.ttf'),
    'DMMono-Light': require('@expo-google-fonts/dm-mono/300Light/DMMono_300Light.ttf'),
    'DMMono-Regular': require('@expo-google-fonts/dm-mono/400Regular/DMMono_400Regular.ttf'),
    'DMMono-Medium': require('@expo-google-fonts/dm-mono/500Medium/DMMono_500Medium.ttf'),
  });

  // WebSocket sync
  useSyncSetup();

  const segments = useSegments();
  const isUnlocked = useLockedListsStore((s) => s.isUnlocked);
  const lock = useLockedListsStore((s) => s.lock);
  const setupComplete = useSettingsStore((s) => s.setupComplete);
  const lockedListsLockEnabled = useSettingsStore((s) => s.lockedListsLockEnabled);
  const lockedListsLockTimeout = useSettingsStore((s) => s.lockedListsLockTimeout);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);

  // Track store hydration
  const [hydrated, setHydrated] = useState(useSettingsStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useSettingsStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [hydrated]);

  const handleSetupComplete = useCallback(() => {
    // setupComplete is already set inside SetupWizard
  }, []);

  // App Lock state
  const [appLocked, setAppLocked] = useState(appLockEnabled);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Keep appLocked in sync when setting is toggled off
  useEffect(() => {
    if (!appLockEnabled) setAppLocked(false);
  }, [appLockEnabled]);

  // Listen for app going background → active
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appLockEnabled &&
        appStateRef.current === 'background' &&
        nextState === 'active'
      ) {
        setAppLocked(true);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [appLockEnabled]);

  const handleAppUnlock = useCallback(() => {
    setAppLocked(false);
  }, []);

  useEffect(() => {
    if (!lockedListsLockEnabled) return;
    const isOnLockedLists = segments.includes('lockedLists' as never);
    if (!isOnLockedLists && isUnlocked) {
      const timer = setTimeout(() => lock(), lockedListsLockTimeout);
      return () => clearTimeout(timer);
    }
  }, [segments, isUnlocked, lock, lockedListsLockEnabled, lockedListsLockTimeout]);

  // Hide splash once fonts loaded AND hydrated AND app lock resolved
  useEffect(() => {
    if (fontsLoaded && hydrated && !(appLockEnabled && appLocked)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated, appLockEnabled, appLocked]);

  // Don't render any Text until fonts are loaded
  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="scan-qr"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      {hydrated && !setupComplete && <SetupWizard onComplete={handleSetupComplete} />}
      {appLockEnabled && appLocked && (
        <AuthGate
          onUnlock={handleAppUnlock}
          promptMessage="Unlock Jotbunker"
          title="APP LOCKED"
          description="Authenticate to unlock Jotbunker"
          noEnrollmentDescription={Platform.OS === 'ios'
            ? 'Configure Face ID, Touch ID, or a device passcode in iOS Settings'
            : 'Configure fingerprint, face unlock, or a PIN/pattern in device Settings'}
          overlay
        />
      )}
    </GestureHandlerRootView>
  );
}
