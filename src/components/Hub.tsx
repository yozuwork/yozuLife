import { useAppStore } from '../store/useAppStore'
import type { Section } from '../store/useAppStore'
import './Hub.css'

const CARDS: { key: Section; icon: string; label: string; kicker: string; soon: boolean }[] = [
  { key: 'manga', icon: 'auto_stories', label: '漫畫', kicker: 'Manga', soon: false },
  { key: 'music', icon: 'music_note', label: '音樂', kicker: 'Music', soon: true },
  { key: 'games', icon: 'stadia_controller', label: '遊戲', kicker: 'Games', soon: true },
  { key: 'anime', icon: 'live_tv', label: '追番', kicker: 'Anime', soon: true },
]

export default function Hub() {
  const comics = useAppStore((s) => s.comics)
  const setSection = useAppStore((s) => s.setSection)

  return (
    <div className="hub">
      <div className="hub__head">
        <div className="hub__kicker">My Collections</div>
        <h1 className="hub__title">我的收藏總覽</h1>
      </div>
      <div className="hub__grid">
        {CARDS.map((card) => (
          <div key={card.key} className="hub__card" onClick={() => setSection(card.key)}>
            {card.soon && <div className="hub__badge">即將推出</div>}
            <div className="hub__icon">
              <span className="ms" style={{ fontSize: 28 }}>
                {card.icon}
              </span>
            </div>
            <div className="hub__cardKicker">{card.kicker}</div>
            <div className="hub__cardLabel">{card.label}</div>
            {card.key === 'manga' && <div className="hub__cardMeta">共 {comics.length} 部作品</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
