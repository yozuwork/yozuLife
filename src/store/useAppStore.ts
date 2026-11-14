import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PALETTE, SEED_COMICS } from '../lib/constants'
import { splitTags } from '../lib/helpers'
import { mergeImportedPhysicalComics, PHYSICAL_IMPORT_VERSION } from '../lib/physicalLibrary'
import type { Comic, Draft, Group, StatusKey, TabKey } from '../lib/types'

const emptyDraft = (g: Group): Draft => ({
  title: '',
  author: '',
  link: '',
  s: 'none',
  cur: 0,
  total: '',
  g,
  ed: 'tw',
  tags: '',
  c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  coverImage: '',
})

export type Section = 'hub' | 'manga' | 'music' | 'games' | 'anime'
export type CardSize = 'large' | 'medium' | 'small'

interface AppState {
  section: Section
  setSection: (s: Section) => void
  tab: TabKey
  filter: 'all' | StatusKey
  selectedId: number | null
  categoryFilter: string | null
  addingCat: boolean
  catDraft: string
  customCats: string[]
  searchOpen: boolean
  searchText: string
  adding: boolean
  editingId: number | null
  draft: Draft
  comics: Comic[]
  selectMode: boolean
  selectedIds: number[]
  cardSize: CardSize
  physicalImportVersion: number

  setTab: (t: TabKey) => void
  setCategory: (tag: string | null) => void
  toggleAddCat: () => void
  setCatDraft: (v: string) => void
  addCategory: () => void
  setFilter: (f: 'all' | StatusKey) => void
  select: (id: number) => void
  close: () => void
  toggleSearch: () => void
  setSearch: (v: string) => void

  toggleSelectMode: () => void
  setCardSize: (size: CardSize) => void
  toggleSelectItem: (id: number) => void
  selectAllVisible: (ids: number[]) => void
  deleteSelected: () => void
  deleteComic: (id: number) => void

  patch: (id: number, fn: (c: Comic) => Comic) => void
  setCur: (id: number, n: number) => void
  inc: (id: number) => void
  dec: (id: number) => void
  setStatus: (id: number, key: StatusKey) => void
  setField: (id: number, field: keyof Comic, val: unknown) => void
  addTag: (id: number, text: string) => void
  removeTag: (id: number, i: number) => void

  openAdd: () => void
  openEdit: (id: number) => void
  closeAdd: () => void
  setDraft: (field: keyof Draft, val: unknown) => void
  saveDraft: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      section: 'hub',
      setSection: (s) => set({ section: s }),
      tab: 'collection',
      filter: 'all',
      selectedId: null,
      categoryFilter: null,
      addingCat: false,
      catDraft: '',
      customCats: [],
      searchOpen: false,
      searchText: '',
      adding: false,
      editingId: null,
      draft: emptyDraft('collection'),
      comics: mergeImportedPhysicalComics(SEED_COMICS),
      selectMode: false,
      selectedIds: [],
      cardSize: 'medium',
      physicalImportVersion: PHYSICAL_IMPORT_VERSION,

      setTab: (t) =>
        set({ tab: t, filter: 'all', selectedId: null, adding: false, categoryFilter: null, selectMode: false, selectedIds: [] }),
      setCategory: (tag) => set({ categoryFilter: tag, filter: 'all' }),
      toggleAddCat: () => set((s) => ({ addingCat: !s.addingCat, catDraft: '' })),
      setCatDraft: (v) => set({ catDraft: v }),
      addCategory: () => {
        const v = (get().catDraft || '').replace(/^＃|^#/, '').trim()
        if (!v) return
        set((s) => {
          const set_ = new Set(s.customCats)
          set_.add(v)
          return { customCats: [...set_], addingCat: false, catDraft: '' }
        })
      },
      setFilter: (f) => set({ filter: f }),
      select: (id) => set({ selectedId: id }),
      close: () => set({ selectedId: null }),
      toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen, searchText: '' })),
      setSearch: (v) => set({ searchText: v }),

      toggleSelectMode: () => set((s) => ({ selectMode: !s.selectMode, selectedIds: [] })),
      setCardSize: (cardSize) => set({ cardSize }),
      toggleSelectItem: (id) =>
        set((s) => {
          const has = s.selectedIds.includes(id)
          return { selectedIds: has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id] }
        }),
      selectAllVisible: (ids) =>
        set((s) => {
          const allSelected = ids.length > 0 && ids.every((id) => s.selectedIds.includes(id))
          return { selectedIds: allSelected ? [] : ids }
        }),
      deleteSelected: () =>
        set((s) => ({
          comics: s.comics.filter((c) => !s.selectedIds.includes(c.id)),
          selectedIds: [],
          selectMode: false,
        })),
      deleteComic: (id) =>
        set((s) => ({
          comics: s.comics.filter((c) => c.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
          selectedIds: s.selectedIds.filter((x) => x !== id),
        })),

      patch: (id, fn) => set((s) => ({ comics: s.comics.map((c) => (c.id === id ? fn({ ...c }) : c)) })),
      setCur: (id, n) => {
        get().patch(id, (c) => {
          c.ownedText = undefined
          const cap = c.total == null ? Math.max(n, c.cur, 99999) : c.total
          c.cur = Math.max(0, Math.min(n, cap))
          if ((c.s === 'none' || c.s === 'interested') && c.cur > 0) c.s = 'reading'
          if (c.total != null && c.total > 0 && c.cur >= c.total) c.s = 'done'
          else if (c.s === 'done' && (c.total == null || c.cur < c.total)) c.s = 'reading'
          return c
        })
      },
      inc: (id) => {
        const c = get().comics.find((x) => x.id === id)
        if (c) get().setCur(id, c.cur + 1)
      },
      dec: (id) => {
        const c = get().comics.find((x) => x.id === id)
        if (c) get().setCur(id, c.cur - 1)
      },
      setStatus: (id, key) => {
        get().patch(id, (c) => {
          c.s = key
          if (key === 'done' && c.total != null) c.cur = c.total
          if (key === 'none' || key === 'interested') c.cur = 0
          return c
        })
      },
      setField: (id, field, val) => {
        get().patch(id, (c) => {
          ;(c as any)[field] = val
          return c
        })
      },
      addTag: (id, text) => {
        const add = splitTags(text)
        get().patch(id, (c) => {
          const set_ = new Set(c.tags || [])
          add.forEach((t) => set_.add(t))
          c.tags = [...set_]
          return c
        })
      },
      removeTag: (id, i) => {
        get().patch(id, (c) => {
          c.tags = (c.tags || []).filter((_, j) => j !== i)
          return c
        })
      },

      openAdd: () =>
        set((s) => ({ adding: true, editingId: null, selectedId: null, draft: emptyDraft(s.tab === 'category' ? 'collection' : (s.tab as Group)) })),
      openEdit: (id) => {
        const c = get().comics.find((x) => x.id === id)
        if (!c) return
        set({
          adding: true,
          editingId: id,
          selectedId: null,
          draft: {
            title: c.title,
            author: c.author,
            link: c.link,
            s: c.s,
            cur: c.cur,
            total: c.total == null ? '' : c.total,
            g: c.g,
            ed: c.ed || 'tw',
            tags: (c.tags || []).join('、'),
            c: c.c,
            coverImage: c.coverImage || '',
          },
        })
      },
      closeAdd: () => set({ adding: false, editingId: null }),
      setDraft: (field, val) => set((s) => ({ draft: { ...s.draft, [field]: val } })),
      saveDraft: () => {
        const d = get().draft
        if (!d.title.trim()) return
        const total = d.total === '' || d.total == null ? null : Math.max(0, parseInt(String(d.total), 10) || 0) || null
        let cur = Math.max(0, parseInt(String(d.cur), 10) || 0)
        if (total != null) cur = Math.min(cur, total)
        const tags = splitTags(d.tags)
        const rec: Omit<Comic, 'id'> = {
          title: d.title.trim(),
          author: d.author.trim() || '未填作者',
          link: d.link.trim() || '#',
          s: d.s,
          cur,
          total,
          g: d.g,
          ed: d.ed || 'tw',
          c: d.c,
          coverImage: d.coverImage || undefined,
          tags,
        }
        const editingId = get().editingId
        if (editingId) {
          get().patch(editingId, (c) => {
            Object.assign(c, rec)
            c.ownedText = undefined
            return c
          })
          set({ adding: false, editingId: null })
        } else {
          set((s) => {
            const id = Math.max(0, ...s.comics.map((c) => c.id)) + 1
            return { comics: [...s.comics, { id, ...rec }], adding: false, tab: rec.g, filter: 'all' }
          })
        }
      },
    }),
    {
      name: 'manga-collection-storage',
      version: 2,
      partialize: (s) => ({
        comics: s.comics,
        customCats: s.customCats,
        cardSize: s.cardSize,
        physicalImportVersion: s.physicalImportVersion,
      }),
      migrate: (persisted) => {
        const state = persisted as { comics?: Comic[]; physicalImportVersion?: number }
        if (state?.comics) state.comics = state.comics.filter((c) => (c.g as string) !== 'interested')
        if ((state.physicalImportVersion || 0) < PHYSICAL_IMPORT_VERSION) {
          state.comics = mergeImportedPhysicalComics(state.comics || [])
          state.physicalImportVersion = PHYSICAL_IMPORT_VERSION
        }
        return state
      },
    },
  ),
)

if (import.meta.env.DEV) {
  ;(window as any).useAppStore = useAppStore
}
