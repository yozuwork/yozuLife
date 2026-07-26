import { useAppStore } from './store/useAppStore'
import { useMediaQuery } from './hooks/useMediaQuery'
import Rail from './components/Rail'
import DesktopMain from './components/DesktopMain'
import MobileMain from './components/MobileMain'
import DetailPanel from './components/DetailPanel'
import ComicForm from './components/ComicForm'
import Hub from './components/Hub'
import ComingSoon from './components/ComingSoon'
import './App.css'

const SOON_META: Record<string, { label: string; icon: string }> = {
  music: { label: '音樂', icon: 'music_note' },
  games: { label: '遊戲', icon: 'stadia_controller' },
  anime: { label: '追番', icon: 'live_tv' },
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 860px)')
  const section = useAppStore((s) => s.section)
  const selectedId = useAppStore((s) => s.selectedId)
  const adding = useAppStore((s) => s.adding)

  if (section === 'hub') return <Hub />
  if (section !== 'manga') {
    const meta = SOON_META[section]
    return <ComingSoon label={meta.label} icon={meta.icon} />
  }

  return (
    <div className="app">
      {isMobile ? (
        <MobileMain />
      ) : (
        <div className="app__desktop">
          <Rail />
          <DesktopMain />
        </div>
      )}
      {selectedId != null && <DetailPanel isMobile={isMobile} />}
      {adding && <ComicForm isMobile={isMobile} />}
    </div>
  )
}
