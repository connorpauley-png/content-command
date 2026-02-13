import type { AIConfig } from '@/types'

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function generateContent(config: AIConfig, messages: AIMessage[]): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return callOpenAI(config.apiKey, messages, config.model)
    case 'anthropic':
      return callAnthropic(config.apiKey, messages, config.model)
    case 'google':
      return callGoogle(config.apiKey, messages, config.model)
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`)
  }
}

async function callOpenAI(apiKey: string, messages: AIMessage[], model?: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'OpenAI API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callAnthropic(apiKey: string, messages: AIMessage[], model?: string): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const userMessages = messages.filter((m) => m.role !== 'system')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemMsg?.content,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Anthropic API error')
  }

  const data = await res.json()
  return data.content[0].text
}

async function callGoogle(apiKey: string, messages: AIMessage[], model?: string): Promise<string> {
  const modelName = model || 'gemini-2.5-flash'
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = messages.find((m) => m.role === 'system')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Google AI API error')
  }

  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

export async function testAIConnection(config: AIConfig): Promise<boolean> {
  try {
    const result = await generateContent(config, [
      { role: 'user', content: 'Say "connected" and nothing else.' },
    ])
    return result.toLowerCase().includes('connected')
  } catch {
    return false
  }
}
