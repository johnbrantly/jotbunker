import React from 'react'

interface FileData {
  id: string
  dataUri: string
  fileName: string
  mimeType: string
  size: number
}

interface JotCardFilesProps {
  files: FileData[]
  jotId: number
  tagLabel: string
  saveLocked: boolean
  onSaveFile: (fileId: string, fileName: string) => void
  styles: Record<string, React.CSSProperties>
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function JotCardFiles({ files, jotId, tagLabel, saveLocked, onSaveFile, styles }: JotCardFilesProps) {
  return (
    <>
      <span style={styles.sectionLabel}>FILES</span>
      {files.map((file) => {
        const ready = !!file.dataUri
        const saveDisabled = !ready || saveLocked
        return (
          <div key={file.id} style={styles.thumbnailRow}>
            <span style={{ fontSize: 18, marginRight: 4 }}>{'\u{1F4CE}'}</span>
            <span style={styles.fileLabel}>
              {ready ? `${file.fileName} (${formatSize(file.size)})` : `${file.fileName} — loading...`}
            </span>
            <button
              style={{
                ...styles.smallTagBtn,
                opacity: saveDisabled ? 0.4 : 1,
                cursor: saveDisabled ? 'default' : 'pointer',
              }}
              onClick={() => onSaveFile(file.id, file.fileName)}
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
