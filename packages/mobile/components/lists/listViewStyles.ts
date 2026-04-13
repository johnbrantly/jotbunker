import { StyleSheet } from 'react-native';
import { fonts, header } from '@jotbunker/shared';
import type { Theme } from '@jotbunker/shared';

export type Styles = ReturnType<typeof createStyles>;

export function createStyles(colors: Theme['colors'], lv: Theme['listView'], fontSizeOverride?: number) {
  const textSize = fontSizeOverride ?? lv.textFontSize;
  const inputSize = fontSizeOverride ?? lv.inputFontSize;
  return StyleSheet.create({
    headerContainer: {
      paddingTop: header.padding.top,
      paddingBottom: header.padding.top,
      paddingHorizontal: header.padding.horizontal,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIcon: {
      width: 52,
      height: 52,
      marginRight: 6,
      opacity: 0.5,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      fontFamily: `${fonts.sans}-Black`,
      fontSize: header.headerLabelSize,
      letterSpacing: header.headerLabelSize * header.headerLabelLetterSpacing,
      color: colors.textSecondary,
    },
    lockIcon: {
      fontSize: 10,
      opacity: 0.6,
    },
    headerLabel: {
      fontFamily: `${fonts.mono}-Light`,
      fontSize: header.headerNumberSize,
      color: colors.primary,
      lineHeight: header.headerNumberSize * header.headerNumberLineHeight,
    },
    lockedBadge: {
      backgroundColor: lv.encryptedBadgeBg,
      paddingVertical: lv.encryptedBadgePaddingV,
      paddingHorizontal: lv.encryptedBadgePaddingH,
      borderRadius: lv.encryptedBadgeRadius,
      borderWidth: 1,
      borderColor: lv.encryptedBadgeBorder,
    },
    lockedText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: lv.encryptedBadgeFontSize,
      letterSpacing: lv.encryptedBadgeFontSize * lv.encryptedBadgeLetterSpacing,
      color: lv.encryptedBadgeColor,
    },
    divider: {
      height: header.dividerHeight,
      backgroundColor: colors.border,
      marginTop: header.dividerMarginTop,
      marginHorizontal: header.padding.horizontal,
    },
    listContainer: {
      flex: 1,
      minHeight: 0,
    },
    inputRow: {
      paddingTop: lv.inputPadding.top,
      paddingRight: lv.inputPadding.right,
      paddingBottom: lv.inputPadding.bottom,
      paddingLeft: lv.inputPadding.left,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.inputRowBg,
    },
    input: {
      width: '100%',
      backgroundColor: 'transparent',
      color: colors.textPrimary,
      fontFamily: `${fonts.sans}-Regular`,
      fontSize: inputSize,
      padding: 0,
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: lv.rowPadding.top,
      paddingRight: lv.rowPadding.right,
      paddingBottom: lv.rowPadding.bottom,
      paddingLeft: lv.rowPadding.left,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: lv.rowGap,
    },
    rowDragging: {
      opacity: 0.4,
    },
    dragHandle: {
      color: colors.dragHandle,
      fontSize: lv.dragHandleFontSize,
      flexShrink: 0,
      letterSpacing: lv.dragHandleLetterSpacing,
    },
    checkbox: {
      flexShrink: 0,
    },
    checkInner: {
      width: lv.checkboxSize,
      height: lv.checkboxSize,
      borderRadius: lv.checkboxRadius,
      borderWidth: lv.checkboxBorderWidth,
      borderColor: colors.checkboxBorder,
      backgroundColor: colors.checkboxBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkInnerChecked: {
      backgroundColor: colors.checkboxCheckedBg,
      borderColor: colors.checkboxCheckedBorder,
    },
    checkmark: {
      fontSize: lv.checkmarkSize,
      color: colors.primary,
      lineHeight: lv.checkmarkSize + 2,
    },
    textTouchable: {
      flex: 1,
    },
    itemText: {
      fontSize: textSize,
      color: colors.textPrimary,
      lineHeight: textSize * lv.textLineHeight,
      fontFamily: `${fonts.sans}-Regular`,
    },
    itemTextDone: {
      textDecorationLine: 'line-through',
      color: lv.textDoneColor,
    },
    deleteBtn: {
      fontSize: lv.deleteFontSize,
      color: colors.deleteVisible,
      paddingHorizontal: lv.deletePaddingH,
      flexShrink: 0,
    },
    emptyRow: {
      height: lv.emptyRowHeight,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderUltraLight,
    },
    accessory: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    doneBtn: {
      backgroundColor: colors.dialogBorder,
      borderWidth: 1,
      borderColor: colors.dragHandle,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    doneBtnText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: 12,
      letterSpacing: 12 * 0.08,
      color: colors.primary,
    },
  });
}
