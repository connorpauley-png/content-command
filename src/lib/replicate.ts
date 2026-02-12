// Replicate API for Connor's LoRA image generation
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!

// Connor's trained LoRA model (on Flux Dev)
export const CONNOR_LORA_VERSION = 'f838ed705940a8553bee6ab2f9c88b46fb28e9ba5d647660f062c0afc5f51517'

// Alternative: Use lucataco/flux-dev-lora for more control
export const FLUX_DEV_LORA_VERSION = 'a22c463f11808638ad5e2ebd582e07a469031f48dd567366fb4c6fdab91d614d'
export const CONNOR_LORA_URL = 'https://replicate.delivery/xezq/YmWUfxb4Keud90cwzeSYTzRRlJFwkOx91lINdMBMQdfSj0WYB/trained_model.tar'

export interface GenerateImageOptions {
  prompt: string
  numOutputs?: number
  guidanceScale?: number
  numInferenceSteps?: number
  useHighQuality?: boolean
}

// Add realism boosters to prompt
function enhancePromptForRealism(prompt: string): string {
  const realismSuffix = ', professional photograph, shot on Canon EOS R5, 35mm film grain, natural skin texture, photorealistic, raw photo, highly detailed'
  // Don't double-add if already has realism keywords
  if (prompt.toLowerCase().includes('photorealistic') || prompt.toLowerCase().includes('raw photo')) {
    return prompt
  }
  return prompt + realismSuffix
}

// Start generation and return prediction ID immediately (non-blocking)
export async function startGeneration(options: GenerateImageOptions): Promise<{ predictionId: string; status: string }> {
  const { 
    prompt, 
    numOutputs = 2, 
    guidanceScale = 4.0, // Slightly higher for better prompt adherence
    numInferenceSteps = 32, // More steps for quality
    useHighQuality = true 
  } = options

  const enhancedPrompt = useHighQuality ? enhancePromptForRealism(prompt) : prompt

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: CONNOR_LORA_VERSION,
      input: {
        prompt: enhancedPrompt,
        num_outputs: numOutputs,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
        output_format: 'jpg', // JPG often looks more natural than webp
        output_quality: 95,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate API error: ${response.status} - ${error}`)
  }

  const prediction = await response.json()
  return { 
    predictionId: prediction.id, 
    status: prediction.status 
  }
}

// Check status of a prediction
export async function checkPrediction(predictionId: string): Promise<{
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string[]
  error?: string
}> {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to check prediction: ${response.status}`)
  }

  const result = await response.json()
  return {
    status: result.status,
    output: result.output,
    error: result.error,
  }
}

// Blocking version - waits for completion (legacy)
export async function generateImage(options: GenerateImageOptions): Promise<string[]> {
  const { predictionId } = await startGeneration(options)
  
  // Poll for completion
  let result = await checkPrediction(predictionId)
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 2000))
    result = await checkPrediction(predictionId)
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Image generation failed')
  }

  return result.output || []
}

// Prompt templates for common use cases
export const PROMPT_TEMPLATES = {
  professional: (scene: string) => 
    `a photo of connorpauley, young man with short curly brown hair and faded sides, blue-green eyes, ${scene}, professional photography, natural lighting`,
  
  casual: (scene: string) =>
    `a photo of connorpauley, young man with short curly brown hair and faded sides, ${scene}, candid lifestyle photography, natural daylight`,
  
  action: (activity: string) =>
    `a photo of connorpauley, young athletic man with short curly brown hair, ${activity}, action shot, outdoor setting`,
}
