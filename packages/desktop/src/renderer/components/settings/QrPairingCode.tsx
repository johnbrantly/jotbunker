import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cssFont } from '../../styles/tokens'

interface QrPairingCodeProps {
  ip: string
  port: number
  secret: string
  colors: { textPrimary: string; textSecondary: string }
}

export default function QrPairingCode({ ip, port, secret, colors }: QrPairingCodeProps) {
  const payload = JSON.stringify({ ip, port, secret })
  const [showSecret, setShowSecret] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <QRCodeSVG
        value={payload}
        size={140}
        bgColor="transparent"
        fgColor={colors.textPrimary}
        level="M"
      />
      <span style={{
        ...cssFont('DMMono-Regular'),
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {ip}:{port}
      </span>
      <button
        type="button"
        onClick={() => setShowSecret(!showSecret)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          ...cssFont('DMSans-Medium'),
          fontSize: 9,
          color: colors.textSecondary,
          letterSpacing: 1,
          padding: '2px 0',
        }}
      >
        {showSecret ? 'HIDE SECRET' : 'SHOW SECRET'}
      </button>
      {showSecret && (
        <span style={{
          ...cssFont('DMMono-Regular'),
          fontSize: 9,
          color: colors.textPrimary,
          textAlign: 'center',
          userSelect: 'all',
          whiteSpace: 'nowrap',
        }}>
          {secret}
        </span>
      )}
    </div>
  )
}
