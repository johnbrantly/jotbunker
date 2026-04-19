import React from 'react'

interface RecordingData {
  id: string
  dataUri: string
  duration: number
}

interface JotCardAudioProps {
  recordings: RecordingData[]
  jotId: number
  playingAudioId: string | null
  tagLabel: string
  saveLocked: boolean
  onToggleAudio: (recId: string, dataUri: string) => void
  onSaveAudio: (audioId: string, index: number) => void
  styles: Record<string, React.CSSProperties>
  playColor: string
  stopColor: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function JotCardAudio({ recordings, jotId, playingAudioId, tagLabel, saveLocked, onToggleAudio, onSaveAudio, styles, playColor, stopColor }: JotCardAudioProps) {
  return (
    <>
      <span style={styles.sectionLabel}>AUDIO</span>
      {recordings.map((rec, i) => {
        const ready = !!rec.dataUri
        const saveDisabled = !ready || saveLocked
        return (
          <div key={rec.id} style={styles.fileRow}>
            <span style={styles.fileLabel}>audio_{String(i + 1).padStart(3, '0')}.m4a</span>
            <span style={styles.fileMeta}>{ready ? formatDuration(rec.duration) : 'loading...'}</span>
            {ready && (
              <button
                style={{ ...styles.smallBtn, color: playingAudioId === rec.id ? stopColor : playColor }}
                onClick={() => onToggleAudio(rec.id, rec.dataUri)}
                title={playingAudioId === rec.id ? 'Stop' : 'Play'}
              >
                {playingAudioId === rec.id ? '\u25A0' : '\u25B6'}
              </button>
            )}
            <button
              style={{
                ...styles.smallTagBtn,
                opacity: saveDisabled ? 0.4 : 1,
                cursor: saveDisabled ? 'default' : 'pointer',
              }}
              onClick={() => onSaveAudio(rec.id, i + 1)}
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
