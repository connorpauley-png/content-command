'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { IntegrationsConfig } from '@/types'

interface Props {
  config: IntegrationsConfig
  onChange: (config: IntegrationsConfig) => void
}

export function StepIntegrations({ config, onChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        These are optional integrations that enhance your content. Skip if you don&apos;t need them.
      </p>

      <div className="space-y-4 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📸</span>
          <div>
            <p className="font-medium">CompanyCam</p>
            <p className="text-xs text-muted-foreground">Pull job photos for social media content</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>API Token</Label>
          <Input
            type="password"
            value={config.companycam?.apiToken || ''}
            onChange={(e) =>
              onChange({ ...config, companycam: { apiToken: e.target.value } })
            }
            placeholder="CompanyCam API token"
          />
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌤️</span>
          <div>
            <p className="font-medium">Weather-Triggered Content</p>
            <p className="text-xs text-muted-foreground">Auto-generate posts based on weather conditions</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={config.weather?.location || ''}
            onChange={(e) =>
              onChange({ ...config, weather: { location: e.target.value } })
            }
            placeholder="e.g., Monroe, LA"
          />
        </div>
      </div>
    </div>
  )
}
