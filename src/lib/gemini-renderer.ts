/**
 * Gemini Image Generation Renderer
 * Uses Gemini 2.0 Flash to generate stunning Instagram graphics
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent'

const BRAND = {
  primary: '#254421',    // dark forest green
  accent: '#e2b93b',     // gold
  background: '#0a0a0a', // near black
  text: '#ffffff',       // white
  style: 'modern editorial, luxury brand aesthetic, Kinfolk/Cereal magazine inspired',
  texture: 'subtle paper grain texture, moody natural lighting, organic shadows',
}

function buildPrompt(template: string, data: Record<string, any>, brandColors?: object): string {
  const colors = { ...BRAND, ...(brandColors || {}) }
  const base = `Generate a stunning 1080x1080 square Instagram graphic. Style: ${colors.style}. Color palette: dark forest green (${colors.primary}), gold accents (${colors.accent}), near-black background (${colors.background}), white text (${colors.text}). ${colors.texture}. Professional agency quality, scroll-stopping design.`

  const prompts: Record<string, () => string> = {
    'quote-card': () => `${base}
Design a powerful quote card. Center the quote text with elegant serif typography. Add subtle botanical/nature elements in the corners using forest green tones. Gold accent line above and below the quote.
EXACT QUOTE TEXT: "${data.quote}"
EXACT AUTHOR: "— ${data.author}"
The text must be perfectly legible, centered, with generous whitespace. Think luxury magazine pull-quote.`,

    'stat-card': () => `${base}
Design a bold statistics card. The main number/stat should be MASSIVE and in gold (${colors.accent}), taking up ~40% of the frame. Label underneath in clean sans-serif white text. Context line at bottom in smaller muted text. Subtle geometric patterns in dark green in the background.
EXACT STAT: "${data.stat}"
EXACT LABEL: "${data.label}"
EXACT CONTEXT: "${data.context || ''}"`,

    'hot-take': () => `${base}
Design an edgy, attention-grabbing hot take card. Use a bold, slightly tilted layout with a fire/heat visual motif. The take text should be large, bold sans-serif in white. Gold accent elements. Dark moody background with subtle smoke or heat distortion texture.
EXACT TAKE TEXT: "${data.take}"
EXACT AUTHOR: "— ${data.author || ''}"`,

    'testimonial': () => `${base}
Design an elegant testimonial card. Large opening quotation mark in gold as a decorative element. The testimonial text in serif italic. Author name below in small caps. ${data.rating ? `Show ${data.rating} gold stars.` : ''} Subtle leaf/nature watermark in background.
EXACT QUOTE: "${data.quote}"
EXACT AUTHOR: "— ${data.author}"`,

    'checklist': () => `${base}
Design a clean, modern checklist graphic. Title at top in bold gold text. Each item has a gold checkmark or checkbox icon. Items listed vertically with clean spacing. Dark green sidebar accent. Minimalist layout.
EXACT TITLE: "${data.title}"
EXACT ITEMS:
${(data.items || []).map((item: string, i: number) => `${i + 1}. ✓ ${item}`).join('\n')}`,

    'before-after': () => `${base}
Design a dramatic before/after comparison card. Split the frame vertically — left side darker/muted for "before", right side brighter/vibrant for "after". Gold dividing line in center. Labels at top of each half. Description text at bottom.
EXACT BEFORE LABEL: "${data.beforeLabel}"
EXACT AFTER LABEL: "${data.afterLabel}"
EXACT DESCRIPTION: "${data.description || ''}"`,

    'flyer': () => `${base}
Design a premium event/promo flyer. Bold headline in gold at top. Subheadline in white below. Call-to-action button shape in gold with dark text. Details at bottom in smaller white text. Elegant botanical border elements in dark green. Magazine-quality layout.
EXACT HEADLINE: "${data.headline}"
EXACT SUBHEADLINE: "${data.subheadline || ''}"
EXACT CTA: "${data.cta || ''}"
EXACT DETAILS: "${data.details || ''}"`,

    'crew-spotlight': () => `${base}
Design a team member spotlight card. Space for a portrait photo placeholder (silhouette in dark green). Name in large gold text. Role in white small caps. Quote from the person in italic serif. Subtle nature/outdoor texture background. Professional but warm.
EXACT NAME: "${data.name}"
EXACT ROLE: "${data.role}"
EXACT QUOTE: "${data.quote || ''}"`,

    'numbers-grid': () => `${base}
Design a grid of impressive numbers/statistics. ${(data.numbers || []).length <= 4 ? '2x2 grid' : '3x2 grid'} layout. Each number is large and gold, with its label in smaller white text below. Subtle grid lines in dark green. Clean, data-visualization inspired.
EXACT NUMBERS:
${(data.numbers || []).map((n: any) => `"${n.value}" — ${n.label}`).join('\n')}`,

    'x-vs-y': () => `${base}
Design a bold comparison/versus graphic. Split layout with "${data.xLabel}" on the left and "${data.yLabel}" on the right. Gold "VS" in the center. List items for each side. Left side in green tones, right side in contrasting tone. Clean typography.
LEFT SIDE "${data.xLabel}":
${(data.xItems || []).map((i: string) => `• ${i}`).join('\n')}
RIGHT SIDE "${data.yLabel}":
${(data.yItems || []).map((i: string) => `• ${i}`).join('\n')}`,
  }

  const builder = prompts[template]
  if (!builder) throw new Error(`Unknown template: ${template}. Available: ${Object.keys(prompts).join(', ')}`)
  return builder()
}

export async function generateGeminiGraphic(
  template: string,
  data: Record<string, any>,
  brandColors?: object
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_STUDIO_KEY not set')

  const prompt = buildPrompt(template, data, brandColors)

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errBody}`)
  }

  const json = await res.json()
  const parts = json.candidates?.[0]?.content?.parts || []

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }

  throw new Error('Gemini returned no image. Response: ' + JSON.stringify(json).slice(0, 500))
}

export { buildPrompt }
