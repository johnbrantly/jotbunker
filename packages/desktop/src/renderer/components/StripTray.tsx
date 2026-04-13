import React, { useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  children: React.ReactNode
}

export default function StripTray({ children }: Props) {
  const { colors } = useTheme()

  const style = useMemo(() => ({
    borderRadius: '20px 20px 0 0',
    borderTop: `1.5px solid ${colors.trayBorder}`,
    borderLeft: `1.5px solid ${colors.trayBorder}`,
    borderRight: `1.5px solid ${colors.trayBorder}`,
    borderBottom: 'none',
    overflow: 'hidden' as const,
    background: `linear-gradient(180deg, ${colors.trayGradientTop} 0%, ${colors.trayGradientBottom} 100%)`,
  }), [colors])

  return <div style={style}>{children}</div>
}
