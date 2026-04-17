import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DisplayText } from '../../components/DisplayText';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../../hooks/useTheme';
import TopChrome from '../../components/TopChrome';

const NAV_HEIGHT = 90;
const INACTIVE_ICON_SIZE = 48;

const tabIcons: Record<string, any> = {
  jots: require('../../assets/nav/nav-jots.png'),
  scratchpad: require('../../assets/nav/nav-scratchpad.png'),
  lists: require('../../assets/nav/nav-lists.png'),
  lockedLists: require('../../assets/nav/nav-lockedLists.png'),
};

/**
 * Per-tab declaration. `iconActiveSize` is declared here rather than
 * branched inline at render time — the shield icon for `lockedLists`
 * renders with slightly different visual weight at 66 px, so it gets 64.
 */
type TabDef = {
  key: 'jots' | 'lists' | 'lockedLists' | 'scratchpad';
  navLabel: string;
  href: string;
  iconActiveSize: number;
};

const TABS: readonly TabDef[] = [
  { key: 'jots',        navLabel: 'Jots',         href: '/(tabs)/jots',        iconActiveSize: 66 },
  { key: 'lists',       navLabel: 'Lists',        href: '/(tabs)/lists',       iconActiveSize: 66 },
  { key: 'lockedLists', navLabel: 'Locked Lists', href: '/(tabs)/lockedLists', iconActiveSize: 64 },
  { key: 'scratchpad',  navLabel: 'Scratchpads',  href: '/(tabs)/scratchpad',  iconActiveSize: 66 },
] as const;

function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Match against path segments (not substrings) so that `lists` doesn't
  // incorrectly match a `lockedLists` route. expo-router produces pathnames
  // like "/lockedLists"; splitting on "/" gives a clean, exact segment match.
  const segments = pathname.split('/').filter(Boolean);
  const activeTab = TABS.find((t) => segments.includes(t.key))?.key ?? 'jots';

  const styles = useMemo(() => StyleSheet.create({
    wrapper: {
      backgroundColor: colors.navBg,
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
      justifyContent: 'flex-start',
    },
    navLabel: {
      fontFamily: `${fonts.sans}-Regular`,
      fontSize: 10,
      letterSpacing: 0.8,
      color: colors.navInactiveText,
    },
    navLabelActive: {
      fontFamily: `${fonts.sans}-Bold`,
      color: colors.navActiveText,
    },
  }), [colors]);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const size = isActive ? tab.iconActiveSize : INACTIVE_ICON_SIZE;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => router.replace(tab.href as any)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.navLabel}
            >
              <Image
                source={tabIcons[tab.key]}
                style={{ width: size, height: size }}
              />
              <DisplayText style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.navLabel}
              </DisplayText>
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
