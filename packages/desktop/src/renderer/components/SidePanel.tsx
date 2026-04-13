import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { cssFont } from '../styles/tokens'
import type { DesktopSyncState } from '../sync/useSyncSetup'
import { useTheme } from '../hooks/useTheme'
import TagSection from './sidepanel/TagSection'
import SaveToTagDialog from './SaveToTagDialog'
import type { TabKey } from '../App'
import { useTagStore } from '../stores/tagStore'
import { useScratchpadStore } from '../stores/scratchpadStore'
import { useListsStore } from '../stores/listsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useConsoleStore } from '../stores/consoleStore'
import ConsolePanel from './sidepanel/ConsolePanel'

interface SidePanelProps {
  sync: DesktopSyncState
  activeTab: TabKey
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

export default function SidePanel({ sync, activeTab }: SidePanelProps) {
  const { colors, settingsPanel: sp } = useTheme()

  // Save-to-tag dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const log = useConsoleStore((s) => s.log)

  // Console panel resize
  const DEFAULT_CONSOLE_HEIGHT = 200
  const MIN_CONSOLE_HEIGHT = 92
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleConsoleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = consoleHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      const wrapperHeight = wrapperRef.current?.clientHeight ?? 600
      const maxHeight = Math.floor(wrapperHeight * 0.33)
      const delta = startY - moveEvent.clientY
      const newHeight = Math.max(MIN_CONSOLE_HEIGHT, Math.min(maxHeight, startHeight + delta))
      setConsoleHeight(newHeight)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [consoleHeight])

  const handleSaveToTag = () => {
    setShowSaveDialog(true)
  }

  // Listen for save-to-tag requests from main panel dot menus
  useEffect(() => {
    const handler = () => handleSaveToTag()
    window.addEventListener('save-to-tag', handler)
    return () => window.removeEventListener('save-to-tag', handler)
  }, [])

  const getSourceLabel = (): string => {
    if (activeTab === 'scratchpad') {
      const store = useScratchpadStore.getState()
      return `SCRATCHPAD / ${store.categories[store.activeSlot]?.label || '?'}`
    }
    if (activeTab === 'lists') {
      const store = useListsStore.getState()
      return `LISTS / ${store.categories[store.activeSlot]?.label || '?'}`
    }
    if (activeTab === 'lockedLists') {
      const store = useLockedListsStore.getState()
      return `LOCKED LISTS / ${store.categories[store.activeSlot]?.label || '?'}`
    }
    return ''
  }

  const getItemsAsText = (store: { items: { text: string }[][]; activeSlot: number }): string => {
    const items = store.items[store.activeSlot] || []
    return items.map((item) => item.text).join('\n')
  }

  const getSourceText = (): string => {
    if (activeTab === 'scratchpad') {
      const store = useScratchpadStore.getState()
      return store.contents[store.activeSlot]?.content || ''
    }
    if (activeTab === 'lists') {
      return getItemsAsText(useListsStore.getState())
    }
    if (activeTab === 'lockedLists') {
      return getItemsAsText(useLockedListsStore.getState())
    }
    return ''
  }

  const getTagLabel = (): string => {
    const store = useTagStore.getState()
    const tag = store.tags.find((t) => t.id === store.selectedTagId)
    return tag?.label || ''
  }

  const handleDialogSave = async (filename: string) => {
    setShowSaveDialog(false)
    const tagStore = useTagStore.getState()
    const tag = tagStore.tags.find((t) => t.id === tagStore.selectedTagId)
    if (!tag) return

    const tagRootPath = useSettingsStore.getState().tagRootPath
    const text = getSourceText()

    try {
      const result = await window.electronAPI.saveToTag({
        tagRootPath,
        tagName: tag.label,
        filename,
        text,
      })

      if (result.success) {
        log(`${getSourceLabel()} \u2192 ${result.path}`)
      } else {
        log(`Save failed: ${result.error}`)
      }
    } catch (err) {
      log(`Save error: ${err}`)
    }
  }

  const styles = useMemo(() => ({
    wrapper: {
      width: 200,
      flexShrink: 0,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      overflow: 'hidden' as const,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      overflow: 'hidden' as const,
      display: 'flex',
      flexDirection: 'column' as const,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: 2,
      marginBottom: 4,
    },
    sectionHeader: {
      ...cssFont('DMSans-Black'),
      fontSize: 14,
      letterSpacing: 14 * 0.14,
      color: colors.primary,
      marginBottom: 0,
    },
    jotRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingTop: 4,
      paddingBottom: 4,
    },
    jotInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
      flex: 1,
      minWidth: 0,
    },
    jotLabel: {
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      color: colors.textPrimary,
    },
    jotMeta: {
      ...cssFont('DMMono-Regular'),
      fontSize: 8,
      color: colors.textSecondary,
    },
    jotActions: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: 4,
      flexShrink: 0,
    },
    actionBtn: {
      width: 24,
      height: 24,
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...cssFont('DMSans-Bold'),
      fontSize: 14,
      padding: 0,
    } as React.CSSProperties,
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
    downloadAllBtn: {
      marginTop: 8,
      padding: '6px 0',
      border: `1px solid ${colors.primary}`,
      borderRadius: 4,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      ...cssFont('DMSans-Bold'),
      fontSize: 9,
      letterSpacing: 9 * 0.1,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    refreshBtn: {
      padding: '3px 8px',
      border: '1px solid #22c55e',
      borderRadius: 4,
      backgroundColor: 'transparent',
      color: '#22c55e',
      cursor: 'pointer',
      ...cssFont('DMSans-Bold'),
      fontSize: 8,
      letterSpacing: 8 * 0.1,
    } as React.CSSProperties,
    emptyHint: {
      ...cssFont('DMSans-Regular'),
      fontSize: 10,
      color: colors.textSecondary,
    },
    sectionCard: {
      background: `linear-gradient(180deg, ${colors.trayGradientBottom} 0%, ${colors.trayGradientTop} 100%)`,
      padding: '10px 10px 12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      flexShrink: 0,
    },
  }), [colors])

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <div style={styles.container}>
        <div style={{ ...styles.sectionCard, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <TagSection
            activeTab={activeTab}
            styles={styles}
            colors={colors}
            settingsPanel={sp}
            onSaveToTag={handleSaveToTag}
          />
        </div>

      </div>

      <ConsolePanel height={consoleHeight} onResizeStart={handleConsoleResizeStart} />

      <SaveToTagDialog
        visible={showSaveDialog}
        tagLabel={getTagLabel()}
        sourceLabel={getSourceLabel()}
        showMediaToggle={false}
        defaultFilename={generateDefaultFilename(getSourceText())}
        onSave={handleDialogSave}
        onCancel={() => setShowSaveDialog(false)}
      />

    </div>
  )
}
