import { useAppStore } from '../store/useAppStore'
import { ED, SHELF, STATUS } from '../lib/constants'
import { computeBar, cover, progText } from '../lib/helpers'
import type { Comic } from '../lib/types'
import './ComicCard.css'

export default function ComicCard({ comic, showShelf }: { comic: Comic; showShelf: boolean }) {
  const select = useAppStore((s) => s.select)
  const selectMode = useAppStore((s) => s.selectMode)
  const selected = useAppStore((s) => s.selectedIds.includes(comic.id))
  const toggleSelectItem = useAppStore((s) => s.toggleSelectItem)
  const bar = computeBar(comic)
  const statusMeta = STATUS[comic.s]
  const hasLink = !!comic.link && comic.link !== '#'

  return (
    <div
      className={`ccard${selectMode ? ' ccard--selectable' : ''}${selected ? ' ccard--selected' : ''}`}
      onClick={() => (selectMode ? toggleSelectItem(comic.id) : select(comic.id))}
    >
      {selectMode && (
        <div className={`ccard__check${selected ? ' ccard__check--on' : ''}`}>
          {selected && (
            <span className="ms" style={{ fontSize: 15 }}>
              check
            </span>
          )}
        </div>
      )}
      <div className="ccard__cover" style={{ background: cover(comic.c, comic.coverImage) }}>
        <div className="ccard__badge">
          <span className="ccard__badge-dot" style={{ background: statusMeta.color }} />
          {statusMeta.label}
        </div>
        {comic.g === 'physical' && <div className="ccard__edition">{ED[comic.ed || 'tw']}</div>}
      </div>
      <div className="ccard__foot">
        <div className="ccard__title">{comic.title}</div>
        <div className="ccard__author">{comic.author}</div>
        {showShelf && <div className="ccard__shelf">{SHELF[comic.g]}</div>}
        <div className="ccard__track">
          <div className="ccard__bar" style={{ width: bar.width, background: bar.color }} />
        </div>
        <div className="ccard__progress">{progText(comic)}</div>
        {hasLink && (
          <a
            href={comic.link}
            target="_blank"
            rel="noreferrer"
            className="ccard__read"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="ms" style={{ fontSize: 15 }}>
              menu_book
            </span>
            直接閱讀
          </a>
        )}
      </div>
    </div>
  )
}
