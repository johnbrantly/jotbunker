import React, { useMemo } from 'react'
import type { TabKey } from '../App'
import { cssFont } from '../styles/tokens'

const NAV_HEIGHT = 92
import { useTheme } from '../hooks/useTheme'
import navJots from '../assets/nav/nav-jots.png'
import navScratchpad from '../assets/nav/nav-scratchpad.png'
import navLists from '../assets/nav/nav-lists.png'
import navLockedLists from '../assets/nav/nav-lockedLists.png'

interface Props {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  phoneConnected?: boolean
}

const tabs: { key: TabKey; label: string; navLabel: string; icon: string }[] = [
  { key: 'jots', label: 'JOTS', navLabel: 'Jots', icon: navJots },
  { key: 'lists', label: 'LISTS', navLabel: 'Lists', icon: navLists },
  { key: 'lockedLists', label: 'LOCKED LISTS', navLabel: 'Locked Lists', icon: navLockedLists },
  { key: 'scratchpad', label: 'SCRATCHPAD', navLabel: 'Scratchpads', icon: navScratchpad },
]

export default function BottomNav({ activeTab, onSelectTab, phoneConnected }: Props) {
  const { colors } = useTheme()

  const styles = useMemo(() => ({
    container: {
      height: NAV_HEIGHT,
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      backgroundColor: colors.navBg,
      flexShrink: 0,
    },
    tab: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      ...cssFont('DMSans-Regular'),
      fontSize: 11,
      letterSpacing: 0.8,
      color: '#000000',
      opacity: 0.5,
      marginTop: -8,
    },
    navLabelActive: {
      ...cssFont('DMSans-Bold'),
      opacity: 0.8,
    },
  }), [colors])

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        const isDimmed = tab.key === 'jots' && !phoneConnected
        return (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              background: isActive
                ? 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)'
                : undefined,
              opacity: isDimmed ? 0.35 : undefined,
            }}
            onClick={() => onSelectTab(tab.key)}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              style={{
                width: isActive ? 90 : 68,
                height: isActive ? 90 : 68,
                marginTop: isActive ? -15 : -8,
              }}
            />
            <span style={{
              ...styles.navLabel,
              ...(isActive ? styles.navLabelActive : {}),
            }}>{tab.navLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
