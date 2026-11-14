import type { Comic, Edition, Group, StatusKey } from './types'

export const STATUS: Record<StatusKey, { label: string; color: string }> = {
  reading: { label: '進行中', color: '#3a7bd5' },
  waiting: { label: '等連載', color: '#d9541f' },
  done: { label: '已追完', color: '#4a9d6b' },
  paused: { label: '暫停中', color: '#9a8f7d' },
  dropped: { label: '已棄坑', color: '#b23b3b' },
  none: { label: '尚未開始', color: '#b8ad9a' },
  interested: { label: '有興趣', color: '#c2588a' },
}

export const ORDER: StatusKey[] = ['reading', 'waiting', 'done', 'paused', 'dropped', 'none', 'interested']

export const ED: Record<Edition, string> = { tw: '台版', jp: '日版' }

export const SHELF: Record<Group, string> = {
  collection: '書櫃',
  physical: '實體書',
}

export const SHELF_TITLE: Record<Group, string> = {
  collection: '我的收藏',
  physical: '我的實體書',
}

export const SHELF_KICKER: Record<Group, string> = {
  collection: 'My Library',
  physical: 'Physical Shelf',
}

export const PALETTE = [
  '#2f5d5b',
  '#b8752a',
  '#4a5568',
  '#6b4a63',
  '#66632f',
  '#3f5f7a',
  '#a85433',
  '#33574a',
  '#2f3e5c',
  '#5c4a52',
]

export const SEED_COMICS: Comic[] = [
  { id: 1, g: 'collection', title: '墨海航跡', author: '佐藤 遙', s: 'reading', cur: 82, total: 137, c: '#2f5d5b', tags: ['海洋', '冒險', '長篇'], link: '#' },
  { id: 2, g: 'collection', title: '街角的貓與雨', author: '林 晚', s: 'done', cur: 45, total: 45, c: '#b8752a', tags: ['日常', '療癒'], link: '#' },
  { id: 3, g: 'collection', title: '鋼鐵祭典', author: 'R. Vega', s: 'none', cur: 0, total: 24, c: '#4a5568', tags: ['機甲', '熱血'], link: '#' },
  { id: 4, g: 'collection', title: '花與刃', author: '千夜', s: 'waiting', cur: 210, total: null, c: '#6b4a63', tags: ['武俠', '連載中'], link: '#' },
  { id: 5, g: 'collection', title: '深夜食記', author: '大川 悟', s: 'reading', cur: 12, total: 40, c: '#66632f', tags: ['美食', '群像'], link: '#' },
  { id: 6, g: 'collection', title: '星屑通信', author: 'Nao', s: 'paused', cur: 9, total: 60, c: '#3f5f7a', tags: ['科幻', '戀愛'], link: '#' },
  { id: 7, g: 'collection', title: '廢墟裡的光', author: '高橋 蓮', s: 'dropped', cur: 15, total: 88, c: '#a85433', tags: ['末日'], link: '#' },
  { id: 8, g: 'collection', title: '十號房的秘密', author: '周 頎', s: 'reading', cur: 28, total: 33, c: '#33574a', tags: ['懸疑', '校園'], link: '#' },
  { id: 9, g: 'collection', title: '風之谷道', author: '伊藤 巧', s: 'done', cur: 30, total: 30, c: '#a86a48', tags: ['旅行', '散文'], link: '#' },
  { id: 10, g: 'collection', title: '白鯨紀', author: 'M. Cole', s: 'waiting', cur: 66, total: null, c: '#2f3e5c', tags: ['奇幻', '連載中'], link: '#' },
]
