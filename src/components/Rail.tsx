import { useAppStore } from '../store/useAppStore'
import type { Group } from '../lib/types'
import './Rail.css'

const ITEMS: { key: Group | 'category' | 'settings'; icon: string; label: string }[] = [
  { key: 'collection', icon: 'auto_stories', label: '書櫃' },
  { key: 'physical', icon: 'inventory_2', label: '實體書' },
  { key: 'category', icon: 'category', label: '分類' },
  { key: 'settings', icon: 'settings', label: '設定' },
]

export default function Rail() {
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  const setSection = useAppStore((s) => s.setSection)

  return (
    <aside className="rail">
      <div className="rail__logo" onClick={() => setSection('hub')} title="回到總覽">
        漫
      </div>
      {ITEMS.map((it) => {
        const active = it.key === tab
        const onClick =
          it.key === 'collection' || it.key === 'physical' || it.key === 'category'
            ? () => setTab(it.key as Group | 'category')
            : undefined
        return (
          <div key={it.key} className={`rail__item${active ? ' rail__item--active' : ''}`} onClick={onClick}>
            <span className="ms" style={{ fontSize: 23 }}>
              {it.icon}
            </span>
            <span className="rail__label">{it.label}</span>
          </div>
        )
      })}
      <div className="rail__avatar">Y</div>
    </aside>
  )
}
