import React, { useMemo } from 'react'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'
import { useConsoleStore } from '../../stores/consoleStore'

function formatTime(ts: number): string {
  const d = new Date(ts)
  return (
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0')
  )
}

interface ConsolePanelProps {
  height: number
  onResizeStart: (e: React.MouseEvent) => void
}

export default function ConsolePanel({ height, onResizeStart }: ConsolePanelProps) {
  const { colors } = useTheme()
  const entries = useConsoleStore((s) => s.entries)
  const clear = useConsoleStore((s) => s.clear)

  const styles = useMemo(() => ({
    wrapper: {
      height,
      flexShrink: 0,
      borderTop: `2px solid ${colors.trayBorderBright}`,
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#000000',
    },
    resizeHandle: {
      height: 6,
      cursor: 'ns-resize',
      flexShrink: 0,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 8px',
      flexShrink: 0,
      borderBottom: `1px solid ${colors.border}`,
    },
    label: {
      ...cssFont('DMSans-Black'),
      fontSize: 8,
      letterSpacing: 8 * 0.14,
      color: colors.primary,
    },
    footer: {
      display: 'flex',
      justifyContent: 'center',
      padding: '2px 0',
      flexShrink: 0,
    },
    clearBtn: {
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      background: 'none',
      cursor: 'pointer',
      ...cssFont('DMMono-Medium'),
      fontSize: 7,
      letterSpacing: 7 * 0.1,
      color: colors.textSecondary,
      padding: '2px 14px',
    } as React.CSSProperties,
    scroll: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '0 8px 4px',
    },
    line: {
      ...cssFont('DMMono-Regular'),
      fontSize: 8,
      color: colors.textSecondary,
      wordBreak: 'break-all' as const,
      lineHeight: '12px',
    },
    timestamp: {
      color: colors.textPrimary,
      opacity: 0.7,
      marginRight: 4,
    },
  }), [colors, height])

  return (
    <div style={styles.wrapper}>
      <div style={styles.resizeHandle} onMouseDown={onResizeStart} />
      <div style={styles.header}>
        <span style={styles.label}>SYSTEM MESSAGES</span>
      </div>
      <div className="list-scroll" style={styles.scroll}>
        {entries.map((entry) => (
          <div key={entry.id} style={styles.line}>
            <span style={styles.timestamp}>{formatTime(entry.timestamp)}</span>
            {entry.text}
          </div>
        ))}
      </div>
      {entries.length > 0 && (
        <>
          <div style={{ height: 1, backgroundColor: colors.border, flexShrink: 0 }} />
          <div style={styles.footer}>
            <button style={styles.clearBtn} onClick={clear}>CLEAR</button>
          </div>
        </>
      )}
    </div>
  )
}
