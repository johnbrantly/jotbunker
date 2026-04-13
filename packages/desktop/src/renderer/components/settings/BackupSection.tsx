import React, { useState, useRef } from 'react'
import { encryptBackup, decryptBackup } from '../../crypto/backupCrypto'
import { useScratchpadStore } from '../../stores/scratchpadStore'
import { useListsStore } from '../../stores/listsStore'
import { useLockedListsStore } from '../../stores/lockedListsStore'
import { useTagStore } from '../../stores/tagStore'
import { useConsoleStore } from '../../stores/consoleStore'
import ConfirmDialog from '../ConfirmDialog'
import PasswordDialog from '../PasswordDialog'

interface BackupSectionProps {
  styles: {
    section: React.CSSProperties
    sectionLabel: React.CSSProperties
    browseBtn: React.CSSProperties
    browseText: React.CSSProperties
  }
  colors: { textSecondary: string }
  onRestoreComplete: (data: {
    scratchpad?: { contents: { content: string; updatedAt: number }[]; categories: { label: string }[] }
    lists: { items: unknown[][]; categories: { label: string }[] }
    lockedLists: { items: unknown[][]; categories: { label: string }[] }
  }) => void
}

export default function BackupSection({ styles, colors, onRestoreComplete }: BackupSectionProps) {
  const log = useConsoleStore((s) => s.log)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordMode, setPasswordMode] = useState<'create' | 'unlock'>('create')
  const [passwordTitle, setPasswordTitle] = useState('')
  const [alertMsg, setAlertMsg] = useState<{ title: string; message: string; variant: 'destructive' | 'success' } | null>(null)
  const pendingRestoreData = useRef<any>(null)

  // ── Secure Backup (password-encrypted) ──

  const handleSecureBackup = () => {
    setPasswordMode('create')
    setPasswordTitle('SECURE BACKUP')
    setShowPasswordDialog(true)
  }

  const handleSecureBackupPassword = async (password: string) => {
    setShowPasswordDialog(false)

    const spState = useScratchpadStore.getState()
    const listsState = useListsStore.getState()
    const lockedListsState = useLockedListsStore.getState()
    const tagState = useTagStore.getState()

    // Assemble all data as plaintext (locked list items stored in plaintext on desktop)
    const payload = {
      scratchpad: { contents: spState.contents, categories: spState.categories },
      lists: { items: listsState.items, categories: listsState.categories },
      lockedLists: { items: lockedListsState.items, categories: lockedListsState.categories },
      tags: tagState.tags,
      exportedAt: new Date().toISOString(),
    }

    // Encrypt entire payload with user password
    const encrypted = await encryptBackup(JSON.stringify(payload), password)

    const result = await window.electronAPI.saveBackup({
      encrypted: true,
      salt: encrypted.salt,
      iv: encrypted.iv,
      data: encrypted.data,
      exportedAt: new Date().toISOString(),
    })
    if (result.success) { log(`Secure backup saved: ${result.path}`); setAlertMsg({ title: 'Secure Backup Saved', message: `Saved to:\n${result.path}`, variant: 'success' }) }
    else if (result.error) { log(`Backup error: ${result.error}`); setAlertMsg({ title: 'Backup Failed', message: result.error, variant: 'destructive' }) }
  }

  // ── Unsecure Backup (plaintext) ──

  const handleBackup = async () => {
    const spState = useScratchpadStore.getState()
    const listsState = useListsStore.getState()
    const lockedListsState = useLockedListsStore.getState()
    const tagState = useTagStore.getState()

    // Store locked list items as plaintext (they're already decrypted in the store)
    const result = await window.electronAPI.saveBackup({
      scratchpad: { contents: spState.contents, categories: spState.categories },
      lists: { items: listsState.items, categories: listsState.categories },
      lockedLists: { items: lockedListsState.items, categories: lockedListsState.categories },
      tags: tagState.tags,
      exportedAt: new Date().toISOString(),
    })
    if (result.success) { log(`Backup saved: ${result.path}`); setAlertMsg({ title: 'Backup Saved', message: `Saved to:\n${result.path}`, variant: 'success' }) }
    else if (result.error) { log(`Backup error: ${result.error}`); setAlertMsg({ title: 'Backup Failed', message: result.error, variant: 'destructive' }) }
  }

  // ── Restore ──

  const handleRestore = async () => {
    const result = await window.electronAPI.restoreBackup()
    if (!result.success) {
      if (result.error !== 'cancelled') { log(`Restore error: ${result.error}`); setAlertMsg({ title: 'Restore Failed', message: result.error || 'Unknown error', variant: 'destructive' }) }
      return
    }

    const data = result.data as any
    if (data.encrypted === true) {
      // Encrypted backup — prompt for password
      pendingRestoreData.current = data
      setPasswordMode('unlock')
      setPasswordTitle('RESTORE SECURE BACKUP')
      setShowPasswordDialog(true)
    } else {
      // Unencrypted backup — locked list items are plaintext
      pendingRestoreData.current = data
      setShowRestoreConfirm(true)
    }
  }

  const handleRestorePassword = async (password: string) => {
    setShowPasswordDialog(false)
    const encData = pendingRestoreData.current
    if (!encData) return

    try {
      const json = await decryptBackup(
        { salt: encData.salt, iv: encData.iv, data: encData.data },
        password,
      )
      const inner = JSON.parse(json)

      // Locked list items are plaintext — no decryption needed

      pendingRestoreData.current = inner
      setShowRestoreConfirm(true)
    } catch {
      pendingRestoreData.current = null
      log('Wrong password or corrupted backup')
      setAlertMsg({ title: 'Restore Failed', message: 'Wrong password or corrupted backup.', variant: 'destructive' })
    }
  }

  const confirmRestore = () => {
    const data = pendingRestoreData.current
    if (data) {
      // Reset sync timestamp before applying data — restored state doesn't
      // match what was previously synced, so deletion detection must be
      // disabled on the next sync.
      localStorage.removeItem('lastSyncTimestamp')
      onRestoreComplete(data)
      log('Backup restored successfully')
      setAlertMsg({ title: 'Restore Complete', message: 'Backup restored successfully.', variant: 'success' })
    }
    pendingRestoreData.current = null
    setShowRestoreConfirm(false)
  }

  return (
    <>
      <div style={styles.section}>
        <span style={styles.sectionLabel}>DATA BACKUP</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' as const }}>
          <button style={styles.browseBtn} onClick={handleSecureBackup}>
            <span style={styles.browseText}>SECURE BACKUP</span>
          </button>
          <button style={styles.browseBtn} onClick={handleBackup}>
            <span style={styles.browseText}>BACKUP</span>
          </button>
          <button style={styles.browseBtn} onClick={handleRestore}>
            <span style={styles.browseText}>RESTORE</span>
          </button>
        </div>
      </div>
      <PasswordDialog
        visible={showPasswordDialog}
        mode={passwordMode}
        title={passwordTitle}
        onSubmit={passwordMode === 'create' ? handleSecureBackupPassword : handleRestorePassword}
        onCancel={() => { setShowPasswordDialog(false); pendingRestoreData.current = null }}
      />
      <ConfirmDialog
        visible={showRestoreConfirm}
        title="Restore Backup"
        message="This will replace ALL your current Scratchpad, Lists, Locked Lists, and Tags data with the backup. This cannot be undone."
        confirmLabel="RESTORE"
        onConfirm={confirmRestore}
        onCancel={() => { pendingRestoreData.current = null; setShowRestoreConfirm(false) }}
      />
      {alertMsg && (
        <ConfirmDialog
          visible
          title={alertMsg.title}
          message={alertMsg.message}
          variant={alertMsg.variant}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={() => setAlertMsg(null)}
          onCancel={() => setAlertMsg(null)}
        />
      )}
    </>
  )
}
