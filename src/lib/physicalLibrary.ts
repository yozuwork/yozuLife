import physicalLibraryCsv from '../../doc/無標題 2c4cbef6488581fd85c4d94057f42728_漫畫收藏庫 2c4cbef6488581d7955a000b9ee72b57_all.csv?raw'
import { PALETTE } from './constants'
import type { Comic } from './types'

export const PHYSICAL_IMPORT_VERSION = 1

type CsvRow = Record<string, string>

function parseCsv(source: string): CsvRow[] {
  const table: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1
      row.push(field)
      if (row.some((value) => value.trim())) table.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field)
  if (row.some((value) => value.trim())) table.push(row)
  const [headers = [], ...rows] = table
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || '').trim()])))
}

function cleanTitle(title: string): string {
  const value = title.trim()
  if (value.startsWith('https://zh.wikipedia.org/') && decodeURIComponent(value).includes('共譜泡沫戀曲')) return '共譜泡沫戀曲'
  if (value === '妳我獨處的保健室') return '你我獨處的保健室'
  return value
}

function preferredOwnedText(title: string, values: string[]): string {
  if (title === '我推的孩子') return '台版共十四卷'
  if (title === '轉生公主與天才千金的魔法革命') return '台版小說6卷、漫畫6卷'
  return values.sort((a, b) => b.length - a.length)[0] || ''
}

function approximateCount(text: string): number {
  const range = text.match(/(\d+)\s*[-–~至]\s*(\d+)/)
  if (range) return Math.max(0, Number(range[2]) - Number(range[1]) + 1)

  const chineseNumbers: Record<string, number> = {
    一: 1,
    兩: 2,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
  }
  const arabic = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]))
  const chinese = Object.entries(chineseNumbers)
    .sort(([a], [b]) => b.length - a.length)
    .find(([key]) => text.includes(key))?.[1]
  return Math.max(0, ...arabic, chinese || 0)
}

function colorFor(title: string): string {
  const hash = [...title].reduce((sum, char) => sum + (char.codePointAt(0) || 0), 0)
  return PALETTE[hash % PALETTE.length]
}

function buildImportedComics(): Comic[] {
  const grouped = new Map<string, CsvRow[]>()
  for (const row of parseCsv(physicalLibraryCsv)) {
    const title = cleanTitle(row.Name || '')
    if (!title || title.toLowerCase() === 'add 作品菜單') continue
    grouped.set(title, [...(grouped.get(title) || []), row])
  }

  return [...grouped.entries()].map(([title, rows], index) => {
    const ownedText = preferredOwnedText(
      title,
      rows.map((row) => (row.擁有卷數 || '').replace(/\r?\n/g, '／').trim()).filter(Boolean),
    )
    const original = rows.map((row) => row.原名 || '').find((value) => value && !value.startsWith('http')) || ''
    const misplacedUrl = rows.map((row) => row.原名 || '').find((value) => value.startsWith('http')) || ''
    const link = rows.map((row) => row.URL || '').find(Boolean) || misplacedUrl || '#'
    const updated = rows.map((row) => row.更新時間 || '').find(Boolean) || ''
    const notes = [ownedText && `原收藏紀錄：${ownedText}`, original && `原名：${original}`, updated && `更新時間：${updated}`].filter(Boolean)

    return {
      id: 10000 + index,
      g: 'physical',
      title,
      author: '未填作者',
      s: 'none',
      cur: approximateCount(ownedText),
      total: null,
      c: colorFor(title),
      ed: ownedText.includes('日版') && !ownedText.includes('台版') ? 'jp' : 'tw',
      tags: ['CSV 匯入', ...(ownedText.includes('小說') ? ['小說'] : []), ...(ownedText.includes('日版') ? ['日版收藏'] : [])],
      link,
      note: notes.join('\n'),
      ownedText: ownedText || '卷數未記錄',
    }
  })
}

export const IMPORTED_PHYSICAL_COMICS = buildImportedComics()

export function mergeImportedPhysicalComics(existing: Comic[]): Comic[] {
  const titles = new Set(existing.filter((comic) => comic.g === 'physical').map((comic) => cleanTitle(comic.title)))
  let nextId = Math.max(0, ...existing.map((comic) => comic.id)) + 1
  const additions = IMPORTED_PHYSICAL_COMICS.filter((comic) => !titles.has(cleanTitle(comic.title))).map((comic) => ({
    ...comic,
    id: nextId++,
  }))
  return [...existing, ...additions]
}
