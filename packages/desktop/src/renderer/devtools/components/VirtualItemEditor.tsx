import React, { useState } from 'react'
import type { StoreItem } from '@jotbunker/shared'

interface VirtualItemEditorProps {
  items: StoreItem[]
  categoryId: string
  onAdd: (text: string) => void
  onDelete: (itemId: string) => void
  onToggle: (itemId: string) => void
  onUpdateText: (itemId: string, text: string) => void
}

export default function VirtualItemEditor({
  items,
  categoryId,
  onAdd,
  onDelete,
  onToggle,
  onUpdateText,
}: VirtualItemEditorProps) {
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleAdd = () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewText('')
  }

  const startEdit = (item: StoreItem) => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const commitEdit = () => {
    if (editingId && editText.trim()) {
      onUpdateText(editingId, editText.trim())
    }
    setEditingId(null)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`Add item to ${categoryId}...`}
          style={{
            flex: 1,
            padding: '5px 8px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#e0e0e0',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '5px 12px',
            background: '#22c55e',
            border: 'none',
            borderRadius: 4,
            color: '#000',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#555', fontSize: 12, fontStyle: 'italic' }}>
          No items
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 6px',
                background: '#1a1a1a',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              />
              {editingId === item.id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  onBlur={commitEdit}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '2px 4px',
                    background: '#111',
                    border: '1px solid #555',
                    borderRadius: 2,
                    color: '#e0e0e0',
                    fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(item)}
                  style={{
                    flex: 1,
                    textDecoration: item.done ? 'line-through' : 'none',
                    color: item.done ? '#666' : '#e0e0e0',
                    cursor: 'text',
                  }}
                >
                  {item.text}
                </span>
              )}
              <button
                onClick={() => onDelete(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 4px',
                  fontFamily: 'inherit',
                }}
                title="Delete"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
