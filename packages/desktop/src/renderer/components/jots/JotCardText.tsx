import React from 'react'

interface JotCardTextProps {
  text: string
  jotId: number
  selectedTag: { label: string } | undefined
  onEditText: () => void
  onSaveText: (text: string, filename: string) => Promise<void>
  styles: Record<string, React.CSSProperties>
}

export default function JotCardText({ text, jotId, selectedTag, onEditText, onSaveText, styles }: JotCardTextProps) {
  const tagLabel = selectedTag?.label ?? ''

  return (
    <>
      <span style={styles.sectionLabel}>TEXT</span>
      <div style={styles.fileRow}>
        <span style={styles.fileLabel}>
          {text.length > 50 ? text.slice(0, 50) + '...' : text}
        </span>
        <span style={styles.fileMeta}>{text.length} chars</span>
        <button
          style={styles.smallBtn}
          onClick={onEditText}
          title="Edit text"
        >
          {'\u270e'}
        </button>
        <button
          style={styles.smallTagBtn}
          onClick={async () => {
            // writeTagFile in main appends timestamp prefix and .txt suffix, so we pass a bare name
            await onSaveText(text, `jot${jotId}-text`)
          }}
          title={`Download to ${tagLabel}`}
        >
          {`\u2193 ${tagLabel}`}
        </button>
      </div>
    </>
  )
}
