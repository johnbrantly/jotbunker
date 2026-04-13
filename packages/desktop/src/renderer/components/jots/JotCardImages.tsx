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
  onViewImage: (src: string, title: string) => void
  onSaveImage: (imageId: string, format: string, index: number) => void
  styles: Record<string, React.CSSProperties>
}

export default function JotCardImages({ images, jotId, tagLabel, onViewImage, onSaveImage, styles }: JotCardImagesProps) {
  return (
    <>
      <span style={styles.sectionLabel}>IMAGES</span>
      {images.map((img, i) => (
        <div key={img.id} style={styles.thumbnailRow}>
          {img.dataUri ? (
            <>
              <img
                src={img.dataUri}
                style={styles.thumbnail}
                onClick={() => onViewImage(img.dataUri, `JOT ${jotId} — Image ${i + 1}`)}
                title="View image"
              />
              <span style={styles.fileLabel}>image_{String(i + 1).padStart(3, '0')}.{img.format || 'jpg'}</span>
              <button
                style={styles.smallBtn}
                onClick={() => onViewImage(img.dataUri, `JOT ${jotId} — Image ${i + 1}`)}
                title="View image"
              >
                {'\u{1F441}'}
              </button>
              <button
                style={styles.smallTagBtn}
                onClick={() => onSaveImage(img.id, img.format, i + 1)}
                title={`Download to ${tagLabel}`}
              >
                {`\u2193 ${tagLabel}`}
              </button>
            </>
          ) : (
            <span style={styles.fileLabel}>image_{String(i + 1).padStart(3, '0')}.{img.format || 'jpg'} — loading...</span>
          )}
        </div>
      ))}
    </>
  )
}
