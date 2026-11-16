// Convierte cualquier emoji en un sprite pixel-art: se dibuja chiquito en un canvas
// y se agranda con image-rendering: pixelated. Así todo el catálogo comparte estética.
const cache = new Map<string, string>()

const render = (emoji: string, res: number) => {
  const key = `${emoji}@${res}`
  const hit = cache.get(key)
  if (hit) return hit
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = res
  canvas.height = res
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(res * .82)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.fillText(emoji, res / 2, res / 2 + res * .06)
  // posterizado suave para que los colores se vean "de 16 bits"
  const img = ctx.getImageData(0, 0, res, res)
  for (let i = 0; i < img.data.length; i += 4) {
    for (let k = 0; k < 3; k++) img.data[i + k] = Math.round(img.data[i + k] / 32) * 32
    img.data[i + 3] = img.data[i + 3] > 110 ? 255 : 0
  }
  ctx.putImageData(img, 0, 0)
  const url = canvas.toDataURL()
  cache.set(key, url)
  return url
}

export function PixelIcon({ emoji, size = 32, res = 20, className = '', title }: { emoji: string; size?: number; res?: number; className?: string; title?: string }) {
  const src = render(emoji, res)
  return <img className={`pixel-icon ${className}`} src={src} width={size} height={size} alt={title ?? ''} title={title} draggable={false} />
}
