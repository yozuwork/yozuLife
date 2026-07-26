import { useAppStore } from '../store/useAppStore'
import type { Group } from '../lib/types'
import './BottomNav.css'

const NAV: { key: Group | 'category' | 'add' | 'search'; icon: string; label: string }[] = [
  { key: 'collection', icon: 'auto_stories', label: '書櫃' },
  { key: 'physical', icon: 'inventory_2', label: '實體書' },
  { key: 'category', icon: 'category', label: '分類' },
  { key: 'add', icon: 'add', label: '新增' },
  { key: 'search', icon: 'search', label: '搜尋' },
]

export default function BottomNav() {
  const tab = useAppStore((s) => s.tab)
  const searchOpen = useAppStore((s) => s.searchOpen)
  const setTab = useAppStore((s) => s.setTab)
  const openAdd = useAppStore((s) => s.openAdd)
  const toggleSearch = useAppStore((s) => s.toggleSearch)

  return (
    <div className="bnav">
      {NAV.map((n) => {
        const active = n.key === tab || (n.key === 'search' && searchOpen)
        const isAdd = n.key === 'add'
        const onClick =
          n.key === 'collection' || n.key === 'physical' || n.key === 'category'
            ? () => setTab(n.key as Group | 'category')
            : n.key === 'add'
              ? () => openAdd()
              : () => toggleSearch()
        return (
          <button key={n.key} className={`bnav__item${active ? ' bnav__item--active' : ''}`} onClick={onClick}>
            <span className={`ms${isAdd ? ' bnav__icon--add' : ''}`} style={{ fontSize: 24 }}>
              {n.icon}
            </span>
            <span className="bnav__label">{n.label}</span>
          </button>
        )
      })}
    </div>
  )
}
