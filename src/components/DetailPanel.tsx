import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ED, ORDER, STATUS } from '../lib/constants'
import { computeBar, cover, progText, unitOf } from '../lib/helpers'
import { compressCover } from '../lib/coverTools'
import TagEditor from './TagEditor'
import type { Edition } from '../lib/types'
import './DetailPanel.css'

export default function DetailPanel({ isMobile }: { isMobile: boolean }) {
  const selectedId = useAppStore((s) => s.selectedId)
  const comics = useAppStore((s) => s.comics)
  const close = useAppStore((s) => s.close)
  const deleteComic = useAppStore((s) => s.deleteComic)
  const inc = useAppStore((s) => s.inc)
  const dec = useAppStore((s) => s.dec)
  const setCur = useAppStore((s) => s.setCur)
  const setStatus = useAppStore((s) => s.setStatus)
  const setField = useAppStore((s) => s.setField)
  const addTag = useAppStore((s) => s.addTag)
  const removeTag = useAppStore((s) => s.removeTag)
  const [coverUploading, setCoverUploading] = useState(false)

  const cm = comics.find((c) => c.id === selectedId)
  if (!cm) return null

  const bar = computeBar(cm)
  const gridLimit = isMobile ? 48 : 60
  const hasGrid = cm.total != null && cm.total > 0 && cm.total <= gridLimit
  const hasLink = !!cm.link && cm.link !== '#'

  const remove = () => {
    if (window.confirm(`確定要刪除「${cm.title}」嗎？此動作無法復原。`)) {
      deleteComic(cm.id)
    }
  }

  const handleCoverUpload = async (file?: File) => {
    if (!file) return
    setCoverUploading(true)
    try {
      setField(cm.id, 'coverImage', await compressCover(file))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '圖片處理失敗')
    } finally {
      setCoverUploading(false)
    }
  }

  return (
    <div className="detail__overlay" onClick={() => close()}>
      <div className={`detail__panel${isMobile ? ' detail__panel--sheet' : ' detail__panel--drawer'}`} onClick={(e) => e.stopPropagation()}>
        <div className="detail__body">
          {isMobile ? (
            <div className="detail__mobiletop">
              <button className="detail__mobileclose" onClick={() => close()}>
                <span className="ms" style={{ fontSize: 19 }}>
                  chevron_left
                </span>
                書櫃
              </button>
              <button className="detail__deletebtn" onClick={remove}>
                <span className="ms" style={{ fontSize: 19 }}>
                  delete
                </span>
              </button>
            </div>
          ) : (
            <div className="detail__closerow">
              <button className="detail__deletebtn" onClick={remove}>
                <span className="ms" style={{ fontSize: 20 }}>
                  delete
                </span>
              </button>
              <button className="detail__closebtn" onClick={() => close()}>
                <span className="ms" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
          )}

          <div className="detail__top">
            <label className="detail__cover" style={{ background: cover(cm.c, cm.coverImage) }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="detail__coverFile"
                onChange={(e) => handleCoverUpload(e.target.files?.[0])}
              />
              <span className={`detail__coverHint${isMobile ? ' detail__coverHint--visible' : ''}`}>
                {coverUploading ? '壓縮中…' : '更換封面'}
              </span>
            </label>
            <div className="detail__fields">
              <input
                value={cm.title}
                onChange={(e) => setField(cm.id, 'title', e.target.value)}
                placeholder="作品標題"
                className="detail__titleInput"
              />
              <input
                value={cm.author}
                onChange={(e) => setField(cm.id, 'author', e.target.value)}
                placeholder="作者"
                className="detail__authorInput"
              />
              <div className="detail__linkRow">
                <span className="ms" style={{ fontSize: 18, color: 'var(--brand)', flex: 'none' }}>
                  link
                </span>
                <input
                  value={hasLink ? cm.link : ''}
                  onChange={(e) => setField(cm.id, 'link', e.target.value)}
                  placeholder="貼上作品官方連結…"
                  className="detail__linkInput"
                />
                {hasLink && (
                  <a href={cm.link} target="_blank" rel="noreferrer" className="detail__linkOpen" title="開啟連結">
                    <span className="ms" style={{ fontSize: 18 }}>
                      open_in_new
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {cm.g === 'physical' && (
            <>
              <div className="detail__label">版本</div>
              <div className="detail__chiprow">
                {(['tw', 'jp'] as Edition[]).map((key) => (
                  <button
                    key={key}
                    className={`detail__chip${(cm.ed || 'tw') === key ? ' detail__chip--dark' : ''}`}
                    onClick={() => setField(cm.id, 'ed', key)}
                  >
                    {ED[key]}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="detail__label">追蹤狀態</div>
          <div className="detail__chiprow">
            {ORDER.map((k) => {
              const active = k === cm.s
              const meta = STATUS[k]
              return (
                <button
                  key={k}
                  className="detail__chip"
                  style={
                    active
                      ? { background: meta.color, color: '#fff', border: `1.5px solid ${meta.color}` }
                      : { background: '#fff', color: 'var(--text-2)', border: '1.5px solid var(--border-2)' }
                  }
                  onClick={() => setStatus(cm.id, k)}
                >
                  {!active && <span className="detail__dot" style={{ background: meta.color }} />}
                  {meta.label}
                </button>
              )
            })}
          </div>

          <div className="detail__progressCard">
            <div className="detail__progressHead">
              <div className="detail__progressLabel">閱讀進度 · 勾格與計數連動</div>
              <div className="detail__progressText">{progText(cm)}</div>
            </div>
            <div className="detail__progressRow">
              <button className="detail__stepBtn detail__stepBtn--minus" onClick={() => dec(cm.id)}>
                <span className="ms">remove</span>
              </button>
              <div className="detail__count">
                <input
                  type="number"
                  min={0}
                  max={cm.total ?? undefined}
                  value={cm.cur}
                  onChange={(e) => setCur(cm.id, parseInt(e.target.value, 10) || 0)}
                  className="detail__countNum"
                />
                <div className="detail__countTotal">
                  / {cm.total == null ? '—' : cm.total} {unitOf(cm)}
                </div>
              </div>
              <button className="detail__stepBtn detail__stepBtn--plus" onClick={() => inc(cm.id)}>
                <span className="ms">add</span>
              </button>
              <div className="detail__track">
                <div className="detail__bar" style={{ width: bar.width, background: bar.color }} />
              </div>
            </div>
            {hasGrid && cm.total != null && (
              <>
                <div className="detail__gridHint">點格子或按 ＋／－，兩邊即時同步：</div>
                <div className={`detail__chgrid${isMobile ? ' detail__chgrid--8' : ' detail__chgrid--10'}`}>
                  {Array.from({ length: cm.total }, (_, i) => {
                    const n = i + 1
                    const done = n <= cm.cur
                    return (
                      <button
                        key={n}
                        className={`detail__chbtn${done ? ' detail__chbtn--done' : ''}`}
                        onClick={() => setCur(cm.id, done && n === cm.cur ? n - 1 : n)}
                      >
                        {done ? `✓${n}` : n}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="detail__section">
            <div className="detail__label">標籤</div>
            <TagEditor
              tags={cm.tags || []}
              onAdd={(text) => addTag(cm.id, text)}
              onRemove={(i) => removeTag(cm.id, i)}
            />
          </div>

          <div className="detail__section">
            <div className="detail__label">我的筆記</div>
            <textarea
              value={cm.note || ''}
              onChange={(e) => setField(cm.id, 'note', e.target.value)}
              placeholder="記點什麼吧…（劇情進度、想追的原因）"
              className="detail__note"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
