import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import type { AIConfig } from '@/types'

/**
 * Structured JSON Prompt Engine for Astria.ai
 * Based on @yebimov's E-COM PROMPT system (Google Nano Banana Pro 4K)
 * Every image variable is explicitly controlled — no vague prompts.
 */

const PROMPT_SCHEMA = `You are a structured image prompt engineer. You output a JSON object that controls EVERY aspect of the generated image.

OUTPUT THIS EXACT JSON STRUCTURE (fill in values based on the post content):
{
  "scene_concept": {
    "description": "One sentence describing the complete scene",
    "environment": "Where this takes place — specific location details",
    "setting_style": "Overall visual style — e.g. Modern, raw, contemplative, editorial"
  },
  "primary_subjects": [{
    "type": "person or object",
    "subtype": "TRIGGER_WORD or object description",
    "interaction": "What the subject is DOING — specific action and body position",
    "visibility": "What's visible — back, shoulders, hair, clothing details"
  }],
  "composition": {
    "camera_angle": "Specific angle — e.g. Low angle from behind, slightly below eye level",
    "framing": "Shot type — e.g. Medium shot, subject centered with horizon at upper third",
    "depth_of_field": "Shallow/medium/deep + what's in focus vs blurred",
    "symmetrical": false
  },
  "lighting": {
    "type": "Specific light source — e.g. Golden hour backlighting",
    "shadow": "Shadow description — e.g. Long shadows cast forward, warm rim light",
    "exposure": "Exposure style — e.g. Slightly overexposed highlights, warm",
    "highlights": "Where light catches — e.g. Lens flare from sun, golden rim on hair"
  },
  "color_palette": {
    "dominant": "Primary colors — e.g. Warm golden orange and pink",
    "contrast": "Color contrast — e.g. Dark figure silhouetted against bright sky",
    "temperature": "Warm/cool/neutral — be specific"
  },
  "texture_details": {
    "ground_surface": "What's underfoot — e.g. Weathered wooden dock planks with visible grain",
    "fabric": "Clothing texture — e.g. Soft cotton t-shirt with natural wrinkles",
    "props": "Other textures — e.g. Calm water reflections"
  },
  "mood_and_aesthetic": {
    "mood": "Emotional tone — e.g. Contemplative, peaceful, reflective",
    "vibe": "Cultural vibe — e.g. End of a long day, earned rest",
    "era_reference": "What era/style — e.g. Modern iPhone candid"
  },
  "style": {
    "photography_style": "e.g. iPhone candid photography, editorial street, documentary",
    "post_processing": "e.g. Natural tones, slight warm grade, minimal editing, subtle grain"
  },
  "camera_settings": {
    "lens": "e.g. 35mm equivalent iPhone lens",
    "aperture": "e.g. f/1.8 portrait mode",
    "clarity": "e.g. Sharp subject, soft background",
    "resolution": "4K, high resolution with crisp detail"
  }
}

Return ONLY the JSON. No markdown, no explanation.`

function buildPersonalSystem(): string {
  return `${PROMPT_SCHEMA}

SUBJECT RULES (MANDATORY — NEVER BREAK THESE):
- "subtype" MUST be "ohwx man" (the LoRA trigger)
- ALWAYS shot from BEHIND or over-the-shoulder. NEVER facing camera. NEVER eye contact.
- Subject: curly/wavy brown hair, thin chain necklace, casual gray t-shirt or crewneck
- Body language: relaxed, contemplative, purposeful — never posed or stiff

SETTING SELECTION (pick based on post mood):
- Reflective/grateful posts → dock at sunset, open field at golden hour, lake overlook
- Work/hustle/operations → white work truck, truck tailgate with laptop, job site walk
- Growth/learning/ambition → college campus path, coffee shop over-shoulder, home office window desk
- Community/people → walking through neighborhood, standing in front of finished property
- General/inspirational → walking shot on path, standing at field edge, morning light sidewalk

STYLE: iPhone candid. NOT professional photography. Shot by a friend. Natural, real, slightly imperfect.`
}

function buildBusinessSystem(businessName?: string, industry?: string): string {
  return `${PROMPT_SCHEMA}

SUBJECT RULES:
- NO people in the shot. Just the finished work result.
- "subtype" should describe the completed service result
- Focus on satisfying before/after transformation and clean professional results

SETTINGS FOR ${businessName || 'outdoor service business'} (${industry || 'home services'}):
- Landscaping → fresh dark mulch in curved beds, defined edges, green plants, residential home backdrop
- Lawn care → perfectly striped fresh-cut lawn, crisp edging, morning dew, suburban house
- Pressure washing → half-clean driveway showing dramatic contrast, concrete transformation
- Cleanup → clean property after debris removal, organized yard, neat landscape
- General → tools and equipment staged neatly, clean truck setup, professional gear layout

STYLE: iPhone photo quality. Natural daylight. Satisfying results. Real residential properties. Documentary, not staged.`
}

function flattenJson(json: Record<string, unknown>, trigger?: string): string {
  const parts: string[] = []
  if (trigger) parts.push(trigger)

  function extract(obj: unknown) {
    if (typeof obj === 'string' && obj.length > 0) {
      parts.push(obj)
    } else if (Array.isArray(obj)) {
      obj.forEach(extract)
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(extract)
    }
  }

  extract(json)
  return parts.join(', ')
}

export async function POST(request: Request) {
  try {
    const { content, accountPersonality, businessName, industry, aiConfig } = await request.json()

    if (!content || !aiConfig) {
      return NextResponse.json({ error: 'content and aiConfig are required' }, { status: 400 })
    }

    const isPersonal = accountPersonality === 'personal'
    const systemPrompt = isPersonal ? buildPersonalSystem() : buildBusinessSystem(businessName, industry)

    const config: AIConfig = aiConfig
    const result = await generateContent(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this post and generate a structured image prompt JSON. Pick the setting that best matches the post's mood and topic. Make every field specific and detailed — no generic values.\n\nPOST:\n"${content}"` },
    ])

    // Parse the JSON response and flatten it into a prompt string
    let prompt: string
    try {
      const cleaned = result.trim().replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
      const structured = JSON.parse(cleaned)
      const trigger = isPersonal ? 'ohwx man' : undefined
      prompt = flattenJson(structured, trigger)
    } catch {
      // If AI didn't return valid JSON, use the raw text as fallback
      prompt = result.trim()
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
