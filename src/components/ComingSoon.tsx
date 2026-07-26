import { useAppStore } from '../store/useAppStore'
import './ComingSoon.css'

export default function ComingSoon({ label, icon }: { label: string; icon: string }) {
  const setSection = useAppStore((s) => s.setSection)

  return (
    <div className="soon">
      <div className="soon__card">
        <div className="soon__icon">
          <span className="ms" style={{ fontSize: 30 }}>
            {icon}
          </span>
        </div>
        <div className="soon__badge">即將推出</div>
        <h1 className="soon__title">{label}</h1>
        <p className="soon__desc">這裡以後會用來追蹤你的{label}收藏。</p>
        <button className="soon__back" onClick={() => setSection('hub')}>
          <span className="ms" style={{ fontSize: 18 }}>
            chevron_left
          </span>
          返回總覽
        </button>
      </div>
    </div>
  )
}
