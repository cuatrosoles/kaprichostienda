function absoluteAsset(src: string, origin: string) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

async function loadBitmap(src: string) {
  const response = await fetch(src)
  if (!response.ok) throw new Error('image')
  const blob = await response.blob()
  return createImageBitmap(blob)
}

function downloadFile(file: File) {
  const href = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = href
  link.download = file.name
  link.click()
  URL.revokeObjectURL(href)
}

/** Foto del producto con la frase y el enlace impresos, porque Instagram no acepta un texto precargado. */
export async function instagramShareFile(args: {
  image: string
  phrase: string
  pageUrl: string
}) {
  if (!args.image) return null
  await document.fonts.load('600 44px Outfit').catch(() => undefined)
  await document.fonts.load('400 30px Outfit').catch(() => undefined)

  const src = absoluteAsset(args.image, window.location.origin)
  const bitmap = await loadBitmap(src)
  const width = 1080
  const photoHeight = Math.round((width * bitmap.height) / bitmap.width)
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return null
  measure.font = '600 44px Outfit, system-ui, sans-serif'
  const phraseLines = wrapLines(measure, args.phrase, width - 96).slice(0, 4)
  measure.font = '400 30px Outfit, system-ui, sans-serif'
  const linkLines = wrapLines(measure, args.pageUrl, width - 96).slice(0, 2)
  const footer = 64 + phraseLines.length * 56 + 20 + linkLines.length * 42 + 28

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = photoHeight + footer
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(bitmap, 0, 0, width, photoHeight)
  ctx.fillStyle = '#0b0b0b'
  ctx.fillRect(0, photoHeight, width, footer)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 44px Outfit, system-ui, sans-serif'
  phraseLines.forEach((line, index) => {
    ctx.fillText(line, 48, photoHeight + 72 + index * 56)
  })
  ctx.fillStyle = '#c4a574'
  ctx.font = '400 30px Outfit, system-ui, sans-serif'
  const linkTop = photoHeight + 72 + phraseLines.length * 56 + 16
  linkLines.forEach((line, index) => {
    ctx.fillText(line, 48, linkTop + index * 42)
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  bitmap.close()
  if (!blob) return null
  return new File([blob], 'kaprichos.jpg', { type: 'image/jpeg' })
}

const prepared = new Map<string, Promise<File | null>>()

export function prepareInstagramShare(args: { image: string; phrase: string; pageUrl: string }) {
  const key = `${args.image}\n${args.phrase}\n${args.pageUrl}`
  const cached = prepared.get(key)
  if (cached) return cached
  const pending = instagramShareFile(args)
    .then((file) => {
      if (!file) prepared.delete(key)
      return file
    })
    .catch(() => {
      prepared.delete(key)
      return null
    })
  prepared.set(key, pending)
  return pending
}

export async function shareProductOnInstagram(args: {
  image: string
  phrase: string
  pageUrl: string
  message: string
}) {
  const file = await prepareInstagramShare(args)

  const canShareFiles = Boolean(file && navigator.canShare?.({ files: [file] }))

  try {
    if (file && canShareFiles && navigator.share) {
      await navigator.share({
        files: [file],
        title: args.phrase,
        text: args.message,
      })
      return
    }

    if (file && !canShareFiles) downloadFile(file)

    if (navigator.share) {
      const data: ShareData = { title: args.phrase, text: args.message, url: args.pageUrl }
      if (!navigator.canShare || navigator.canShare(data)) {
        await navigator.share(data)
        return
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
  }

  try {
    await navigator.clipboard.writeText(args.message)
  } catch {
    /* el portapapeles puede estar bloqueado */
  }
}
