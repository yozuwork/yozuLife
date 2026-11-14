import { useAppStore, type CardSize } from '../store/useAppStore'
import './ViewSizeToggle.css'

const OPTIONS: { value: CardSize; label: string; icon: string }[] = [
  { value: 'large', label: '大', icon: 'crop_square' },
  { value: 'medium', label: '中', icon: 'grid_view' },
  { value: 'small', label: '小', icon: 'apps' },
]

export default function ViewSizeToggle({ compact = false }: { compact?: boolean }) {
  const cardSize = useAppStore((s) => s.cardSize)
  const setCardSize = useAppStore((s) => s.setCardSize)

  return (
    <div className={`vsize${compact ? ' vsize--compact' : ''}`} role="group" aria-label="卡片檢視大小">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`vsize__button${cardSize === option.value ? ' vsize__button--active' : ''}`}
          aria-pressed={cardSize === option.value}
          title={`${option.label}卡片檢視`}
          onClick={() => setCardSize(option.value)}
        >
          <span className="ms vsize__icon">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
