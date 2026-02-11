// Astria API for Connor's FaceID image generation
const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY || ''

// Connor's FaceID tune on Nano Banana Pro 2
export const DEFAULT_TUNE_ID = Number(process.env.ASTRIA_TUNE_ID) || 0
export const BASE_TUNE_ID = 3618064 // Nano Banana Pro 2 (Gemini 3)

export interface GenerateImageOptions {
  prompt: string
  numImages?: number
}

// Start generation and return prompt ID (non-blocking)
export async function startGeneration(options: GenerateImageOptions): Promise<{ promptId: number; status: string }> {
  const { prompt, numImages = 2 } = options

  // FaceID automatically injects face - prompt format: <faceid:TUNE_ID:STRENGTH> prompt
  const fullPrompt = `<faceid:${CONNOR_TUNE_ID}:1.0> ${prompt}`

  const response = await fetch(`https://api.astria.ai/tunes/${CONNOR_TUNE_ID}/prompts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ASTRIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: {
        text: fullPrompt,
        num_images: numImages,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Astria API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return { 
    promptId: data.id, 
    status: 'processing' 
  }
}

// Check status of a prompt
export async function checkPrompt(promptId: number): Promise<{
  status: 'processing' | 'completed' | 'failed'
  images?: string[]
  error?: string
}> {
  const response = await fetch(`https://api.astria.ai/tunes/${BASE_TUNE_ID}/prompts/${promptId}`, {
    headers: {
      'Authorization': `Bearer ${ASTRIA_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to check prompt: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.images && data.images.length > 0) {
    return {
      status: 'completed',
      images: data.images,
    }
  }
  
  if (data.user_error) {
    return {
      status: 'failed',
      error: data.user_error,
    }
  }

  return { status: 'processing' }
}

// Blocking version - waits for completion
export async function generateImage(options: GenerateImageOptions): Promise<string[]> {
  const { promptId } = await startGeneration(options)
  
  // Poll for completion (max 3 min)
  const maxAttempts = 36
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    const result = await checkPrompt(promptId)
    
    if (result.status === 'completed' && result.images) {
      return result.images
    }
    if (result.status === 'failed') {
      throw new Error(result.error || 'Generation failed')
    }
  }
  
  throw new Error('Generation timed out')
}
