import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { TEMPLATE_REGISTRY } from './templates'
import type { TemplateData } from './templates'

let fontCache: { name: string; data: ArrayBuffer; weight: number; style: string }[] | null = null

const FONT_URLS = [
  { name: 'Newsreader', url: 'https://fonts.gstatic.com/s/newsreader/v20/cY9qfjOCX1hbuyalUrK439vogqC9yFZCYg7oRZaLP4obnf7fTXglsMyoTe-Rp0E.ttf', weight: 400, style: 'normal' },
  { name: 'Inter', url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff', weight: 400, style: 'normal' },
  { name: 'Inter', url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff', weight: 700, style: 'normal' },
  { name: 'IBM Plex Mono', url: 'https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n3oQIwlBFhA.woff', weight: 500, style: 'normal' },
]

async function loadFonts() {
  if (fontCache) return fontCache
  fontCache = await Promise.all(
    FONT_URLS.map(async (f) => {
      const res = await fetch(f.url)
      const data = await res.arrayBuffer()
      return { name: f.name, data, weight: f.weight, style: f.style }
    })
  )
  return fontCache
}

export async function renderTemplate(
  templateName: string,
  data: TemplateData,
  options?: { width?: number; height?: number }
): Promise<Buffer> {
  const width = options?.width || 1080
  const height = options?.height || 1080

  const templateFn = TEMPLATE_REGISTRY[templateName]
  if (!templateFn) {
    throw new Error(`Unknown template: ${templateName}. Available: ${Object.keys(TEMPLATE_REGISTRY).join(', ')}`)
  }

  const element = templateFn(data)
  const fonts = await loadFonts()

  const svg = await satori(element as React.ReactElement, {
    width,
    height,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fonts: fonts as any,
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
  })
  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}
