import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import { colors, fonts } from '@jotbunker/shared';
import { useSettingsStore } from '../stores/settingsStore';

export default function ScanQrScreen() {
  const router = useRouter();
  const nav = useNavigationContainerRef();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const setSyncServerIp = useSettingsStore((s) => s.setSyncServerIp);
  const setSyncPort = useSettingsStore((s) => s.setSyncPort);
  const setSyncPairingSecret = useSettingsStore((s) => s.setSyncPairingSecret);

  const goBack = () => {
    if (nav.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    try {
      const parsed = JSON.parse(data);
      if (
        typeof parsed.ip === 'string' &&
        parsed.ip.length > 0 &&
        typeof parsed.port === 'number' &&
        parsed.port >= 1 &&
        parsed.port <= 65535 &&
        typeof parsed.secret === 'string' &&
        parsed.secret.length > 0
      ) {
        setScanned(true);
        setSyncServerIp(parsed.ip);
        setSyncPort(parsed.port);
        setSyncPairingSecret(parsed.secret);
        goBack();
      }
    } catch {
      // ignore non-JSON codes
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    const denied = !permission.canAskAgain;
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          {denied
            ? 'Camera access was denied. Open Settings to enable it for Jotbunker.'
            : 'Camera access is needed to scan the pairing QR code.'}
        </Text>
        {denied ? (
          <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionBtnText}>OPEN SETTINGS</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>ALLOW CAMERA</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => goBack()}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instruction}>
          Point at the QR code on your computer
        </Text>

        <View style={styles.frame}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => goBack()}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FRAME_SIZE = 220;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 14,
    letterSpacing: 14 * 0.06,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginBottom: 48,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  permissionText: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  permissionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  permissionBtnText: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 13,
    letterSpacing: 13 * 0.1,
    color: colors.background,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelText: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 12,
    letterSpacing: 12 * 0.1,
    color: '#fff',
  },
});
