import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'
import { useJotsStore } from '../../stores/jotsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { JotData, ManifestEntry } from '../../stores/jotsStore'
import ConfirmDialog from '../ConfirmDialog'
import SaveToTagDialog from '../SaveToTagDialog'
import TextEditModal from './TextEditModal'
import ImageViewerModal from './ImageViewerModal'
import JotCardText from './JotCardText'
import JotCardDrawing from './JotCardDrawing'
import JotCardImages from './JotCardImages'
import JotCardAudio from './JotCardAudio'
import JotCardFiles from './JotCardFiles'
import { useTagStore } from '../../stores/tagStore'
import { useConsoleStore } from '../../stores/consoleStore'
import { useSaveStatusStore } from '../../stores/saveStatusStore'
import { rasterizeDrawing } from '../../utils/rasterizeDrawing'

interface JotCardProps {
  jotId: number
  jot: JotData
  connected: boolean
  isTransferring: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  manifestEntry: ManifestEntry | null
  requestDownload: (jotIds: number[]) => void
  requestClear: (jotIds: number[]) => void
}

function generateDefaultFilename(text: string): string {
  const firstLine = text.split('\n')[0] || ''
  const snippet = firstLine.slice(0, 40).trim()
  if (!snippet) return 'untitled'
  return snippet
    .toLowerCase()
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled'
}

export default function JotCard({ jotId, jot, connected, isTransferring, isExpanded, onToggleExpand, manifestEntry, requestDownload, requestClear }: JotCardProps) {
  const { colors } = useTheme()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showTextEdit, setShowTextEdit] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [viewerImage, setViewerImage] = useState<{ src: string; title: string } | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const log = useConsoleStore((s) => s.log)
  const jotMetaFetched = useJotsStore((s) => s.jotMetaFetched[jotId])
  const jotMetaLoading = useJotsStore((s) => s.jotMetaLoading[jotId])
  const isSaving = useSaveStatusStore((s) => s.isSaving)
  const saveLocked = isTransferring || isSaving

  // Derive "has content" from manifest when available, fall back to jot data
  const hasText = manifestEntry ? manifestEntry.hasText : jot.text.length > 0
  const hasDrawing = manifestEntry ? manifestEntry.hasDrawing : !!jot.drawing
  const imgCount = manifestEntry ? manifestEntry.imageIds.length : jot.images.length
  const audCount = manifestEntry ? manifestEntry.audioIds.length : jot.recordings.length
  const fileCount = manifestEntry ? (manifestEntry.fileIds || []).length : (jot.files || []).length
  const hasContent = hasText || hasDrawing || imgCount > 0 || audCount > 0 || fileCount > 0

  const contentSummary = [
    hasText && 'TXT',
    hasDrawing && 'DRW',
    imgCount > 0 && `${imgCount} IMG`,
    fileCount > 0 && `${fileCount} FILE`,
    audCount > 0 && `${audCount} AUD`,
  ].filter(Boolean).join(' \u00b7 ')

  // Lazy fetch: when expanded and metadata not yet fetched (or invalidated), request it
  useEffect(() => {
    if (isExpanded && connected && !jotMetaFetched && !jotMetaLoading) {
      useJotsStore.getState().setJotMetaLoading(jotId, true)
      window.electronAPI.requestJotMeta(jotId)
    }
  }, [isExpanded, connected, jotMetaFetched, jotMetaLoading, jotId])

  // Stop audio when collapsing or unmounting
  useEffect(() => {
    if (!isExpanded && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingAudioId(null)
    }
  }, [isExpanded])

  const toggleAudio = useCallback((recId: string, uri: string) => {
    if (playingAudioId === recId) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlayingAudioId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(uri)
      audio.onended = () => { setPlayingAudioId(null); audioRef.current = null }
      audio.play()
      audioRef.current = audio
      setPlayingAudioId(recId)
    }
  }, [playingAudioId])

  // Rasterize drawing to data URL for thumbnail
  const drawingDataUrl = useMemo(() => {
    if (!jot.drawing) return null
    const b64 = rasterizeDrawing(jot.drawing)
    return b64 ? `data:image/png;base64,${b64}` : null
  }, [jot.drawing])

  const selectedTag = useTagStore((s) => s.tags.find((t) => t.id === s.selectedTagId))

  const handleTextSave = (text: string) => {
    useJotsStore.getState().updateText(jotId, text)
    setShowTextEdit(false)
  }

  // Resolve the current save destination. Returns null if store state isn't ready
  // (shouldn't happen once hydrated — selectedTagId is invariant-guaranteed non-null
  // and tagRootPath is hydrated-defaulted to Documents/Jotbunker Tags).
  const getTagTarget = (): { tagRootPath: string; tagName: string } | null => {
    const tagRootPath = useSettingsStore.getState().tagRootPath
    const tagState = useTagStore.getState()
    const tag = tagState.tags.find((t) => t.id === tagState.selectedTagId)
    if (!tagRootPath || !tag) {
      log('Save cancelled: tag or folder not configured')
      return null
    }
    return { tagRootPath, tagName: tag.label }
  }

  const handleSaveImage = async (imageId: string, format: string, index: number) => {
    const img = jot.images.find((i) => i.id === imageId)
    if (!img?.dataUri) return
    const base64 = img.dataUri.split(',')[1]
    if (!base64) return
    const target = getTagTarget()
    if (!target) return
    const filename = `image_${String(index).padStart(3, '0')}.${format || 'jpg'}`
    const result = await window.electronAPI.saveBase64File({ base64, format, tagRootPath: target.tagRootPath, tagName: target.tagName, filename })
    if (result.success) log(`Image saved to ${result.path}`)
    else log(`Image save failed: ${result.error}`)
  }

  const handleSaveAudio = async (audioId: string, index: number) => {
    const rec = jot.recordings.find((r) => r.id === audioId)
    if (!rec?.dataUri) return
    const base64 = rec.dataUri.split(',')[1]
    if (!base64) return
    const target = getTagTarget()
    if (!target) return
    const filename = `audio_${String(index).padStart(3, '0')}.m4a`
    const result = await window.electronAPI.saveBase64File({ base64, format: 'm4a', tagRootPath: target.tagRootPath, tagName: target.tagName, filename })
    if (result.success) log(`Audio saved to ${result.path}`)
    else log(`Audio save failed: ${result.error}`)
  }

  const handleSaveFile = async (fileId: string, fileName: string) => {
    const file = (jot.files || []).find((f) => f.id === fileId)
    if (!file?.dataUri) return
    const base64 = file.dataUri.split(',')[1]
    if (!base64) return
    const target = getTagTarget()
    if (!target) return
    const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
    const result = await window.electronAPI.saveBase64File({ base64, format: ext, tagRootPath: target.tagRootPath, tagName: target.tagName, filename: fileName })
    if (result.success) log(`File saved to ${result.path}`)
    else log(`File save failed: ${result.error}`)
  }

  const handleSaveDrawing = async () => {
    if (!drawingDataUrl) return
    const base64 = drawingDataUrl.split(',')[1]
    if (!base64) return
    const target = getTagTarget()
    if (!target) return
    const result = await window.electronAPI.saveBase64File({ base64, format: 'png', tagRootPath: target.tagRootPath, tagName: target.tagName, filename: 'drawing.png' })
    if (result.success) log(`Drawing saved to ${result.path}`)
    else log(`Drawing save failed: ${result.error}`)
  }

  // Wait for jot metadata + all binary files to be loaded into the store
  const waitForJotData = useCallback((): Promise<JotData> => {
    return new Promise((resolve, reject) => {
      const store = useJotsStore.getState()

      // If not fetched yet, trigger the fetch
      if (!store.jotMetaFetched[jotId]) {
        store.setJotMetaLoading(jotId, true)
        window.electronAPI.requestJotMeta(jotId)
      }

      const timeout = setTimeout(() => { unsub(); reject(new Error('Timed out waiting for jot data')) }, 30_000)
      const unsub = useJotsStore.subscribe((state) => {
        if (!state.jotMetaFetched[jotId]) return
        const j = state.jots[jotId]
        // Check all binaries have loaded (dataUri filled in)
        const allImagesLoaded = j.images.every((img) => img.dataUri)
        const allAudioLoaded = j.recordings.every((rec) => rec.dataUri)
        const allFilesLoaded = (j.files || []).every((f) => f.dataUri)
        if (allImagesLoaded && allAudioLoaded && allFilesLoaded) {
          clearTimeout(timeout)
          unsub()
          resolve(j)
        }
      })

      // Also check immediately in case already loaded
      const current = useJotsStore.getState()
      if (current.jotMetaFetched[jotId]) {
        const j = current.jots[jotId]
        const allLoaded = j.images.every((img) => img.dataUri)
          && j.recordings.every((rec) => rec.dataUri)
          && (j.files || []).every((f) => f.dataUri)
        if (allLoaded) {
          clearTimeout(timeout)
          unsub()
          resolve(j)
        }
      }
    })
  }, [jotId])

  const handleTagDialogSave = async (filename: string, includeMedia: boolean) => {
    setShowTagDialog(false)
    const target = getTagTarget()
    if (!target) return
    const { tagRootPath, tagName } = target

    // Global save mutex — blocks DOWNLOAD ALL and other JotCards' big Quicksave
    // buttons for the duration of this save. Released in finally below.
    useSaveStatusStore.getState().setSaving(true)
    try {
      let result: { success: boolean; path?: string; error?: string }
      if (includeMedia) {
        log(`Fetching JOT ${jotId} data...`)
        const freshJot = await waitForJotData()
        const drawingPngBase64 = freshJot.drawing ? rasterizeDrawing(freshJot.drawing) : null
        const images = freshJot.images
          .filter((img) => img.dataUri)
          .map((img) => ({ base64: img.dataUri!.split(',')[1], format: img.format || 'jpg' }))
        const recordings = freshJot.recordings
          .filter((rec) => rec.dataUri)
          .map((rec) => ({ base64: rec.dataUri!.split(',')[1] }))
        const files = (freshJot.files || [])
          .filter((f) => f.dataUri)
          .map((f) => ({ base64: f.dataUri!.split(',')[1], fileName: f.fileName }))
        result = await window.electronAPI.saveToTagWithMedia({
          tagRootPath,
          tagName,
          filename,
          text: freshJot.text,
          jotId: jotId,
          drawingPngBase64,
          images,
          recordings,
          files,
        })
      } else {
        // Text-only also needs to fetch if not yet loaded
        if (!useJotsStore.getState().jotMetaFetched[jotId]) {
          log(`Fetching JOT ${jotId} text...`)
          const freshJot = await waitForJotData()
          result = await window.electronAPI.saveToTag({
            tagRootPath,
            tagName,
            filename,
            text: freshJot.text,
          })
        } else {
          result = await window.electronAPI.saveToTag({
            tagRootPath,
            tagName,
            filename,
            text: jot.text,
          })
        }
      }
      if (result.success) {
        log(`JOT ${jotId} \u2192 ${result.path}`)
      } else {
        log(`Save failed: ${result.error}`)
      }
    } catch (err) {
      log(`Save error: ${err}`)
    } finally {
      useSaveStatusStore.getState().setSaving(false)
    }
  }

  const styles = useMemo(() => ({
    card: {
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.background,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      cursor: hasContent ? 'pointer' : 'default',
      opacity: hasContent ? 1 : 0.4,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    jotLabel: {
      ...cssFont('DMSans-Black'),
      fontSize: 12,
      letterSpacing: 12 * 0.1,
      color: colors.primary,
      flexShrink: 0,
    },
    summary: {
      ...cssFont('DMMono-Regular'),
      fontSize: 9,
      color: colors.textSecondary,
    },
    headerActions: {
      display: 'flex',
      gap: 4,
      flexShrink: 0,
    },
    clearBtn: {
      width: 24,
      height: 24,
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      backgroundColor: 'transparent',
      color: colors.destructive,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...cssFont('DMSans-Bold'),
      fontSize: 16,
      padding: 0,
    } as React.CSSProperties,
    tagBtn: {
      height: 24,
      paddingLeft: 6,
      paddingRight: 6,
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...cssFont('DMSans-Bold'),
      fontSize: 8,
      letterSpacing: 8 * 0.1,
    } as React.CSSProperties,
    expandedArea: {
      borderTop: `1px solid ${colors.border}`,
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 6,
    },
    fileRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    fileLabel: {
      ...cssFont('DMMono-Regular'),
      fontSize: 10,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
    },
    fileMeta: {
      ...cssFont('DMMono-Regular'),
      fontSize: 9,
      color: colors.textSecondary,
      flexShrink: 0,
    },
    smallBtn: {
      width: 20,
      height: 20,
      borderRadius: 3,
      border: `1px solid ${colors.border}`,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      padding: 0,
      flexShrink: 0,
    } as React.CSSProperties,
    smallTagBtn: {
      height: 20,
      paddingLeft: 5,
      paddingRight: 5,
      borderRadius: 3,
      border: `1px solid ${colors.border}`,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...cssFont('DMSans-Bold'),
      fontSize: 7,
      letterSpacing: 7 * 0.1,
      flexShrink: 0,
    } as React.CSSProperties,
    sectionLabel: {
      ...cssFont('DMSans-Bold'),
      fontSize: 9,
      letterSpacing: 9 * 0.08,
      color: colors.textSecondary,
      marginTop: 4,
    },
    thumbnail: {
      width: 48,
      height: 48,
      objectFit: 'cover' as const,
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      flexShrink: 0,
      cursor: 'pointer',
    },
    thumbnailRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    thumbnailGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: 6,
      marginTop: 4,
    },
  }), [colors, hasContent])

  return (
    <>
      <div style={styles.card}>
        {/* Collapsed header */}
        <div
          style={styles.header}
          onClick={() => hasContent && onToggleExpand()}
        >
          <div style={styles.headerLeft}>
            <span style={styles.jotLabel}>JOT {jotId}</span>
            {hasContent ? (
              <span style={styles.summary}>{contentSummary}</span>
            ) : (
              <span style={styles.summary}>empty</span>
            )}
          </div>

          {hasContent && (
            <div style={styles.headerActions}>
              <button
                style={{
                  ...styles.tagBtn,
                  opacity: saveLocked ? 0.4 : 1,
                  cursor: saveLocked ? 'default' : 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); setShowTagDialog(true) }}
                disabled={saveLocked}
                title={`Save to ${selectedTag?.label ?? ''}`}
              >
                {`\u2193 ${selectedTag?.label ?? ''}`}
              </button>
              <button
                style={styles.clearBtn}
                onClick={(e) => { e.stopPropagation(); setShowClearConfirm(true) }}
                title="Clear jot"
              >
                {'\u00d7'}
              </button>
            </div>
          )}
        </div>

        {/* Expanded detail */}
        {isExpanded && hasContent && (
          <div style={styles.expandedArea}>
            {/* Loading state while fetching metadata */}
            {jotMetaLoading && !jotMetaFetched && (
              <span style={styles.fileMeta}>Loading...</span>
            )}

            {jotMetaFetched && jot.text.length > 0 && (
              <JotCardText
                text={jot.text}
                jotId={jotId}
                selectedTag={selectedTag}
                onEditText={() => setShowTextEdit(true)}
                onSaveText={async (text, filename) => {
                  const target = getTagTarget()
                  if (!target) return
                  try {
                    const result = await window.electronAPI.saveToTag({
                      tagRootPath: target.tagRootPath,
                      tagName: target.tagName,
                      filename,
                      text,
                    })
                    if (result.success) log(`Text saved to ${result.path}`)
                    else log(`Text save failed: ${result.error}`)
                  } catch (err) {
                    log(`Text save failed: ${err}`)
                  }
                }}
                styles={styles}
              />
            )}

            {jotMetaFetched && !!jot.drawing && (
              <JotCardDrawing
                drawingDataUrl={drawingDataUrl}
                jotId={jotId}
                tagLabel={selectedTag?.label ?? ''}
                saveLocked={saveLocked}
                onViewImage={(src, title) => setViewerImage({ src, title })}
                onSaveDrawing={handleSaveDrawing}
                styles={styles}
              />
            )}

            {jotMetaFetched && jot.images.length > 0 && (
              <JotCardImages
                images={jot.images}
                jotId={jotId}
                tagLabel={selectedTag?.label ?? ''}
                saveLocked={saveLocked}
                onViewImage={(src, title) => setViewerImage({ src, title })}
                onSaveImage={handleSaveImage}
                styles={styles}
              />
            )}

            {jotMetaFetched && (jot.files || []).length > 0 && (
              <JotCardFiles
                files={jot.files || []}
                jotId={jotId}
                tagLabel={selectedTag?.label ?? ''}
                saveLocked={saveLocked}
                onSaveFile={handleSaveFile}
                styles={styles}
              />
            )}

            {jotMetaFetched && jot.recordings.length > 0 && (
              <JotCardAudio
                recordings={jot.recordings}
                jotId={jotId}
                playingAudioId={playingAudioId}
                tagLabel={selectedTag?.label ?? ''}
                saveLocked={saveLocked}
                onToggleAudio={toggleAudio}
                onSaveAudio={handleSaveAudio}
                styles={styles}
                playColor={colors.primary}
                stopColor={colors.destructive}
              />
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        visible={showClearConfirm}
        title={`Delete Jot ${jotId} from Phone?`}
        message={`This will delete JOT ${jotId} from your PHONE, freeing that jot to be used for a new Jot. Proceed?`}
        confirmLabel="DELETE"
        onConfirm={() => {
          requestClear([jotId])
          setShowClearConfirm(false)
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <TextEditModal
        visible={showTextEdit}
        jotId={jotId}
        text={jot.text}
        onSave={handleTextSave}
        onCancel={() => setShowTextEdit(false)}
      />

      <SaveToTagDialog
        visible={showTagDialog}
        tagLabel={selectedTag?.label || ''}
        sourceLabel={`JOT ${jotId}`}
        showMediaToggle={imgCount > 0 || audCount > 0 || fileCount > 0 || hasDrawing}
        defaultFilename={generateDefaultFilename(jot.text) || `jot${jotId}`}
        onSave={handleTagDialogSave}
        onCancel={() => setShowTagDialog(false)}
      />

      <ImageViewerModal
        visible={!!viewerImage}
        src={viewerImage?.src || ''}
        title={viewerImage?.title || ''}
        onClose={() => setViewerImage(null)}
      />

    </>
  )
}
