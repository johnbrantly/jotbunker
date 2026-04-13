import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { cssFont } from '../../styles/tokens'

interface InfoIconProps {
  tooltip: string
  popover?: 'above' | 'below'
  colors: {
    primary: string
    textSecondary: string
    border: string
    stripBg: string
  }
}

export default function InfoIcon({ tooltip, popover = 'above', colors }: InfoIconProps) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show || !iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    setPos({
      top: popover === 'below' ? rect.bottom + 20 : rect.top - 8,
      left: popover === 'below' ? rect.right + 16 : rect.left,
    })
    const handleClick = (e: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [show])

  return (
    <div ref={iconRef} style={{ display: 'inline-flex', marginTop: -3 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          backgroundColor: 'transparent',
          color: colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: 12,
          fontStyle: 'italic',
          lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
      >
        i
      </div>
      {show &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: popover === 'below' ? 'none' : 'translateY(-100%)',
              padding: '8px 10px',
              backgroundColor: '#1a1a1a',
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              ...cssFont('DMSans-Regular'),
              fontSize: 13,
              color: colors.textSecondary,
              width: 220,
              zIndex: 99999,
              lineHeight: 1.5,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {tooltip}
          </div>,
          document.body,
        )}
    </div>
  )
}
