import React, { useMemo } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DisplayText } from '../../components/DisplayText';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@jotbunker/shared';

const NAV_HEIGHT = 80;
import { useTheme } from '../../hooks/useTheme';
import TopChrome from '../../components/TopChrome';

const tabIcons: Record<string, any> = {
  jots: require('../../assets/nav/nav-jots.png'),
  scratchpad: require('../../assets/nav/nav-scratchpad.png'),
  lists: require('../../assets/nav/nav-lists.png'),
  lockedLists: require('../../assets/nav/nav-lockedLists.png'),
}

function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const tabs = [
    { key: 'jots', label: 'JOTS', navLabel: 'Jots', href: '/(tabs)/jots' },
    { key: 'lists', label: 'LISTS', navLabel: 'Lists', href: '/(tabs)/lists' },
    { key: 'lockedLists', label: 'LOCKED LISTS', navLabel: 'Locked Lists', href: '/(tabs)/lockedLists' },
    { key: 'scratchpad', label: 'SCRATCHPAD', navLabel: 'Scratchpads', href: '/(tabs)/scratchpad' },
  ] as const;

  const activeTab = tabs.find((t) => pathname.includes(t.key))?.key || 'jots';

  const styles = useMemo(() => StyleSheet.create({
    wrapper: {
      backgroundColor: colors.navBg,
      marginTop: -6,
    },
    container: {
      height: NAV_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIconActive: {
      width: 80,
      height: 80,
    },
    tabIconInactive: {
      width: 56,
      height: 56,
    },
    navLabel: {
      fontFamily: `${fonts.sans}-Regular`,
      fontSize: 10,
      letterSpacing: 0.8,
      color: '#000000',
      opacity: 0.5,
    },
    navLabelActive: {
      fontFamily: `${fonts.sans}-Bold`,
      opacity: 0.8,
    },
  }), [colors]);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.replace(tab.href as any)}
          >
            <Image
              source={tabIcons[tab.key]}
              style={isActive
                ? (tab.key === 'lockedLists' ? { width: 78, height: 78 } : styles.tabIconActive)
                : styles.tabIconInactive}
            />
            <DisplayText style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.navLabel}</DisplayText>
          </TouchableOpacity>
        );
      })}
    </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopChrome />
      <Tabs
        tabBar={() => <CustomTabBar />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="scratchpad" />
        <Tabs.Screen name="jots" />
        <Tabs.Screen name="lists" />
        <Tabs.Screen name="lockedLists" />
      </Tabs>
    </View>
  );
}
