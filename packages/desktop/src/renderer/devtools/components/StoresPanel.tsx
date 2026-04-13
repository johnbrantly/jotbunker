import React, { useState } from 'react'
import type { StoreItem } from '@jotbunker/shared'
import { JOT_COUNT } from '@jotbunker/shared'
import { useVirtualListsStore } from '../stores/virtualListsStore'
import { useVirtualLockedListsStore } from '../stores/virtualLockedListsStore'
import { useVirtualScratchpadStore } from '../stores/virtualScratchpadStore'
import { useVirtualJotsStore } from '../stores/virtualJotsStore'
import VirtualItemEditor from './VirtualItemEditor'

type Tab = 'lists' | 'lockedLists' | 'scratchpad' | 'jots'

function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: { id: string; label: string }[]
  activeCategoryId: string
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 10, flexWrap: 'wrap' }}>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            padding: '3px 10px',
            background: c.id === activeCategoryId ? '#444' : '#222',
            border: '1px solid',
            borderColor: c.id === activeCategoryId ? '#666' : '#333',
            borderRadius: 3,
            color: c.id === activeCategoryId ? '#fff' : '#888',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

function ListsTab() {
  const items = useVirtualListsStore((s) => s.items)
  const categories = useVirtualListsStore((s) => s.categories)
  const activeCategoryId = useVirtualListsStore((s) => s.activeCategoryId)
  const setActiveCategory = useVirtualListsStore((s) => s.setActiveCategory)
  const addItem = useVirtualListsStore((s) => s.addItem)
  const deleteItem = useVirtualListsStore((s) => s.deleteItem)
  const toggleItem = useVirtualListsStore((s) => s.toggleItem)
  const updateItemText = useVirtualListsStore((s) => s.updateItemText)

  const catItems = (items[activeCategoryId] || []) as StoreItem[]

  return (
    <div>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategory}
      />
      <VirtualItemEditor
        items={catItems}
        categoryId={activeCategoryId}
        onAdd={addItem}
        onDelete={deleteItem}
        onToggle={toggleItem}
        onUpdateText={updateItemText}
      />
    </div>
  )
}

function LockedListsTab() {
  const items = useVirtualLockedListsStore((s) => s.items)
  const categories = useVirtualLockedListsStore((s) => s.categories)
  const activeCategoryId = useVirtualLockedListsStore((s) => s.activeCategoryId)
  const setActiveCategory = useVirtualLockedListsStore((s) => s.setActiveCategory)
  const addItem = useVirtualLockedListsStore((s) => s.addItem)
  const deleteItem = useVirtualLockedListsStore((s) => s.deleteItem)
  const toggleItem = useVirtualLockedListsStore((s) => s.toggleItem)
  const updateItemText = useVirtualLockedListsStore((s) => s.updateItemText)

  const catItems = (items[activeCategoryId] || []) as StoreItem[]

  return (
    <div>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategory}
      />
      <VirtualItemEditor
        items={catItems}
        categoryId={activeCategoryId}
        onAdd={addItem}
        onDelete={deleteItem}
        onToggle={toggleItem}
        onUpdateText={updateItemText}
      />
    </div>
  )
}

function ScratchpadTab() {
  const contents = useVirtualScratchpadStore((s) => s.contents)
  const categories = useVirtualScratchpadStore((s) => s.categories)
  const activeCategoryId = useVirtualScratchpadStore((s) => s.activeCategoryId)
  const setActiveCategory = useVirtualScratchpadStore(
    (s) => s.setActiveCategory,
  )
  const setContent = useVirtualScratchpadStore((s) => s.setContent)

  const current = contents[activeCategoryId]?.content || ''

  return (
    <div>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategory}
      />
      <textarea
        value={current}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Scratchpad content..."
        style={{
          width: '100%',
          height: 200,
          padding: 8,
          background: '#111',
          border: '1px solid #333',
          borderRadius: 4,
          color: '#e0e0e0',
          fontSize: 13,
          fontFamily: 'DMMono, monospace',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function JotsTab() {
  const jots = useVirtualJotsStore((s) => s.jots)
  const activeJotId = useVirtualJotsStore((s) => s.activeJotId)
  const setActiveJot = useVirtualJotsStore((s) => s.setActiveJot)
  const updateText = useVirtualJotsStore((s) => s.updateText)

  const jotButtons = Array.from({ length: JOT_COUNT }, (_, i) => i + 1)
  const currentText = jots[activeJotId]?.text || ''

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {jotButtons.map((id) => (
          <button
            key={id}
            onClick={() => setActiveJot(id)}
            style={{
              padding: '4px 12px',
              background: id === activeJotId ? '#444' : '#222',
              border: '1px solid',
              borderColor: id === activeJotId ? '#666' : '#333',
              borderRadius: 3,
              color: id === activeJotId ? '#fff' : '#888',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {id}
          </button>
        ))}
      </div>
      <textarea
        value={currentText}
        onChange={(e) => updateText(activeJotId, e.target.value)}
        placeholder={`Jot ${activeJotId} text...`}
        style={{
          width: '100%',
          height: 200,
          padding: 8,
          background: '#111',
          border: '1px solid #333',
          borderRadius: 4,
          color: '#e0e0e0',
          fontSize: 13,
          fontFamily: 'DMMono, monospace',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'lists', label: 'Lists' },
  { id: 'lockedLists', label: 'Locked Lists' },
  { id: 'scratchpad', label: 'Scratchpad' },
  { id: 'jots', label: 'Jots' },
]

export default function StoresPanel() {
  const [tab, setTab] = useState<Tab>('lists')

  return (
    <div>
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
        Virtual Phone Stores
      </h2>
      <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 14px',
              background: tab === t.id ? '#333' : 'transparent',
              border: '1px solid',
              borderColor: tab === t.id ? '#555' : 'transparent',
              color: tab === t.id ? '#fff' : '#999',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'lists' && <ListsTab />}
      {tab === 'lockedLists' && <LockedListsTab />}
      {tab === 'scratchpad' && <ScratchpadTab />}
      {tab === 'jots' && <JotsTab />}
    </div>
  )
}
