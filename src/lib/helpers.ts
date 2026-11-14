import { STATUS } from './constants'
import type { Comic } from './types'

export function cover(hex: string, image?: string): string {
  if (image) {
    const safeImage = image.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `linear-gradient(155deg, rgba(255,255,255,.05), rgba(0,0,0,.12)), url("${safeImage}") center / cover no-repeat`
  }
  return `linear-gradient(155deg, rgba(255,255,255,.14), rgba(0,0,0,.32)), ${hex}`
}

export function computeBar(cm: Comic): { width: string; color: string } {
  const meta = STATUS[cm.s]
  let width = '0%'
  if (cm.s === 'done') width = '100%'
  else if (cm.s === 'none' || cm.s === 'interested') width = '0%'
  else if (cm.total == null) width = '100%'
  else width = `${Math.max(0, Math.min(100, Math.round((cm.cur / cm.total) * 100)))}%`
  return { width, color: meta.color }
}

export function unitOf(cm: Comic): string {
  return cm.g === 'physical' ? '集' : '話'
}

export function progText(cm: Comic): string {
  const u = unitOf(cm)
  if (cm.g === 'physical') {
    if (cm.ownedText) return cm.ownedText
    if (cm.s === 'done' || (cm.total != null && cm.total > 0 && cm.cur >= cm.total))
      return `全 ${cm.total || cm.cur} ${u} · 已收齊`
    if (cm.total == null) return `已收 ${cm.cur} ${u}`
    return `已收 ${cm.cur} / ${cm.total} ${u}`
  }
  if (cm.s === 'none') return '尚未開始'
  if (cm.s === 'interested') return '有興趣'
  if (cm.s === 'done') return `全 ${cm.total || cm.cur} ${u} · 已追完`
  if (cm.total == null) return `第 ${cm.cur} ${u} · 連載中`
  return `第 ${cm.cur} / ${cm.total} ${u}`
}

export function splitTags(text: string): string[] {
  return (text || '')
    .split(/[,，、\s]+/)
    .map((t) => t.replace(/^＃|^#/, '').trim())
    .filter(Boolean)
}
