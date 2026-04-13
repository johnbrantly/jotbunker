import React from 'react'

interface JotCardDrawingProps {
  drawingDataUrl: string | null
  jotId: number
  tagLabel: string
  onViewImage: (src: string, title: string) => void
  onSaveDrawing: () => void
  styles: Record<string, React.CSSProperties>
}

export default function JotCardDrawing({ drawingDataUrl, jotId, tagLabel, onViewImage, onSaveDrawing, styles }: JotCardDrawingProps) {
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
        <span style={styles.fileLabel}>drawing.png</span>
        {drawingDataUrl && (
          <>
            <button
              style={styles.smallBtn}
              onClick={() => onViewImage(drawingDataUrl, `JOT ${jotId} — Drawing`)}
              title="View drawing"
            >
              {'\u{1F441}'}
            </button>
            <button
              style={styles.smallTagBtn}
              onClick={onSaveDrawing}
              title={`Download to ${tagLabel}`}
            >
              {`\u2193 ${tagLabel}`}
            </button>
          </>
        )}
      </div>
    </>
  )
}
