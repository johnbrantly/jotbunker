import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'

export interface DotMenuItem {
  label: string
  onClick: () => void
}

interface Props {
  items: DotMenuItem[]
}

export default function DotMenu({ items }: Props) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen(!open)
  }

  return (
    <>
      <div
        ref={btnRef}
        onClick={handleToggle}
        style={{
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          backgroundColor: open ? `${colors.primary}30` : `${colors.textPrimary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={16} height={18} viewBox="0 0 16 18" fill="none">
          <circle cx={8} cy={3} r={1.5} fill={colors.textPrimary} />
          <circle cx={8} cy={9} r={1.5} fill={colors.textPrimary} />
          <circle cx={8} cy={15} r={1.5} fill={colors.textPrimary} />
        </svg>
      </div>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            backgroundColor: colors.dialogBg,
            border: `1px solid ${colors.dialogBorder}`,
            borderRadius: 6,
            padding: '4px 0',
            zIndex: 10000,
            minWidth: 120,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {items.map((item) => (
            <div
              key={item.label}
              onClick={() => { item.onClick(); setOpen(false) }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.primary}20` }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              style={{
                ...cssFont('DMSans-Bold'),
                fontSize: 11,
                letterSpacing: 11 * 0.06,
                color: colors.textPrimary,
                padding: '6px 14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
