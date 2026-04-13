import React, { useState, useEffect } from 'react'
import { cssFont } from '../../styles/tokens'

interface Props {
  tagRootPath: string
  setTagRootPath: (path: string) => void
  styles: Record<string, any>
  colors: Record<string, any>
}

export default function FolderPathsSection({
  tagRootPath, setTagRootPath,
  styles, colors,
}: Props) {
  const [defaultTagPath, setDefaultTagPath] = useState('')

  useEffect(() => {
    window.electronAPI.getDocumentsPath().then((docs) => {
      setDefaultTagPath(docs + '\\Jotbunker Tags')
    })
  }, [])

  const pathStyle: React.CSSProperties = {
    ...cssFont('DMMono-Regular'),
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.7,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  }

  const changeBtn: React.CSSProperties = {
    flexShrink: 0,
    padding: '3px 8px',
    borderRadius: 4,
    ...cssFont('DMSans-Bold'),
    fontSize: 9,
    letterSpacing: 9 * 0.08,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
  }

  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>SAVE FOLDER</span>

      <span style={styles.fieldLabel}>TAG SAVE FOLDER</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={pathStyle} title={tagRootPath || defaultTagPath}>
          {tagRootPath || defaultTagPath || 'Documents/Jotbunker Tags'}
        </span>
        <button
          style={changeBtn}
          onClick={async () => {
            const picked = await window.electronAPI.pickFolder(tagRootPath || defaultTagPath)
            if (picked) setTagRootPath(picked)
          }}
        >
          CHANGE
        </button>
      </div>
    </div>
  )
}
