import React from 'react'

interface ImageData {
  id: string
  dataUri: string
  format: string
}

interface JotCardImagesProps {
  images: ImageData[]
  jotId: number
  tagLabel: string
  saveLocked: boolean
  onViewImage: (src: string, title: string) => void
  onSaveImage: (imageId: string, format: string, index: number) => void
  styles: Record<string, React.CSSProperties>
}

export default function JotCardImages({ images, jotId, tagLabel, saveLocked, onViewImage, onSaveImage, styles }: JotCardImagesProps) {
  return (
    <>
      <span style={styles.sectionLabel}>IMAGES</span>
      {images.map((img, i) => {
        const ready = !!img.dataUri
        const saveDisabled = !ready || saveLocked
        const label = `image_${String(i + 1).padStart(3, '0')}.${img.format || 'jpg'}${ready ? '' : ' — loading...'}`
        return (
          <div key={img.id} style={styles.thumbnailRow}>
            {ready && (
              <img
                src={img.dataUri}
                style={styles.thumbnail}
                onClick={() => onViewImage(img.dataUri, `JOT ${jotId} — Image ${i + 1}`)}
                title="View image"
              />
            )}
            <span style={styles.fileLabel}>{label}</span>
            {ready && (
              <button
                style={styles.smallBtn}
                onClick={() => onViewImage(img.dataUri, `JOT ${jotId} — Image ${i + 1}`)}
                title="View image"
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
              onClick={() => onSaveImage(img.id, img.format, i + 1)}
              disabled={saveDisabled}
              title={`Download to ${tagLabel}`}
            >
              {`\u2193 ${tagLabel}`}
            </button>
          </div>
        )
      })}
    </>
  )
}
