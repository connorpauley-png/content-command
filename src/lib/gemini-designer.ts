import { ReactElement, createElement } from 'react'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

interface DesignRequest {
  templateType: string // quote_card, checklist, stat_card, etc.
  data: Record<string, unknown>
  brandColors: { primary?: string; accent?: string; background?: string; text?: string }
  width?: number
  height?: number
}

// Design system prompt — tells Gemini how to output Satori-compatible JSON
const SYSTEM_PROMPT = `You are a top-tier social media graphic designer. Your designs look like they came from a $10K/month agency. You make content that STOPS the scroll.

OUTPUT: Return ONLY valid JSON (no markdown, no code fences). Design tree format:
{ "tag": "div"|"span"|"p", "style": { ...camelCase CSS }, "children": [ nodes or strings ] }

SATORI CONSTRAINTS (non-negotiable — renderer crashes otherwise):
- Every div MUST have "display": "flex"
- Layout via flexDirection, alignItems, justifyContent, gap ONLY
- NO grid, NO float, NO position absolute/relative/fixed
- Allowed styles: display, flexDirection, flexWrap, alignItems, justifyContent, gap, paddingTop, paddingRight, paddingBottom, paddingLeft, marginTop, marginBottom, marginLeft, marginRight, width, height, maxWidth, minHeight, backgroundColor, color, fontSize, fontWeight, fontFamily, lineHeight, letterSpacing, textTransform, textAlign, borderRadius, border, borderTop, borderBottom, borderLeft, borderRight, overflow, opacity
- NO shorthand padding/margin — always use paddingTop/paddingRight/etc separately
- Tags: "div", "span", "p" ONLY. No svg, img, or custom tags
- Text = string in children array. Numbers as px (e.g. 80 not "80px")
- Colors as hex strings

DESIGN RULES — MAKE IT SCROLL-STOPPING:

LAYOUT:
- Root container: ALWAYS width 1080, height 1080, backgroundColor from brand
- Inner content container with generous padding (70-90px all sides)
- Use a THICK accent-colored vertical bar on the LEFT side (8-10px wide, full height) as a signature element
- Or a horizontal accent bar across the top (full width, 8px tall)

TYPOGRAPHY:
- Hero text (the quote, the stat, the headline): 64-80px, fontWeight 800, white on dark bg
- Supporting text: 32-40px, fontWeight 500
- Attribution/small text: 22-28px, fontWeight 400, use a muted color like #888888 or #aaaaaa
- NEVER center everything — left-align hero text for modern feel. Only center stat numbers.
- Line height: 1.2 for headlines, 1.5 for body

COLOR RULES:
- Background: use the brand background color (usually dark)
- Accent color: use for decorative elements ONLY — bars, borders, number highlights, small badges. NOT as large text backgrounds (hard to read)
- Primary color: use for subtle background sections or borders
- Text on dark bg: always white (#ffffff)
- Text on accent bg: always dark (#0a0a0a or #1a1a1a)
- Never put white text on a light/medium accent color — contrast fails

SPECIFIC TEMPLATE RULES:
- Quote cards: Big bold quote left-aligned, thick accent bar on left, author at bottom right in muted color. NO quote marks needed — the design implies it.
- Stat cards: The number should be MASSIVE (120-160px), accent colored. Label below at 40px white. Context below that at 24px muted.
- Checklists: Title in white with accent underline or accent left border. Items numbered with accent-colored large numbers (48px) next to white text (32px). Even spacing.
- Hot takes: Bold statement fills most of the card. Accent-colored word or phrase for emphasis. Provocative energy.
- Testimonials: Quote in white, large. Star rating as text (use the word "5 STARS" in accent color, bold). Name and location below.

SPACING:
- Gap between major sections: 40-60px
- Gap between list items: 30-40px
- Never less than 60px padding from edges
- Items should fill the space — if only 3 items, increase gap to fill vertically

CRITICAL RENDERING RULES:
- Text strings MUST be direct children of a div, span, or p — never nest text inside text
- Keep nesting under 5 levels deep — flatter is better
- Every div must have explicit width or be inside a flex parent
- The root div MUST have: width: 1080, height: 1080, display: "flex"
- If text is long, let it wrap naturally — do NOT try to break it manually
- Test in your head: would this render? If any style feels exotic, simplify it

NEVER use placeholder text. Use ONLY the exact content provided. Return ONLY the JSON.`

function buildPrompt(req: DesignRequest): string {
  const colorInfo = `Brand Colors:
- Primary: ${req.brandColors.primary || '#0a0a0a'}
- Accent: ${req.brandColors.accent || '#22c55e'}  
- Background: ${req.brandColors.background || '#0a0a0a'}
- Text: ${req.brandColors.text || '#ffffff'}`

  const typeGuide: Record<string, string> = {
    quote_card: 'Large bold quote as the centerpiece. Author/attribution smaller below. Use accent color for a highlight element (bar, underline, or background block).',
    checklist: 'Title at top in accent color block. List items with visual checkmarks or numbered markers. Each item clearly readable. Good spacing between items.',
    stat_card: 'One massive number as hero element (accent color). Label below in smaller text. Supporting context even smaller. The number should be HUGE.',
    hot_take: 'Bold controversial statement as hero text. Maybe a contrasting opinion below. High contrast, attention-grabbing. Think tweet-style but as a graphic.',
    numbers_grid: 'Multiple stats in a grid layout (2x2 or similar). Each stat has a big number and label. Clean borders or spacing between cells.',
    flyer: 'Event/service announcement. Clear headline, key details (date, price, location), and CTA. Structured like a professional flyer.',
    x_vs_y: 'Two-column comparison. Structure: one row div (flexDirection: row) containing two column divs (each width: "48%"). Left column has title + items, right column has title + items. Between them, place a thin vertical accent divider div (width: 4, backgroundColor: accent). Headers 36px bold in accent color. Items 24px white, each in its own div with marginBottom 20. CRITICAL: title and first item MUST be in SEPARATE divs with gap/margin between them — never overlap.',
    testimonial: 'Customer quote prominently displayed. Star rating (use text stars). Customer name and context below. Trust-building layout.',
    before_after: 'Split layout with "BEFORE" and "AFTER" labels. Space for descriptions of each state. Bold transformation narrative.',
    crew_spotlight: 'Team/person feature. Name prominently. Role/title. Fun fact or achievement. Professional but personable.',
  }

  return `Design a ${req.templateType.replace(/_/g, ' ')} graphic (${req.width || 1080}x${req.height || 1080}px).

${colorInfo}

Content data:
${JSON.stringify(req.data, null, 2)}

Style guide: ${typeGuide[req.templateType] || 'Clean modern social media graphic. Bold typography, strong hierarchy.'}

Return the JSON design tree. Root element should be a full-size container div.`
}

// Convert Gemini's JSON tree to React elements for Satori
function jsonToReact(node: Record<string, unknown>): ReactElement | string {
  if (typeof node === 'string') return node

  const tag = (node.tag as string) || 'div'
  const style = (node.style as Record<string, unknown>) || {}
  const children = (node.children as unknown[]) || []

  // Ensure every div with children has display: flex
  if (tag === 'div' && children.length > 0 && !style.display) {
    style.display = 'flex'
  }

  return createElement(
    tag,
    { style },
    ...children.map((child, i) => {
      if (typeof child === 'string') return child
      const el = jsonToReact(child as Record<string, unknown>)
      if (typeof el === 'string') return el
      return createElement(el.type, { ...el.props, key: i })
    })
  )
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Try direct parse
  try { return JSON.parse(text) } catch { /* continue */ }
  
  // Try extracting from code fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) } catch { /* continue */ }
  }

  // Try finding first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch { /* continue */ }
  }

  return null
}

export async function designTemplate(req: DesignRequest): Promise<{
  element: ReactElement
  width: number
  height: number
}> {
  const width = req.width || 1080
  const height = req.height || 1080

  const prompt = buildPrompt(req)

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err.slice(0, 200)}`)
  }

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('No response from OpenAI')
  }

  const designTree = extractJSON(text)
  if (!designTree) {
    throw new Error('Failed to parse design output')
  }

  // Validate the tree has actual text content (not just empty containers)
  const hasText = JSON.stringify(designTree).length > 200
  if (!hasText) {
    throw new Error('Design tree too sparse — likely missing content')
  }

  const element = jsonToReact(designTree) as ReactElement

  return { element, width, height }
}
