/**
 * IMAGE ENGINE — Structured JSON Prompt System
 * Based on @yebimov's E-COM PROMPT engine for Google Nano Banana Pro 4K
 * Adapted for College Bros + Connor's personal brand on Astria
 * 
 * Each prompt is a structured JSON that gets flattened into a natural language prompt.
 * This gives consistent, high-quality results by controlling every aspect of the image.
 */

export interface ImagePrompt {
  scene_concept: {
    description: string
    environment: string
    setting_style: string
  }
  primary_subjects: Array<{
    type: string
    subtype: string
    interaction: string
    visibility: string
  }>
  composition: {
    camera_angle: string
    framing: string
    spacing: string
    depth_of_field: string
    symmetrical: boolean
  }
  lighting: {
    type: string
    shadow: string
    exposure: string
    highlights: string
  }
  color_palette: {
    dominant: string
    contrast: string
    temperature: string
  }
  texture_details: {
    ground_surface: string
    fabric: string
    props: string
  }
  mood_and_aesthetic: {
    mood: string
    vibe: string
    era_reference: string
  }
  style: {
    photography_style: string
    post_processing: string
    reference: string
  }
  camera_settings: {
    lens: string
    aperture: string
    clarity: string
    resolution: string
  }
}

// Flatten a structured prompt into natural language for Astria
export function flattenPrompt(prompt: ImagePrompt, loraTriger?: string): string {
  const parts: string[] = []

  if (loraTriger) parts.push(loraTriger)

  // Scene
  parts.push(prompt.scene_concept.description)
  parts.push(prompt.scene_concept.environment)
  parts.push(prompt.scene_concept.setting_style)

  // Subjects
  for (const s of prompt.primary_subjects) {
    parts.push(`${s.type}: ${s.subtype}`)
    if (s.interaction) parts.push(s.interaction)
    if (s.visibility) parts.push(s.visibility)
  }

  // Composition
  parts.push(prompt.composition.camera_angle)
  parts.push(prompt.composition.framing)
  parts.push(prompt.composition.depth_of_field)

  // Lighting
  parts.push(`${prompt.lighting.type} lighting`)
  parts.push(prompt.lighting.shadow)
  parts.push(prompt.lighting.exposure)

  // Color
  parts.push(`${prompt.color_palette.dominant} tones`)
  parts.push(prompt.color_palette.contrast)
  parts.push(prompt.color_palette.temperature)

  // Texture
  if (prompt.texture_details.ground_surface) parts.push(prompt.texture_details.ground_surface)
  if (prompt.texture_details.fabric) parts.push(prompt.texture_details.fabric)
  if (prompt.texture_details.props) parts.push(prompt.texture_details.props)

  // Mood
  parts.push(prompt.mood_and_aesthetic.mood)
  parts.push(prompt.mood_and_aesthetic.vibe)

  // Style
  parts.push(prompt.style.photography_style)
  parts.push(prompt.style.post_processing)

  // Camera
  parts.push(prompt.camera_settings.lens)
  parts.push(prompt.camera_settings.clarity)
  parts.push(prompt.camera_settings.resolution)

  return parts.filter(Boolean).join(', ')
}

// ===== PERSONAL BRAND PROMPT TEMPLATES =====

export const PERSONAL_TEMPLATES: ImagePrompt[] = [
  {
    scene_concept: {
      description: "A minimalist streetwear scene featuring a young man from behind, sitting on a wooden dock edge",
      environment: "Outdoor lake dock with flat calm water reflecting golden sunset sky",
      setting_style: "Natural, raw, contemplative, editorial"
    },
    primary_subjects: [{
      type: "person",
      subtype: "ohwx man",
      interaction: "Sitting casually on dock edge, legs dangling, back to camera",
      visibility: "Back and shoulders visible, curly brown hair, chain necklace, gray t-shirt"
    }],
    composition: {
      camera_angle: "Low angle from behind, slightly below eye level",
      framing: "Medium shot, subject centered with horizon at upper third",
      spacing: "Negative space in sky above",
      depth_of_field: "Shallow, background softly blurred",
      symmetrical: false
    },
    lighting: {
      type: "Golden hour backlighting",
      shadow: "Long shadows cast forward, warm rim light on shoulders",
      exposure: "Slightly overexposed highlights, warm",
      highlights: "Lens flare from sun, golden rim on hair"
    },
    color_palette: {
      dominant: "Warm golden orange and pink",
      contrast: "Dark figure silhouetted against bright sky",
      temperature: "Very warm, sunset tones"
    },
    texture_details: {
      ground_surface: "Weathered wooden dock planks with visible grain",
      fabric: "Soft cotton t-shirt with natural wrinkles",
      props: "Calm water reflections"
    },
    mood_and_aesthetic: {
      mood: "Contemplative, peaceful, reflective",
      vibe: "End of a long day, earned rest",
      era_reference: "Modern iPhone candid"
    },
    style: {
      photography_style: "iPhone candid photography",
      post_processing: "Natural tones, slight warm grade, minimal editing",
      reference: "Instagram lifestyle, not professional"
    },
    camera_settings: {
      lens: "35mm equivalent iPhone lens",
      aperture: "f/1.8 portrait mode",
      clarity: "Sharp subject, soft background",
      resolution: "4K, high resolution"
    }
  },
  {
    scene_concept: {
      description: "A young entrepreneur working in a coffee shop, shot from behind over the shoulder",
      environment: "Modern coffee shop interior with warm ambient lighting and window light",
      setting_style: "Urban, modern, creative workspace"
    },
    primary_subjects: [{
      type: "person",
      subtype: "ohwx man",
      interaction: "Working on MacBook Pro with dark code editor on screen, slightly hunched forward",
      visibility: "Back of head and shoulders, curly brown hair, gray crewneck, chain necklace"
    }],
    composition: {
      camera_angle: "Over-the-shoulder from behind, slightly elevated",
      framing: "Medium close-up, laptop screen partially visible",
      spacing: "Bokeh background with other patrons and warm lights",
      depth_of_field: "Very shallow, only subject and screen in focus",
      symmetrical: false
    },
    lighting: {
      type: "Natural window sidelight mixed with warm ambient",
      shadow: "Soft shadows on keyboard, warm fill from cafe lights",
      exposure: "Balanced, slightly warm",
      highlights: "Screen glow on face edge, window light on shoulder"
    },
    color_palette: {
      dominant: "Warm neutral browns and cream",
      contrast: "Cool screen light vs warm ambient",
      temperature: "Warm overall"
    },
    texture_details: {
      ground_surface: "Wooden cafe table surface",
      fabric: "Soft crewneck with natural drape",
      props: "Coffee cup nearby, laptop, phone on table"
    },
    mood_and_aesthetic: {
      mood: "Focused, productive, in the zone",
      vibe: "Hustle culture but authentic, not staged",
      era_reference: "Modern iPhone candid"
    },
    style: {
      photography_style: "iPhone candid street photography",
      post_processing: "Natural tones, clean contrast, subtle grain",
      reference: "Shot by a friend sitting across the table"
    },
    camera_settings: {
      lens: "50mm equivalent",
      aperture: "f/1.8",
      clarity: "Sharp on subject, heavy bokeh background",
      resolution: "4K"
    }
  },
  {
    scene_concept: {
      description: "A young man walking across a freshly maintained lawn toward a white work truck",
      environment: "Residential neighborhood, early morning light, clean property",
      setting_style: "Real work life, candid, documentary"
    },
    primary_subjects: [{
      type: "person",
      subtype: "ohwx man",
      interaction: "Walking away from camera toward truck, purposeful stride",
      visibility: "Full body from behind, casual gray t-shirt, work boots"
    }],
    composition: {
      camera_angle: "Eye level from behind, straight on",
      framing: "Wide shot showing full property and truck",
      spacing: "Subject in lower third, truck in distance",
      depth_of_field: "Medium depth, most of scene in focus",
      symmetrical: false
    },
    lighting: {
      type: "Early morning golden directional light",
      shadow: "Long shadows stretching toward camera",
      exposure: "Clean, well-exposed",
      highlights: "Morning sun catching truck chrome and dew on grass"
    },
    color_palette: {
      dominant: "Green grass, white truck, blue sky",
      contrast: "Warm morning light on cool green lawn",
      temperature: "Warm morning"
    },
    texture_details: {
      ground_surface: "Fresh-cut green lawn with visible stripes",
      fabric: "Casual work clothes, natural movement wrinkles",
      props: "White work truck with equipment in bed"
    },
    mood_and_aesthetic: {
      mood: "Ready to work, early grind, motivated",
      vibe: "Owner-operator starting the day",
      era_reference: "Documentary iPhone"
    },
    style: {
      photography_style: "iPhone documentary candid",
      post_processing: "Natural, clean, slightly lifted shadows",
      reference: "Crew member snapped this on their phone"
    },
    camera_settings: {
      lens: "28mm wide angle",
      aperture: "f/2.4",
      clarity: "Overall sharp, natural",
      resolution: "4K"
    }
  },
  {
    scene_concept: {
      description: "A young man sitting on the tailgate of a truck with laptop, working between jobs",
      environment: "Job site parking area, midday sun, residential area behind",
      setting_style: "Real, authentic, mobile office"
    },
    primary_subjects: [{
      type: "person",
      subtype: "ohwx man",
      interaction: "Sitting on open tailgate, laptop on lap, looking at screen, back angled to camera",
      visibility: "3/4 rear view, curly hair, chain necklace, casual tee"
    }],
    composition: {
      camera_angle: "Slightly below eye level, 3/4 rear angle",
      framing: "Medium shot including truck bed and tailgate",
      spacing: "Subject off-center right, work equipment visible left",
      depth_of_field: "Shallow, background residential blur",
      symmetrical: false
    },
    lighting: {
      type: "Midday overhead sun with natural fill",
      shadow: "Hard shadows under truck, softer on subject",
      exposure: "Bright, slightly blown highlights on truck",
      highlights: "Sun catching laptop screen, chrome on truck"
    },
    color_palette: {
      dominant: "White truck, neutral clothing, green background",
      contrast: "Bright midday tones",
      temperature: "Neutral to warm"
    },
    texture_details: {
      ground_surface: "Concrete or gravel parking area",
      fabric: "Worn casual t-shirt, relaxed fit",
      props: "Laptop, phone, water bottle on tailgate"
    },
    mood_and_aesthetic: {
      mood: "Multitasking, building something between jobs",
      vibe: "Entrepreneur who doesn't stop, field office lifestyle",
      era_reference: "Modern candid"
    },
    style: {
      photography_style: "iPhone candid documentary",
      post_processing: "Natural, punchy, clean",
      reference: "Candid shot someone else took"
    },
    camera_settings: {
      lens: "35mm equivalent",
      aperture: "f/1.8 portrait mode",
      clarity: "Sharp subject, soft background",
      resolution: "4K"
    }
  },
  {
    scene_concept: {
      description: "A young man standing at the edge of an open field, looking out at the horizon at golden hour",
      environment: "Louisiana open field, tall grass, expansive sky with clouds",
      setting_style: "Cinematic, contemplative, wide open"
    },
    primary_subjects: [{
      type: "person",
      subtype: "ohwx man",
      interaction: "Standing still, hands at sides or in pockets, back to camera, gazing forward",
      visibility: "Full body from behind, silhouette-like, casual clothing"
    }],
    composition: {
      camera_angle: "Eye level from behind, centered",
      framing: "Wide shot, subject small against vast landscape",
      spacing: "Subject in center-lower third, sky dominates upper 2/3",
      depth_of_field: "Deep focus, everything sharp",
      symmetrical: true
    },
    lighting: {
      type: "Golden hour side/backlighting",
      shadow: "Long dramatic shadow toward camera",
      exposure: "Rich, not overexposed, warm",
      highlights: "Golden rim light on shoulders and hair"
    },
    color_palette: {
      dominant: "Golden amber, deep green grass, warm sky",
      contrast: "Dark figure against bright horizon",
      temperature: "Very warm golden"
    },
    texture_details: {
      ground_surface: "Tall grass and wildflowers",
      fabric: "Simple t-shirt catching wind slightly",
      props: "None — just the person and landscape"
    },
    mood_and_aesthetic: {
      mood: "Visionary, looking forward, big picture thinking",
      vibe: "Building an empire, quiet confidence",
      era_reference: "Cinematic iPhone"
    },
    style: {
      photography_style: "Cinematic landscape portrait",
      post_processing: "Rich warm grade, lifted blacks, film-like",
      reference: "Movie poster wide shot"
    },
    camera_settings: {
      lens: "24mm wide angle",
      aperture: "f/2.8",
      clarity: "Overall sharp, slight haze in distance",
      resolution: "4K cinematic"
    }
  }
]

// ===== BUSINESS (NO PEOPLE) PROMPT TEMPLATES =====

export const BUSINESS_TEMPLATES: ImagePrompt[] = [
  {
    scene_concept: {
      description: "A freshly mulched landscape bed with clean edges along a residential home's front walkway",
      environment: "Residential front yard, clear sunny day, well-maintained property",
      setting_style: "Clean, satisfying, professional result"
    },
    primary_subjects: [{
      type: "landscape",
      subtype: "Completed mulch and bed work",
      interaction: "Fresh dark mulch with defined curved edges, green plants emerging",
      visibility: "Full bed visible with house as backdrop"
    }],
    composition: {
      camera_angle: "Slightly elevated, looking down the bed line",
      framing: "Wide shot showing full scope of work",
      spacing: "Bed fills foreground, house provides context",
      depth_of_field: "Medium, most in focus",
      symmetrical: false
    },
    lighting: {
      type: "Natural midday sun",
      shadow: "Clean shadows from plants and house",
      exposure: "Well-exposed, vibrant colors",
      highlights: "Sun catching fresh mulch moisture"
    },
    color_palette: {
      dominant: "Rich dark brown mulch, vibrant green plants",
      contrast: "Dark mulch against green lawn edge",
      temperature: "Neutral to warm"
    },
    texture_details: {
      ground_surface: "Fresh shredded mulch with visible texture",
      fabric: "",
      props: "Clean concrete walkway, manicured lawn edge"
    },
    mood_and_aesthetic: {
      mood: "Satisfying, professional, clean",
      vibe: "This is what quality looks like",
      era_reference: "Real job site iPhone photo"
    },
    style: {
      photography_style: "iPhone documentation, slightly elevated angle",
      post_processing: "Natural, slightly saturated greens",
      reference: "Portfolio shot"
    },
    camera_settings: {
      lens: "28mm iPhone wide",
      aperture: "f/2.4",
      clarity: "Sharp throughout",
      resolution: "4K"
    }
  }
]

/**
 * Generate a random personal brand prompt with variation
 */
export function generatePersonalPrompt(): string {
  const template = PERSONAL_TEMPLATES[Math.floor(Math.random() * PERSONAL_TEMPLATES.length)]
  return flattenPrompt(template, 'ohwx man')
}

/**
 * Generate a random business prompt
 */
export function generateBusinessPrompt(): string {
  const template = BUSINESS_TEMPLATES[Math.floor(Math.random() * BUSINESS_TEMPLATES.length)]
  return flattenPrompt(template)
}
