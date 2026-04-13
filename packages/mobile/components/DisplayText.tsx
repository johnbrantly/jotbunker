import React from 'react';
import { Text, TextProps, Platform } from 'react-native';

/**
 * DisplayText — for single-line display labels prone to Android text truncation.
 * Applies textBreakStrategy='simple' on Android only for accurate measurement
 * with custom fonts. Do NOT use for multi-line text, list items, or TextInputs.
 */
export function DisplayText({ children, ...props }: TextProps) {
  return (
    <Text
      {...props}
      textBreakStrategy={Platform.OS === 'android' ? 'simple' : undefined}
    >
      {children}
    </Text>
  );
}
