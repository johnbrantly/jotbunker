import React, { useState, useEffect, useMemo } from 'react'
import { cssFont, buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from '../styles/tokens'
import { DEFAULT_SYNC_PORT } from '@jotbunker/shared'
import NetworkSyncSection from './settings/NetworkSyncSection'
import AccentColorSection from './settings/AccentColorSection'
import FolderPathsSection from './settings/FolderPathsSection'
import { useSettingsStore } from '../stores/settingsStore'
import jbLogo from '../assets/jb-logo.png'

interface Props {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0)

  // Local state mirroring SettingsModal pattern
  const [hueVal, setHueVal] = useState(DEFAULT_HUE)
  const [gsVal, setGsVal] = useState(DEFAULT_GRAYSCALE)
  const [portVal, setPortVal] = useState(DEFAULT_SYNC_PORT)
  const [selectedIp, setSelectedIp] = useState('')
  const [staleIpWarning, setStaleIpWarning] = useState('')
  const [interfaces, setInterfaces] = useState<{ name: string; address: string }[]>([])
  const [pairingSecret, setPairingSecret] = useState('')
  const [tagRootPath, setTagRootPath] = useState('')

  // Generate pairing secret on mount
  useEffect(() => {
    setPairingSecret(crypto.randomUUID())
  }, [])

  // Fetch network interfaces
  useEffect(() => {
    window.electronAPI.getNetworkInterfaces().then((ifaces) => {
      setInterfaces(ifaces)
      if (ifaces.length > 0) {
        setSelectedIp(ifaces[0].address)
      }
    })
  }, [])

  // Build a live-preview theme from local hue/gs
  const previewTheme = useMemo(() => buildTheme(hueVal, gsVal), [hueVal, gsVal])
  const { colors, confirmDialog: dialog, settingsPanel: sp } = previewTheme
  const previewColor = previewTheme.colors.primary

  const handleSkip = () => {
    useSettingsStore.getState().setSetupComplete(true)
    onComplete()
  }

  const handleFinish = () => {
    const store = useSettingsStore.getState()
    // Apply theme
    store.setAccentHue(hueVal)
    store.setAccentGrayscale(gsVal)
    // Apply network
    if (selectedIp) {
      store.setSyncInterfaceIp(selectedIp)
      store.setSyncPort(portVal || DEFAULT_SYNC_PORT)
      store.setPairingSecret(pairingSecret)
      window.electronAPI.setSyncPort(portVal || DEFAULT_SYNC_PORT)
      window.electronAPI.setPairingSecret(pairingSecret)
    }
    // Apply save folders
    if (tagRootPath) store.setTagRootPath(tagRootPath)
    // Mark complete
    store.setSetupComplete(true)
    onComplete()
  }

  const totalSteps = 4

  // Shared styles — use live preview theme colors
  const styles = useMemo(() => ({
    container: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: colors.background,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    },
    dots: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 32,
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: 420,
      maxHeight: 'calc(100vh - 160px)',
      overflow: 'auto' as const,
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: dialog.btnGap,
      marginTop: 32,
      width: 420,
    },
    primaryBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: colors.primary,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    primaryBtnText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.background,
    },
    secondaryBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: colors.border,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    secondaryBtnText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.textSecondary,
    },
    skipBtn: {
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      paddingLeft: 16,
      paddingRight: 16,
      borderRadius: dialog.btnRadius,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
    skipText: {
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      letterSpacing: 0.8,
      color: colors.textSecondary,
      opacity: 0.5,
    },
    // Re-used by NetworkSyncSection/AccentColorSection/FolderPathsSection
    section: { marginBottom: 20, width: '100%' },
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
  }), [colors, dialog, sp])

  const renderDots = () => (
    <div style={styles.dots}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= step ? colors.primary : 'transparent',
            border: `1.5px solid ${colors.primary}`,
          }}
        />
      ))}
    </div>
  )

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div style={styles.container}>
        {renderDots()}
        <div style={styles.content}>
          <img src={jbLogo} alt="Jotbunker" style={{ width: 80, height: 80, marginBottom: 24 }} />
          <span style={{
            ...cssFont('DMSans-Black'),
            fontSize: 28,
            color: colors.textPrimary,
            letterSpacing: 2,
            marginBottom: 12,
          }}>
            JOTBUNKER
          </span>
          <span style={{
            ...cssFont('DMSans-Regular'),
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
          }}>
            Jot on your phone. Work and store in your Bunker.{'\n'}Sync over local Wi-Fi with no cloud, no accounts, and no subscription.{'\n\n'}This app on your computer is your command center for work in progress.{'\n'}Drop plans, brainstorms, and context into Scratchpads on your computer, then keep working on them from your phone when you step away.{'\n'}Full local copies stay on both devices, syncing over local Wi-Fi when connected.
          </span>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.primaryBtn} onClick={() => setStep(1)}>
            <span style={styles.primaryBtnText}>GET STARTED</span>
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Theme
  if (step === 1) {
    return (
      <div style={styles.container}>
        {renderDots()}
        <div style={styles.content}>
          <span style={{
            ...cssFont('DMSans-Regular'),
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            Jotbunker uses dark mode with a single accent color to theme the entire app. Pick one you like — you can always change it later in Settings.
          </span>
          <AccentColorSection
            hueVal={hueVal}
            setHueVal={setHueVal}
            gsVal={gsVal}
            setGsVal={setGsVal}
            previewColor={previewColor}
            styles={styles}
            sp={sp}
          />
        </div>
        <div style={styles.btnRow}>
          <button style={styles.secondaryBtn} onClick={() => setStep(0)}>
            <span style={styles.secondaryBtnText}>BACK</span>
          </button>
          <button style={styles.primaryBtn} onClick={() => setStep(2)}>
            <span style={styles.primaryBtnText}>NEXT</span>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Save Folders
  if (step === 2) {
    return (
      <div style={styles.container}>
        {renderDots()}
        <div style={styles.content}>
          <FolderPathsSection
            tagRootPath={tagRootPath}
            setTagRootPath={setTagRootPath}
            styles={styles}
            colors={colors}
          />
        </div>
        <div style={styles.btnRow}>
          <button style={styles.secondaryBtn} onClick={() => setStep(1)}>
            <span style={styles.secondaryBtnText}>BACK</span>
          </button>
          <button style={styles.primaryBtn} onClick={() => setStep(3)}>
            <span style={styles.primaryBtnText}>NEXT</span>
          </button>
          <button style={styles.skipBtn} onClick={handleSkip}>
            <span style={styles.skipText}>SKIP SETUP</span>
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Network
  return (
    <div style={styles.container}>
      {renderDots()}
      <div style={styles.content}>
        <NetworkSyncSection
          selectedIp={selectedIp}
          setSelectedIp={setSelectedIp}
          portVal={portVal}
          setPortVal={setPortVal}
          interfaces={interfaces}
          staleIpWarning={staleIpWarning}
          setStaleIpWarning={setStaleIpWarning}
          pairingSecret={pairingSecret}
          hideAutoSync
          styles={styles}
          colors={colors}
        />
      </div>
      <div style={styles.btnRow}>
        <button style={styles.secondaryBtn} onClick={() => setStep(2)}>
          <span style={styles.secondaryBtnText}>BACK</span>
        </button>
        <button style={styles.primaryBtn} onClick={handleFinish}>
          <span style={styles.primaryBtnText}>FINISH</span>
        </button>
      </div>
    </div>
  )
}
