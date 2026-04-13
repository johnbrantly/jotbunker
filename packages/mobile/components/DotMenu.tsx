import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

export interface DotMenuItem {
  label: string;
  onClick: () => void;
}

interface Props {
  items: DotMenuItem[];
}

export default function DotMenu({ items }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<View>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const handleToggle = () => {
    if (!open && btnRef.current) {
      btnRef.current.measureInWindow((x, y, width, height) => {
        setPos({ top: y + height + 4, right: 16 });
        setOpen(true);
      });
    } else {
      setOpen(!open);
    }
  };

  return (
    <>
      <TouchableOpacity
        ref={btnRef}
        onPress={handleToggle}
        style={[
          styles.btn,
          { backgroundColor: open ? `${colors.primary}30` : `${colors.textPrimary}15` },
        ]}
      >
        <Svg width={16} height={18} viewBox="0 0 16 18">
          <Circle cx={8} cy={3} r={1.5} fill={colors.textPrimary} />
          <Circle cx={8} cy={9} r={1.5} fill={colors.textPrimary} />
          <Circle cx={8} cy={15} r={1.5} fill={colors.textPrimary} />
        </Svg>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                top: pos.top,
                right: pos.right,
                backgroundColor: colors.dialogBg,
                borderColor: colors.dialogBorder,
              },
            ]}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => { item.onClick(); setOpen(false); }}
                style={styles.menuItem}
              >
                <Text
                  style={[
                    styles.menuText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: {
    fontFamily: `DMSans-Bold`,
    fontSize: 12,
    letterSpacing: 12 * 0.06,
  },
});
