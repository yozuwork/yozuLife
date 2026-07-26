import { useAppStore } from '../store/useAppStore'
import { useLibraryView } from '../hooks/useLibraryView'
import DesktopHeader from './DesktopHeader'
import FilterChips from './FilterChips'
import ComicGrid from './ComicGrid'
import CategoryTiles from './CategoryTiles'
import SelectionBar from './SelectionBar'
import './DesktopMain.css'

export default function DesktopMain() {
  const view = useLibraryView()
  const selectMode = useAppStore((s) => s.selectMode)
  const addingCat = useAppStore((s) => s.addingCat)
  const catDraft = useAppStore((s) => s.catDraft)
  const toggleAddCat = useAppStore((s) => s.toggleAddCat)
  const setCatDraft = useAppStore((s) => s.setCatDraft)
  const addCategory = useAppStore((s) => s.addCategory)
  const setCategory = useAppStore((s) => s.setCategory)

  return (
    <main className="dmain">
      <DesktopHeader />
      <div className="dmain__scroll">
        <div className="dmain__titlerow">
          <div>
            {view.showBack && (
              <button className="dmain__backbtn" onClick={() => setCategory(null)}>
                <span className="ms" style={{ fontSize: 17 }}>
                  chevron_left
                </span>
                所有分類
              </button>
            )}
            <div className="dmain__kicker">{view.tabKicker}</div>
            <h1 className="dmain__title">{view.tabTitle}</h1>
          </div>

          {view.showCatTiles && (
            <div className="dmain__catadd">
              {addingCat && (
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
                    className="dmain__catinput"
                    autoFocus
                  />
                  <button className="dmain__catsave" onClick={() => addCategory()}>
                    新增
                  </button>
                </>
              )}
              <button className="dmain__cattoggle" onClick={() => toggleAddCat()}>
                <span className="ms" style={{ fontSize: 18 }}>
                  add
                </span>
                新增分類
              </button>
            </div>
          )}

          <div className="dmain__count">{view.countText}</div>
        </div>

        {view.showGrid && selectMode && <SelectionBar ids={view.cards.map((c) => c.id)} />}
        {view.showGrid && <FilterChips filters={view.filters} />}
        {view.showCatTiles && <CategoryTiles tiles={view.catTiles} />}
        {view.showGrid && <ComicGrid cards={view.cards} showShelf={view.tab === 'category'} />}
      </div>
    </main>
  )
}
