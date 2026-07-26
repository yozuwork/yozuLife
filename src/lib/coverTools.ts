interface MicrolinkResponse {
  status: string
  data?: {
    title?: string
    image?: { url?: string } | string
  }
}

export async function fetchLinkMetadata(url: string): Promise<{ title: string; image: string }> {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('請輸入有效的 http(s) 網址')

  const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(parsed.href)}`
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error('無法讀取這個網站')

  const result = (await response.json()) as MicrolinkResponse
  if (result.status !== 'success' || !result.data) throw new Error('找不到作品資料')
  const image = typeof result.data.image === 'string' ? result.data.image : result.data.image?.url
  return { title: result.data.title?.trim() || '', image: image || '' }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('無法讀取圖片'))
    }
    image.src = objectUrl
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/webp', quality)
}

export async function compressCover(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('請選擇圖片檔案')
  if (file.size > 15 * 1024 * 1024) throw new Error('原始圖片不可超過 15 MB')

  const image = await loadImage(file)
  const maxWidth = 480
  const maxHeight = 720
  const ratio = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('瀏覽器不支援圖片壓縮')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = 0.82
  let result = canvasToDataUrl(canvas, quality)
  while (result.length > 180_000 && quality > 0.42) {
    quality -= 0.1
    result = canvasToDataUrl(canvas, quality)
  }
  return result
}
