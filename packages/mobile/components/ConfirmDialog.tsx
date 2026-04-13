import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'CLEAR',
  onConfirm,
  onCancel,
}: Props) {
  const { colors, confirmDialog: d } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: d.overlayBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    box: {
      backgroundColor: colors.dialogBg,
      borderWidth: 1,
      borderColor: colors.dialogBorder,
      borderRadius: d.boxRadius,
      paddingVertical: d.boxPaddingV,
      paddingHorizontal: d.boxPaddingH,
      width: d.boxWidth,
      alignItems: 'center',
      gap: d.boxGap,
    },
    icon: {
      width: d.iconSize,
      height: d.iconSize,
      borderRadius: d.iconSize / 2,
      backgroundColor: d.iconBg,
      borderWidth: d.iconBorderWidth,
      borderColor: d.iconBorderColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: d.iconFontSize,
      color: colors.destructive,
    },
    textContainer: {
      alignItems: 'center',
    },
    title: {
      fontFamily: `${fonts.sans}-Black`,
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
    },
    msg: {
      fontSize: d.msgFontSize,
      color: d.msgColor,
      marginTop: d.msgMarginTop,
      lineHeight: d.msgFontSize * d.msgLineHeight,
      textAlign: 'center',
    },
    btnRow: {
      flexDirection: 'row',
      gap: d.btnGap,
      width: '100%',
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderColor: d.cancelBorder,
      alignItems: 'center',
    },
    cancelText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.confirmBg,
      borderWidth: 1,
      borderColor: d.confirmBorder,
      alignItems: 'center',
    },
    confirmText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.destructive,
    },
  }), [colors, d]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={d.blurAmount} tint="dark" style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>✕</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.msg}>{message}</Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
