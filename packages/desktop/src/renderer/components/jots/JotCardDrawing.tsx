import React from 'react'

interface JotCardDrawingProps {
  drawingDataUrl: string | null
  jotId: number
  tagLabel: string
  saveLocked: boolean
  onViewImage: (src: string, title: string) => void
  onSaveDrawing: () => void
  styles: Record<string, React.CSSProperties>
}

export default function JotCardDrawing({ drawingDataUrl, jotId, tagLabel, saveLocked, onViewImage, onSaveDrawing, styles }: JotCardDrawingProps) {
  const saveDisabled = !drawingDataUrl || saveLocked
  return (
    <>
      <span style={styles.sectionLabel}>DRAWING</span>
      <div style={styles.thumbnailRow}>
        {drawingDataUrl && (
          <img
            src={drawingDataUrl}
            style={styles.thumbnail}
            onClick={() => onViewImage(drawingDataUrl, `JOT ${jotId} — Drawing`)}
            title="View drawing"
          />
        )}
        <span style={styles.fileLabel}>
          {drawingDataUrl ? 'drawing.png' : 'drawing.png — loading...'}
        </span>
        {drawingDataUrl && (
          <button
            style={styles.smallBtn}
            onClick={() => onViewImage(drawingDataUrl, `JOT ${jotId} — Drawing`)}
            title="View drawing"
          >
            {'\u{1F441}'}
          </button>
        )}
        <button
          style={{
            ...styles.smallTagBtn,
            opacity: saveDisabled ? 0.4 : 1,
            cursor: saveDisabled ? 'default' : 'pointer',
          }}
          onClick={onSaveDrawing}
          disabled={saveDisabled}
          title={`Download to ${tagLabel}`}
        >
          {`\u2193 ${tagLabel}`}
        </button>
      </div>
    </>
  )
}
