import React, { useState, useEffect, useMemo } from 'react'
import {
  cssFont,
  MAX_CATEGORY_LABEL_LENGTH,
  buildTheme,
} from '../styles/tokens'
import { DEFAULT_SYNC_PORT } from '@jotbunker/shared'
import { useScratchpadStore } from '../stores/scratchpadStore'
import { useListsStore } from '../stores/listsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTagStore } from '../stores/tagStore'
import { useTheme } from '../hooks/useTheme'
import CategoryEditor from './settings/CategoryEditor'
import BackupSection from './settings/BackupSection'
import NetworkSyncSection from './settings/NetworkSyncSection'
import FontSizeSection from './settings/FontSizeSection'
import AccentColorSection from './settings/AccentColorSection'
import DebugLoggingSection from './settings/DebugLoggingSection'
import SyncHistorySection from './settings/SyncHistorySection'
import FolderPathsSection from './settings/FolderPathsSection'

interface Props {
  onClose: () => void
  onOpenSyncLog: () => void
}

export default function SettingsModal({ onClose, onOpenSyncLog }: Props) {
  const { colors, confirmDialog: dialog, settingsPanel: sp } = useTheme()
  const scratchpadCats = useScratchpadStore((s) => s.categories)
  const updateScratchpadCats = useScratchpadStore((s) => s.updateCategories)
  const listsCats = useListsStore((s) => s.categories)
  const updateListsCats = useListsStore((s) => s.updateCategories)
  const lockedListsCats = useLockedListsStore((s) => s.categories)
  const updateLockedListsCats = useLockedListsStore((s) => s.updateCategories)
  const tagRootPath = useSettingsStore((s) => s.tagRootPath)
  const setTagRootPath = useSettingsStore((s) => s.setTagRootPath)
  const accentHue = useSettingsStore((s) => s.accentHue)
  const setAccentHue = useSettingsStore((s) => s.setAccentHue)
  const accentGrayscale = useSettingsStore((s) => s.accentGrayscale)
  const setAccentGrayscale = useSettingsStore((s) => s.setAccentGrayscale)
  const scratchpadFontSize = useSettingsStore((s) => s.scratchpadFontSize)
  const setScratchpadFontSizeStore = useSettingsStore((s) => s.setScratchpadFontSize)
  const listFontSize = useSettingsStore((s) => s.listFontSize)
  const setListFontSizeStore = useSettingsStore((s) => s.setListFontSize)
  const tagFontSize = useSettingsStore((s) => s.tagFontSize)
  const setTagFontSizeStore = useSettingsStore((s) => s.setTagFontSize)
  const syncPort = useSettingsStore((s) => s.syncPort)
  const setSyncPortStore = useSettingsStore((s) => s.setSyncPort)
  const syncInterfaceIp = useSettingsStore((s) => s.syncInterfaceIp)
  const setSyncInterfaceIpStore = useSettingsStore((s) => s.setSyncInterfaceIp)
  const debugLog = useSettingsStore((s) => s.debugLog)
  const setDebugLogStore = useSettingsStore((s) => s.setDebugLog)
  const pairingSecret = useSettingsStore((s) => s.pairingSecret)
  const setPairingSecret = useSettingsStore((s) => s.setPairingSecret)

  const [scratchpadVals, setScratchpadVals] = useState(scratchpadCats.map((c) => c.label))
  const [listsVals, setListsVals] = useState(listsCats.map((c) => c.label))
  const [lockedListsVals, setLockedListsVals] = useState(lockedListsCats.map((c) => c.label))
  const [hueVal, setHueVal] = useState(accentHue)
  const [gsVal, setGsVal] = useState(accentGrayscale)
  const [spFontSize, setSpFontSize] = useState(scratchpadFontSize)
  const [lsFontSize, setLsFontSize] = useState(listFontSize)
  const [tgFontSize, setTgFontSize] = useState(tagFontSize)
  const [portVal, setPortVal] = useState(syncPort)
  const [interfaces, setInterfaces] = useState<{ name: string; address: string }[]>([])
  const [selectedIp, setSelectedIp] = useState('')
  const [staleIpWarning, setStaleIpWarning] = useState('')
  const [debugLogVal, setDebugLogVal] = useState(debugLog)


  useEffect(() => {
    if (!pairingSecret) {
      setPairingSecret(crypto.randomUUID())
    }
  }, [])

  useEffect(() => {
    window.electronAPI.getNetworkInterfaces().then((ifaces) => {
      setInterfaces(ifaces)
      if (syncInterfaceIp && ifaces.some((i) => i.address === syncInterfaceIp)) {
        setSelectedIp(syncInterfaceIp)
      } else if (syncInterfaceIp && ifaces.length > 0) {
        setStaleIpWarning(`Previously selected adapter (${syncInterfaceIp}) is no longer available`)
      } else if (ifaces.length > 0) {
        setSelectedIp(ifaces[0].address)
      }
    })
  }, [])

  useEffect(() => {
    setScratchpadVals(scratchpadCats.map((c) => c.label))
    setListsVals(listsCats.map((c) => c.label))
    setLockedListsVals(lockedListsCats.map((c) => c.label))
    setHueVal(accentHue)
    setGsVal(accentGrayscale)
    setSpFontSize(scratchpadFontSize)
    setLsFontSize(listFontSize)
    setTgFontSize(tagFontSize)
    setPortVal(syncPort)
    setDebugLogVal(debugLog)
  }, [scratchpadCats, listsCats, lockedListsCats, accentHue, accentGrayscale, scratchpadFontSize, listFontSize, tagFontSize, syncPort, debugLog])

  const previewColor = buildTheme(hueVal, gsVal).colors.primary

  const handleSave = () => {
    updateScratchpadCats(
      scratchpadCats.map((c, i) => {
        const newLabel = (scratchpadVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH)
        return newLabel !== c.label
          ? { ...c, label: newLabel, updatedAt: Date.now() }
          : c
      }),
    )
    updateListsCats(
      listsCats.map((c, i) => {
        const newLabel = (listsVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH)
        return newLabel !== c.label
          ? { ...c, label: newLabel, updatedAt: Date.now() }
          : c
      }),
    )
    updateLockedListsCats(
      lockedListsCats.map((c, i) => {
        const newLabel = (lockedListsVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH)
        return newLabel !== c.label
          ? { ...c, label: newLabel, updatedAt: Date.now() }
          : c
      }),
    )
    setAccentHue(hueVal)
    setAccentGrayscale(gsVal)
    setScratchpadFontSizeStore(spFontSize)
    setListFontSizeStore(lsFontSize)
    setTagFontSizeStore(tgFontSize)
    const newPort = portVal || DEFAULT_SYNC_PORT
    setSyncPortStore(newPort)
    window.electronAPI.setSyncPort(newPort)
    window.electronAPI.setPairingSecret(pairingSecret)
    setSyncInterfaceIpStore(selectedIp)
    setDebugLogStore(debugLogVal)
    onClose()
  }

  const handleRestoreComplete = async (data: any) => {
    if (data.scratchpad) {
      const now = Date.now()
      const freshContents = (data.scratchpad.contents as { content: string; updatedAt: number }[]).map(
        (entry) => ({ content: entry.content, updatedAt: now }),
      )
      useScratchpadStore.setState({ contents: freshContents, categories: data.scratchpad.categories })
      setScratchpadVals((data.scratchpad.categories as { label: string }[]).map((c) => c.label))
    }
    useListsStore.setState({ items: data.lists.items, categories: data.lists.categories })

    // Locked list items are plaintext — no decryption needed
    useLockedListsStore.setState({ items: data.lockedLists.items, categories: data.lockedLists.categories })
    if (data.tags) {
      useTagStore.setState({
        tags: data.tags.map((t: any) => ({ ...t, isFavorite: t.isFavorite ?? false })),
      })
    }
    setListsVals((data.lists.categories as { label: string }[]).map((c) => c.label))
    setLockedListsVals((data.lockedLists.categories as { label: string }[]).map((c) => c.label))
  }

  const styles = useMemo(() => ({
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: dialog.overlayBg,
      backdropFilter: `blur(${dialog.blurAmount}px)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    box: {
      backgroundColor: colors.dialogBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: colors.dialogBorder,
      borderRadius: dialog.boxRadius,
      paddingTop: dialog.boxPaddingV,
      paddingBottom: dialog.boxPaddingV,
      paddingLeft: dialog.boxPaddingH,
      paddingRight: dialog.boxPaddingH,
      width: sp.boxWidth * 2,
      maxHeight: sp.maxHeight,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: dialog.boxGap,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: dialog.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: dialog.titleFontSize * dialog.titleLetterSpacing,
      textAlign: 'center' as const,
      marginBottom: sp.titleMarginBottom,
      display: 'block',
    },
    section: {
      marginBottom: 20,
      width: '100%',
    },
    sectionLabel: {
      ...cssFont('DMSans-Bold'),
      fontSize: sp.sectionLabelFontSize,
      letterSpacing: sp.sectionLabelFontSize * sp.sectionLabelLetterSpacing,
      color: sp.sectionLabelColor,
      marginBottom: sp.sectionLabelMarginBottom,
      display: 'block',
    },
    fieldLabel: {
      ...cssFont('DMMono-Bold'),
      fontSize: 9,
      letterSpacing: 9 * 0.08,
      color: colors.textSecondary,
      marginBottom: 4,
      display: 'block',
    },
    inputRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: sp.rowGap,
      marginBottom: sp.rowMarginBottom,
    },
    rowNum: {
      ...cssFont('DMMono-Bold'),
      fontSize: sp.rowNumFontSize,
      color: sp.rowNumColor,
      width: sp.rowNumWidth,
      textAlign: 'right' as const,
    },
    input: {
      flex: 1,
      backgroundColor: sp.inputBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.inputBorder,
      borderRadius: sp.inputRadius,
      paddingTop: sp.inputPaddingV,
      paddingBottom: sp.inputPaddingV,
      paddingLeft: sp.inputPaddingH,
      paddingRight: sp.inputPaddingH,
      color: colors.textPrimary,
      ...cssFont('DMSans-Bold'),
      fontSize: sp.inputFontSize,
      letterSpacing: sp.inputFontSize * sp.inputLetterSpacing,
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: dialog.btnGap,
      width: '100%',
    },
    cancelBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: dialog.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: dialog.cancelBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.primary,
    },
    saveBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: sp.saveBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.saveBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.primary,
    },
    browseBtn: {
      paddingTop: sp.pillPaddingV,
      paddingBottom: sp.pillPaddingV,
      paddingLeft: sp.pillPaddingH,
      paddingRight: sp.pillPaddingH,
      borderRadius: sp.pillRadius,
      backgroundColor: sp.pillBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.pillBorder,
      cursor: 'pointer',
    },
    browseText: {
      ...cssFont('DMSans-Bold'),
      fontSize: sp.pillFontSize,
      letterSpacing: sp.pillFontSize * sp.pillLetterSpacing,
      color: colors.primary,
    },
    sliderWrapper: {
      position: 'relative' as const,
      width: '100%',
      height: 24,
    },
    divider: {
      width: '100%',
      height: 1,
      background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
      opacity: 0.25,
      marginBottom: 20,
    },
  }), [colors, dialog, sp])

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <div className="settings-scroll" style={{ width: '100%', overflowY: 'auto', maxHeight: sp.maxHeight - 80 }}>
          <span style={styles.title}>SETTINGS</span>

          <NetworkSyncSection
            selectedIp={selectedIp}
            setSelectedIp={setSelectedIp}
            portVal={portVal}
            setPortVal={setPortVal}
            interfaces={interfaces}
            staleIpWarning={staleIpWarning}
            setStaleIpWarning={setStaleIpWarning}
            pairingSecret={pairingSecret}
            styles={styles}
            colors={colors}
          />

          <div style={styles.divider} />

          <AccentColorSection
            hueVal={hueVal}
            setHueVal={setHueVal}
            gsVal={gsVal}
            setGsVal={setGsVal}
            previewColor={previewColor}
            styles={styles}
            sp={sp}
          />

          <div style={styles.divider} />

          <FontSizeSection
            spFontSize={spFontSize}
            setSpFontSize={setSpFontSize}
            lsFontSize={lsFontSize}
            setLsFontSize={setLsFontSize}
            tagFontSize={tgFontSize}
            setTagFontSize={setTgFontSize}
            styles={styles}
            sp={sp}
          />

          <div style={styles.divider} />

          <CategoryEditor
            label="SCRATCHPAD CATEGORIES"
            values={scratchpadVals}
            onChange={setScratchpadVals}
            styles={styles}
          />
          <div style={styles.divider} />

          <CategoryEditor
            label="LISTS CATEGORIES"
            values={listsVals}
            onChange={setListsVals}
            styles={styles}
          />
          <div style={styles.divider} />

          <CategoryEditor
            label="LOCKED LISTS CATEGORIES"
            values={lockedListsVals}
            onChange={setLockedListsVals}
            styles={styles}
          />

          <div style={styles.divider} />

          <FolderPathsSection
            tagRootPath={tagRootPath}
            setTagRootPath={setTagRootPath}
            styles={styles}
            colors={colors}
          />

          <div style={styles.divider} />

          <BackupSection
            styles={styles}
            colors={colors}
            onRestoreComplete={handleRestoreComplete}
          />

          <div style={styles.divider} />

          <DebugLoggingSection
            debugLogVal={debugLogVal}
            setDebugLogVal={setDebugLogVal}
            styles={styles}
            sp={sp}
          />

          <div style={styles.divider} />

          <SyncHistorySection
            onOpenSyncLog={() => { onClose(); onOpenSyncLog() }}
            styles={styles}
          />


        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onClose}>
            <span style={styles.cancelText}>CANCEL</span>
          </button>
          <button style={styles.saveBtn} onClick={handleSave}>
            <span style={styles.saveText}>SAVE</span>
          </button>
        </div>
      </div>
    </div>
  )
}
