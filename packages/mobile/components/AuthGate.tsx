import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useIsFocused } from '@react-navigation/native';
import { fonts, colors as sharedColors } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface AuthGateProps {
  onUnlock: () => void;
  promptMessage: string;
  title: string;
  description: string;
  noEnrollmentDescription?: string;
  authenticateOnFocus?: boolean;
  onAuthenticated?: () => Promise<void>;
  /** When true, renders as a full-screen overlay (used for app lock) */
  overlay?: boolean;
}

export default function AuthGate({
  onUnlock,
  promptMessage,
  title,
  description,
  noEnrollmentDescription,
  authenticateOnFocus,
  onAuthenticated,
  overlay,
}: AuthGateProps) {
  const { colors, passwordGate: d } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(true);

  const authenticate = useCallback(async () => {
    setError(null);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const level = await LocalAuthentication.getEnrolledLevelAsync();

    if (!hasHardware || level === 0) {
      setEnrolled(false);
      setError('No biometric or passcode configured');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      await onAuthenticated?.();
      onUnlock();
    } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
      setError('Authentication failed');
    }
  }, [onUnlock, promptMessage, onAuthenticated]);

  const isFocused = useIsFocused();
  const shouldAuthenticate = authenticateOnFocus ? isFocused : true;
  useEffect(() => {
    if (shouldAuthenticate) {
      authenticate();
    }
  }, [shouldAuthenticate, authenticate]);

  const defaultNoEnrollment = Platform.OS === 'ios'
    ? 'Configure Face ID, Touch ID, or a device passcode in iOS Settings'
    : 'Configure fingerprint, face unlock, or a PIN/pattern in device Settings';

  const styles = useMemo(() => StyleSheet.create({
    container: overlay
      ? {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: sharedColors.background,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          zIndex: 9999,
        }
      : {
          flex: 1,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: d.paddingHorizontal,
        },
    lockIcon: {
      width: d.lockSize,
      height: d.lockSize,
      borderRadius: d.lockSize / 2,
      backgroundColor: d.lockBg,
      borderWidth: d.lockBorderWidth,
      borderColor: d.lockBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: d.lockMarginBottom,
    },
    title: {
      fontFamily: `${fonts.sans}-Black`,
      fontSize: d.titleFontSize,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
      color: colors.textSecondary,
      marginBottom: d.titleMarginBottom,
    },
    desc: {
      fontFamily: `${fonts.sans}-Regular`,
      fontSize: d.descFontSize,
      color: d.descColor,
      marginBottom: d.descMarginBottom,
      textAlign: 'center' as const,
      lineHeight: d.descFontSize * 1.5,
      paddingHorizontal: overlay ? d.paddingHorizontal : 0,
    },
    errorText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.errorFontSize,
      color: colors.destructive,
      letterSpacing: d.errorFontSize * d.errorLetterSpacing,
      marginBottom: d.errorMarginBottom,
    },
    unlockBtn: {
      marginTop: d.unlockMarginTop,
      paddingVertical: d.unlockPaddingV,
      paddingHorizontal: d.unlockPaddingH,
      borderRadius: d.unlockRadius,
      borderWidth: 1,
      backgroundColor: d.unlockEnabledBg,
      borderColor: d.unlockEnabledBorder,
    },
    unlockText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.unlockFontSize,
      letterSpacing: d.unlockFontSize * d.unlockLetterSpacing,
      color: colors.primary,
    },
  }), [colors, d, overlay]);

  return (
    <View style={styles.container}>
      <View style={styles.lockIcon}>
        <Text style={{ fontSize: d.lockIconSize }}>🔒</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>
        {enrolled
          ? description
          : noEnrollmentDescription ?? defaultNoEnrollment}
      </Text>

      {error && <Text style={styles.errorText}>{error.toUpperCase()}</Text>}

      {enrolled && (
        <TouchableOpacity style={styles.unlockBtn} onPress={authenticate}>
          <Text style={styles.unlockText}>AUTHENTICATE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
