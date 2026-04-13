import React, { useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  children: React.ReactNode
}

export default function HeaderTray({ children }: Props) {
  const { colors } = useTheme()

  const styles = useMemo(() => ({
    wrapper: {
      backgroundImage: `linear-gradient(180deg, ${colors.trayGradientBottom} 0%, ${colors.trayGradientBottom} 20px, transparent 20px)`,
    },
    tray: {
      marginTop: 0,
      borderRadius: 20,
      border: `1.5px solid ${colors.trayBorder}`,
      borderTop: `2px solid ${colors.trayBorderBright}`,
      overflow: 'hidden' as const,
      backgroundColor: colors.background,
      backgroundImage: `linear-gradient(180deg, ${colors.trayGradientBottom} 0%, ${colors.trayGradientTop} 100%)`,
    },
  }), [colors])

  return (
    <div style={styles.wrapper}>
      <div style={styles.tray}>{children}</div>
    </div>
  )
}
