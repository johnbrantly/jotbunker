import React, { useState } from 'react'
import type { ListItem } from '@jotbunker/shared'
import { useVirtualListsStore } from '../stores/virtualListsStore'
import { useVirtualLockedListsStore } from '../stores/virtualLockedListsStore'
import { useVirtualScratchpadStore } from '../stores/virtualScratchpadStore'
import { useWorkbenchStore } from '../stores/workbenchStore'

type Section = 'lists' | 'lockedLists' | 'scratchpad'

function ItemList({ items, label }: { items: ListItem[]; label: string }) {
  if (items.length === 0) {
    return (
      <div style={{ color: '#555', fontSize: 11, fontStyle: 'italic' }}>
        No items
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            fontSize: 11,
            padding: '2px 4px',
            background: '#111',
            borderRadius: 2,
            color: item.done ? '#666' : '#ccc',
            textDecoration: item.done ? 'line-through' : 'none',
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}

function ScratchpadComparison({
  virtualContents,
  desktopContents,
}: {
  virtualContents: Record<string, { content: string; updatedAt: number }>
  desktopContents: Record<string, { content: string; updatedAt: number }>
}) {
  const allCats = new Set([
    ...Object.keys(virtualContents),
    ...Object.keys(desktopContents),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...allCats].map((catId) => {
        const vp = virtualContents[catId]?.content || ''
        const dt = desktopContents[catId]?.content || ''
        const match = vp === dt
        return (
          <div key={catId}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: match ? '#666' : '#eab308',
                marginBottom: 2,
              }}
            >
              {catId} {match ? '\u2713' : '\u2260'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <pre
                style={{
                  flex: 1,
                  fontSize: 10,
                  background: '#111',
                  padding: 4,
                  borderRadius: 2,
                  margin: 0,
                  color: '#999',
                  maxHeight: 80,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {vp || '(empty)'}
              </pre>
              <pre
                style={{
                  flex: 1,
                  fontSize: 10,
                  background: '#111',
                  padding: 4,
                  borderRadius: 2,
                  margin: 0,
                  color: '#999',
                  maxHeight: 80,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {dt || '(empty)'}
              </pre>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ComparisonPanel() {
  const [section, setSection] = useState<Section>('lists')
  const desktopSnapshot = useWorkbenchStore((s) => s.desktopSnapshot)

  const virtualListsItems = useVirtualListsStore((s) => s.items)
  const virtualListsCats = useVirtualListsStore((s) => s.categories)
  const virtualLockedListsItems = useVirtualLockedListsStore((s) => s.items)
  const virtualLockedListsCats = useVirtualLockedListsStore((s) => s.categories)
  const virtualScratchpad = useVirtualScratchpadStore((s) => s.contents)

  if (!desktopSnapshot) {
    return (
      <div>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Comparison</h2>
        <div style={{ color: '#666', fontSize: 13 }}>
          No desktop snapshot available. Connect and complete a state sync first.
        </div>
      </div>
    )
  }

  const sections: Section[] = ['lists', 'lockedLists', 'scratchpad']
  const virtualItems =
    section === 'lists' ? virtualListsItems : virtualLockedListsItems
  const desktopItems =
    section === 'lists'
      ? (desktopSnapshot.lists as Record<string, ListItem[]>)
      : (desktopSnapshot.lockedLists as Record<string, ListItem[]>)
  const cats = section === 'lists' ? virtualListsCats : virtualLockedListsCats
  const allCatIds = new Set([
    ...Object.keys(virtualItems),
    ...Object.keys(desktopItems || {}),
    ...cats.map((c) => c.id),
  ])

  return (
    <div>
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
        Comparison: Virtual Phone vs Desktop
      </h2>

      <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              padding: '5px 14px',
              background: section === s ? '#333' : 'transparent',
              border: '1px solid',
              borderColor: section === s ? '#555' : 'transparent',
              color: section === s ? '#fff' : '#999',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {section === 'scratchpad' ? (
        <ScratchpadComparison
          virtualContents={virtualScratchpad}
          desktopContents={desktopSnapshot.scratchpad}
        />
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 700,
              color: '#888',
            }}
          >
            <div style={{ flex: 1 }}>VIRTUAL PHONE</div>
            <div style={{ flex: 1 }}>DESKTOP</div>
          </div>

          {[...allCatIds].map((catId) => {
            const vpItems = ((virtualItems[catId] || []) as ListItem[])
            const dtItems = ((desktopItems?.[catId] || []) as ListItem[])
            const match =
              vpItems.length === dtItems.length &&
              vpItems.every(
                (v, i) =>
                  dtItems[i] &&
                  v.id === dtItems[i].id &&
                  v.text === dtItems[i].text &&
                  v.done === dtItems[i].done,
              )

            return (
              <div key={catId} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: match ? '#666' : '#eab308',
                    marginBottom: 3,
                  }}
                >
                  {catId} ({vpItems.length}/{dtItems.length}){' '}
                  {match ? '\u2713' : '\u2260'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <ItemList items={vpItems} label="VP" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <ItemList items={dtItems} label="DT" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
