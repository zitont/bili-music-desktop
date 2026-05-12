export interface ExtractedColors {
  dominant: string;
  muted: string;
  dark: string;
  top: string;
  center: string;
  bottom: string;
  accent: string;
  isDark: boolean;
}

function hexStr(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isLight(r: number, g: number, b: number): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function saturation(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

interface Bucket {
  r: number
  g: number
  b: number
  count: number
}

function dominantFromData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  regionW: number,
  regionH: number
): string {
  const buckets: Record<string, Bucket> = {}

  for (let y = offsetY; y < offsetY + regionH; y++) {
    for (let x = offsetX; x < offsetX + regionW; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a < 128) continue
      const key = `${r >> 4},${g >> 4},${b >> 4}`
      if (buckets[key]) {
        buckets[key].r += r
        buckets[key].g += g
        buckets[key].b += b
        buckets[key].count++
      } else {
        buckets[key] = { r, g, b, count: 1 }
      }
    }
  }

  let bestR = 40
  let bestG = 40
  let bestB = 50
  let bestScore = -1

  for (const key in buckets) {
    const b = buckets[key]
    const avgR = b.r / b.count
    const avgG = b.g / b.count
    const avgB = b.b / b.count
    const sat = saturation(avgR, avgG, avgB)
    const lum = luminance(avgR, avgG, avgB)

    const isWash = avgR > 230 && avgG > 230 && avgB > 230
    const isPitch = lum < 25
    const isFlat = sat < 20

    const penalty = isWash || isPitch || isFlat ? 0.15 : 1
    const colorfulness = Math.min(1, sat / 180)
    const score = b.count * (0.2 + colorfulness * 0.6 + (lum > 30 && lum < 220 ? 0.2 : 0)) * penalty

    if (score > bestScore) {
      bestScore = score
      bestR = clamp(avgR)
      bestG = clamp(avgG)
      bestB = clamp(avgB)
    }
  }

  return hexStr(bestR, bestG, bestB)
}

function sampleImage(img: HTMLImageElement): ExtractedColors {
  const size = 120
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, size, size)

  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data

  const h3 = Math.floor(size / 3)
  const top = dominantFromData(data, size, size, 0, 0, size, h3)
  const center = dominantFromData(data, size, size, 0, h3, size, h3)
  const bottom = dominantFromData(data, size, size, 0, h3 * 2, size, size - h3 * 2)

  const accentCandidates = [
    { color: top, sat: saturation(...hexToRgb(top)) },
    { color: center, sat: saturation(...hexToRgb(center)) },
    { color: bottom, sat: saturation(...hexToRgb(bottom)) },
  ]
  accentCandidates.sort((a, b) => b.sat - a.sat)
  const accent = accentCandidates[0].color

  const domRgb = hexToRgb(accent)
  const dominant = accent
  const isDomDark = !isLight(domRgb[0], domRgb[1], domRgb[2])
  const shift = isDomDark ? 40 : -40
  const muted = hexStr(
    clamp(domRgb[0] + shift),
    clamp(domRgb[1] + (isDomDark ? 30 : -30)),
    clamp(domRgb[2] + (isDomDark ? 25 : -25))
  )
  const dark = hexStr(
    clamp(domRgb[0] * 0.08),
    clamp(domRgb[1] * 0.08),
    clamp(domRgb[2] * 0.08)
  )

  return { dominant, muted, dark, top, center, bottom, accent, isDark: isDomDark }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [0, 0, 0]
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

export function extractColorsFromImage(img: HTMLImageElement): ExtractedColors {
  return sampleImage(img)
}

function extractColors(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => resolve(sampleImage(img))
    img.onerror = () => reject(new Error('Failed to load image: ' + imageUrl))
  })
}

export default extractColors