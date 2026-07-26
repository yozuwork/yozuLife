import { useAppStore } from '../store/useAppStore'
import { SHELF_KICKER, SHELF_TITLE } from '../lib/constants'
import type { Group } from '../lib/types'
import './MobileHeader.css'

export default function MobileHeader() {
  const tab = useAppStore((s) => s.tab)
  const categoryFilter = useAppStore((s) => s.categoryFilter)
  const setCategory = useAppStore((s) => s.setCategory)
  const searchOpen = useAppStore((s) => s.searchOpen)
  const searchText = useAppStore((s) => s.searchText)
  const toggleSearch = useAppStore((s) => s.toggleSearch)
  const setSearch = useAppStore((s) => s.setSearch)
  const selectMode = useAppStore((s) => s.selectMode)
  const toggleSelectMode = useAppStore((s) => s.toggleSelectMode)
  const setSection = useAppStore((s) => s.setSection)

  const showBack = tab === 'category' && !!categoryFilter
  const tabTitle =
    tab === 'category' ? (categoryFilter ? `＃${categoryFilter}` : '分類') : SHELF_TITLE[tab as Group]
  const tabKicker = tab === 'category' ? 'Categories' : SHELF_KICKER[tab as Group]

  return (
    <div className="mheader">
      <div className="mheader__row">
        <div>
          {showBack && (
            <button className="mheader__back" onClick={() => setCategory(null)}>
              <span className="ms" style={{ fontSize: 16 }}>
                chevron_left
              </span>
              所有分類
            </button>
          )}
          <div className="mheader__kicker">{tabKicker}</div>
          <h1 className="mheader__title">{tabTitle}</h1>
        </div>
        <div className="mheader__actions">
          <button className="mheader__search-btn" onClick={() => setSection('hub')}>
            <span className="ms" style={{ fontSize: 21 }}>
              home
            </span>
          </button>
          <button className="mheader__search-btn" onClick={() => toggleSearch()}>
            <span className="ms" style={{ fontSize: 21 }}>
              search
            </span>
          </button>
          <button
            className={`mheader__search-btn${selectMode ? ' mheader__search-btn--active' : ''}`}
            onClick={() => toggleSelectMode()}
          >
            <span className="ms" style={{ fontSize: 21 }}>
              checklist
            </span>
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="mheader__search-row">
          <span className="ms" style={{ fontSize: 19, color: 'var(--text-1)' }}>
            search
          </span>
          <input
            value={searchText}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋作品、作者或標籤…"
            className="mheader__search-input"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
