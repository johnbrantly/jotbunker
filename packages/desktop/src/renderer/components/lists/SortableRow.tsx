import React, { useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ListItemData } from './ListView'
import type { Styles } from './listViewStyles'

interface SortableRowProps {
  item: ListItemData
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateText?: (id: string, text: string) => void
  styles: Styles
}

export function SortableRow({ item, onToggle, onDelete, onUpdateText, styles }: SortableRowProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    ...styles.row,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    outline: 'none',
  }

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== item.text && onUpdateText) {
      onUpdateText(item.id, trimmed)
    }
    setEditing(false)
  }, [editText, item.id, item.text, onUpdateText])

  const cancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
      }
      // Stop propagation so dnd-kit KeyboardSensor doesn't intercept
      // typing (e.g. Space triggering drag activation)
      e.stopPropagation()
    },
    [commitEdit, cancelEdit],
  )

  const handleTextClick = useCallback(() => {
    if (onUpdateText) {
      setEditText(item.text)
      setEditing(true)
    }
  }, [item.text, onUpdateText])

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span style={styles.dragHandle}>
        &#x2807;&#x2807;
      </span>
      <button style={styles.checkbox} onClick={() => onToggle(item.id)}>
        <div
          style={{
            ...styles.checkInner,
            ...(item.done ? styles.checkInnerChecked : {}),
          }}
        >
          {item.done && <span style={styles.checkmark}>&#x2713;</span>}
        </div>
      </button>
      {editing ? (
        <textarea
          ref={(el) => {
            if (el) {
              el.focus()
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }
          }}
          rows={1}
          style={{
            ...styles.itemText,
            ...styles.editInput,
          }}
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }}
          onKeyDown={handleEditKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={commitEdit}
        />
      ) : (
        <span
          style={{
            ...styles.itemText,
            ...(item.done ? styles.itemTextDone : {}),
            ...(onUpdateText ? { cursor: 'text' } : {}),
          }}
          onClick={handleTextClick}
        >
          {item.text}
        </span>
      )}
      <button style={styles.deleteBtn} onClick={() => onDelete(item.id)}>
        &#xd7;
      </button>
    </div>
  )
}
