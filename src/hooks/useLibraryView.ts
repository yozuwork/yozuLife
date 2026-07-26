import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ORDER, SHELF_KICKER, SHELF_TITLE, STATUS } from '../lib/constants'
import { cover } from '../lib/helpers'
import type { Comic, Group, StatusKey } from '../lib/types'

export interface FilterChip {
  key: 'all' | StatusKey
  label: string
  color: string | null
  count: number
  active: boolean
}

export interface CategoryTile {
  tag: string
  count: number
  covers: string[]
}

export function useLibraryView() {
  const tab = useAppStore((s) => s.tab)
  const filter = useAppStore((s) => s.filter)
  const categoryFilter = useAppStore((s) => s.categoryFilter)
  const customCats = useAppStore((s) => s.customCats)
  const comics = useAppStore((s) => s.comics)
  const searchOpen = useAppStore((s) => s.searchOpen)
  const searchText = useAppStore((s) => s.searchText)

  return useMemo(() => {
    const base: Comic[] =
      tab === 'category'
        ? categoryFilter
          ? comics.filter((c) => (c.tags || []).includes(categoryFilter))
          : []
        : comics.filter((c) => c.g === tab)

    const counts: Record<string, number> = { all: base.length }
    ORDER.forEach((k) => {
      counts[k] = base.filter((c) => c.s === k).length
    })

    const catMap: Record<string, Comic[]> = {}
    comics.forEach((c) => (c.tags || []).forEach((t) => {
      ;(catMap[t] = catMap[t] || []).push(c)
    }))
    ;(customCats || []).forEach((t) => {
      if (!catMap[t]) catMap[t] = []
    })
    const catTiles: CategoryTile[] = Object.keys(catMap)
      .sort((a, b) => catMap[b].length - catMap[a].length)
      .map((tag) => ({ tag, count: catMap[tag].length, covers: catMap[tag].slice(0, 3).map((c) => cover(c.c, c.coverImage)) }))

    const showCatTiles = tab === 'category' && !categoryFilter

    const filters: FilterChip[] = ([{ key: 'all' as const, label: '全部', color: null }] as FilterChip[])
      .concat(
        ORDER.map((k) => ({ key: k, label: STATUS[k].label, color: STATUS[k].color, count: 0, active: false })),
      )
      .map((f) => ({
        ...f,
        count: f.key === 'all' ? counts.all : counts[f.key] || 0,
        active: f.key === filter,
      }))

    let shown = filter === 'all' ? base : base.filter((c) => c.s === filter)
    const q = (searchText || '').trim().toLowerCase()
    if (q) {
      shown = shown.filter((c) => (c.title + c.author + (c.tags || []).join('')).toLowerCase().includes(q))
    }

    const showBack = tab === 'category' && !!categoryFilter
    const tabTitle =
      tab === 'category' ? (categoryFilter ? `＃${categoryFilter}` : '分類') : SHELF_TITLE[tab as Group]
    const tabKicker = tab === 'category' ? 'Categories' : SHELF_KICKER[tab as Group]
    const countText = showCatTiles
      ? `共 ${catTiles.length} 個分類`
      : `共 ${base.length}${tab === 'physical' ? ' 部實體書' : ' 部作品'}`

    return {
      tab,
      cards: shown,
      filters,
      catTiles,
      showCatTiles,
      showGrid: !showCatTiles,
      showBack,
      tabTitle,
      tabKicker,
      countText,
      searchOpen,
    }
  }, [tab, filter, categoryFilter, customCats, comics, searchOpen, searchText])
}
