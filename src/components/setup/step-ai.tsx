'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'
import type { AIConfig, AIProvider } from '@/types'

const providers: { id: AIProvider; name: string; description: string; icon: string }[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5', icon: '🤖' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 4 Sonnet, Claude 3.5', icon: '🧠' },
  { id: 'google', name: 'Google', description: 'Gemini Pro, Gemini Ultra', icon: '✨' },
]

interface Props {
  config: AIConfig
  onChange: (config: AIConfig) => void
}

export function StepAIProvider({ config, onChange }: Props) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/setup/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      setTestResult(data.success)
    } catch {
      setTestResult(false)
    }
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Choose your AI provider</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange({ ...config, provider: p.id })
                setTestResult(null)
              }}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center',
                config.provider === p.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            placeholder={`Enter your ${providers.find((p) => p.id === config.provider)?.name} API key`}
            value={config.apiKey}
            onChange={(e) => {
              onChange({ ...config, apiKey: e.target.value })
              setTestResult(null)
            }}
          />
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!config.apiKey || testing}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
          </Button>
        </div>
        {testResult !== null && (
          <div className="flex items-center gap-2 mt-2">
            {testResult ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" /> Connection failed
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
