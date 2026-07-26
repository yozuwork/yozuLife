import { useAppStore } from '../store/useAppStore'
import './SelectionBar.css'

export default function SelectionBar({ ids }: { ids: number[] }) {
  const selectedIds = useAppStore((s) => s.selectedIds)
  const selectAllVisible = useAppStore((s) => s.selectAllVisible)
  const deleteSelected = useAppStore((s) => s.deleteSelected)
  const toggleSelectMode = useAppStore((s) => s.toggleSelectMode)

  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))

  return (
    <div className="selbar">
      <div className="selbar__count">已選 {selectedIds.length} 筆</div>
      <div className="selbar__actions">
        <button className="selbar__btn" onClick={() => selectAllVisible(ids)}>
          {allSelected ? '取消全選' : '全選'}
        </button>
        <button
          className="selbar__btn selbar__btn--danger"
          disabled={selectedIds.length === 0}
          onClick={() => {
            if (window.confirm(`確定要刪除已選的 ${selectedIds.length} 部作品嗎？此動作無法復原。`)) {
              deleteSelected()
            }
          }}
        >
          刪除
        </button>
        <button className="selbar__btn" onClick={() => toggleSelectMode()}>
          取消
        </button>
      </div>
    </div>
  )
}
