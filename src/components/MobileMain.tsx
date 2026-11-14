import { useAppStore } from '../store/useAppStore'
import { useLibraryView } from '../hooks/useLibraryView'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import FilterChips from './FilterChips'
import ComicGrid from './ComicGrid'
import CategoryTiles from './CategoryTiles'
import SelectionBar from './SelectionBar'
import ViewSizeToggle from './ViewSizeToggle'
import './MobileMain.css'

export default function MobileMain() {
  const view = useLibraryView()
  const selectMode = useAppStore((s) => s.selectMode)
  const addingCat = useAppStore((s) => s.addingCat)
  const catDraft = useAppStore((s) => s.catDraft)
  const toggleAddCat = useAppStore((s) => s.toggleAddCat)
  const setCatDraft = useAppStore((s) => s.setCatDraft)
  const addCategory = useAppStore((s) => s.addCategory)

  return (
    <div className="mmain">
      <MobileHeader />
      {view.showGrid && <FilterChips filters={view.filters} />}
      <div className="mmain__scroll appscroll">
        {view.showGrid && <ViewSizeToggle compact />}
        {view.showGrid && selectMode && <SelectionBar ids={view.cards.map((c) => c.id)} />}
        {view.showCatTiles && (
          <div className="mmain__catrow">
            {addingCat ? (
              <>
                <input
                  value={catDraft}
                  onChange={(e) => setCatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCategory()
                    }
                  }}
                  placeholder="分類名稱…"
                  className="mmain__catinput"
                  autoFocus
                />
                <button className="mmain__catsave" onClick={() => addCategory()}>
                  新增
                </button>
              </>
            ) : (
              <button className="mmain__cattoggle" onClick={() => toggleAddCat()}>
                <span className="ms" style={{ fontSize: 19 }}>
                  add
                </span>
                新增分類
              </button>
            )}
          </div>
        )}
        {view.showCatTiles && <CategoryTiles tiles={view.catTiles} />}
        {view.showGrid && <ComicGrid cards={view.cards} showShelf={view.tab === 'category'} />}
      </div>
      <BottomNav />
    </div>
  )
}
